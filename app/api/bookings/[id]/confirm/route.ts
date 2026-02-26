import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserContext } from '@/lib/permissions';
import { BOARD_TYPES } from '@/lib/constants';
import { format } from 'date-fns';
import type { Prisma, BoardType, VoucherType } from '@prisma/client';

// ── Derived types from Prisma schema ──

/** The shape of the quotation query with all includes */
type QuotationWithRelations = Prisma.QuotationGetPayload<{
  include: {
    customer: true;
    passengers: true;
    quotationHotels: {
      include: { hotel: { include: { city: true } }; roomType: true };
    };
    quotationCars: true;
    quotationServices: {
      include: { service: { include: { city: true } } };
    };
  };
}>;

/** A single quotation service with its service + city relation */
type QuotationServiceWithRelations = QuotationWithRelations['quotationServices'][number];

/** Request body shape for POST /api/bookings/[id]/confirm */
interface ConfirmBookingBody {
  notes?: string;
  hotelNotes?: Record<string, string>;
  hotelNotesTr?: Record<string, string>;
}

/** Shape for voucher creation input (without bookingId — Prisma nests it) */
interface VoucherCreateInput {
  voucherType: VoucherType;
  voucherCode: string;
  hotelId?: string;
  guestNameAr: string;
  guestNameTr: string;
  checkIn?: Date;
  checkOut?: Date;
  roomTypeAr?: string;
  roomTypeTr?: string;
  boardAr?: string;
  boardTr?: string;
  notesAr?: string;
  notesTr?: string;
  createdBy?: string;
}

// POST /api/bookings/[id]/confirm — Create booking + generate vouchers
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userContext = await getUserContext();
    if (!userContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: quotationId } = await params;
    const body = (await request.json()) as ConfirmBookingBody;

    const quotation: QuotationWithRelations | null = await prisma.quotation.findUnique({
      where: { id: quotationId },
      include: {
        customer: true,
        passengers: true,
        quotationHotels: { include: { hotel: { include: { city: true } }, roomType: true } },
        quotationCars: true,
        quotationServices: { include: { service: { include: { city: true } } } },
      },
    });

    if (!quotation) return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    if (quotation.status !== 'confirmed') return NextResponse.json({ error: 'Quotation must be confirmed' }, { status: 400 });

    const existing = await prisma.booking.findFirst({ where: { quotationId }, include: { vouchers: true } });
    
    if (existing && existing.status === 'confirmed') {
      return NextResponse.json({ error: 'Booking exists and is already confirmed', bookingId: existing.id }, { status: 409 });
    }
    if (existing && existing.vouchers.length > 0) {
      return NextResponse.json({ error: 'Vouchers already exist for this booking', bookingId: existing.id }, { status: 409 });
    }

    const yr = new Date().getFullYear().toString().slice(-2);
    const cnt = await prisma.booking.count();
    const bookingRef = `BK-${yr}-${(cnt + 1).toString().padStart(5, '0')}`;

    const lead = quotation.passengers?.[0];
    const guestAr = lead?.name || quotation.customer?.nameAr || 'غير محدد';
    const guestTr = lead?.name || quotation.customer?.nameAr || 'Belirtilmemiş';

    const vouchers: VoucherCreateInput[] = [];
    let vi = 1;
    const generateUniqueCode = (): string => { 
      // Just numbers like 3364
      return Math.floor(1000 + Math.random() * 9000).toString() + (vi++).toString(); 
    };

    for (const h of quotation.quotationHotels) {
      const b = h.board as BoardType;
      const boardInfo = BOARD_TYPES[b as keyof typeof BOARD_TYPES];
      vouchers.push({
        voucherType: 'hotel',
        voucherCode: generateUniqueCode(),
        hotelId: h.hotelId,
        guestNameAr: guestAr,
        guestNameTr: guestTr,
        checkIn: h.checkIn,
        checkOut: h.checkOut,
        roomTypeAr: h.roomType?.nameAr || '',
        roomTypeTr: h.roomType?.nameTr || h.roomType?.nameAr || '',
        boardAr: boardInfo?.ar || h.board,
        boardTr: boardInfo?.tr || h.board,
        notesAr: h.notes || body.hotelNotes?.[h.id] || '',
        notesTr: h.notes || body.hotelNotesTr?.[h.id] || '',
        createdBy: userContext.employeeId,
      });
    }

    for (const c of quotation.quotationCars) {
      vouchers.push({
        voucherType: 'transportation',
        voucherCode: generateUniqueCode(),
        guestNameAr: guestTr,
        guestNameTr: guestTr,
        notesAr: `${c.carTypeAr} | ${c.pickupLocation}${c.dropoffLocation ? ` → ${c.dropoffLocation}` : ''}`,
        notesTr: `${c.carTypeAr} | ${c.pickupLocation}${c.dropoffLocation ? ` → ${c.dropoffLocation}` : ''}`,
        createdBy: userContext.employeeId,
      });
    }

    // فاوتشر واحد يجمع كل الخدمات (جولات + خدمات أخرى)
    const allServices: QuotationServiceWithRelations[] = quotation.quotationServices || [];

    const formatServiceLine = (s: QuotationServiceWithRelations): string => {
      const nameEn = s.service?.nameEn || s.nameAr || s.service?.nameAr || 'Service';
      const cityEn = s.service?.city?.nameTr || '-';
      const dateStr = s.serviceDate ? format(new Date(s.serviceDate), 'dd-MM-yyyy') : '';
      return `• ${nameEn} (${cityEn})${dateStr ? ` — ${dateStr}` : ''}`;
    };

    const linesEn = allServices.map(formatServiceLine).join('\n');
    const linesAr = allServices.map(formatServiceLine).join('\n');

    if (allServices.length > 0) {
      vouchers.push({
        voucherType: 'other',
        voucherCode: generateUniqueCode(),
        guestNameAr: guestTr,
        guestNameTr: guestTr,
        notesAr: linesAr,
        notesTr: linesEn,
        createdBy: userContext.employeeId,
      });
    }

    const bookingInclude = {
      vouchers: { include: { hotel: true } },
      quotation: { include: { customer: true } },
    } satisfies Prisma.BookingInclude;

    const booking = await prisma.$transaction(async (tx) => {
      // If there is an existing pending booking without vouchers, we just update it
      if (existing) {
        return tx.booking.update({
          where: { id: existing.id },
          data: {
            status: 'confirmed',
            notes: body.notes || existing.notes,
            vouchers: { create: vouchers },
          },
          include: bookingInclude,
        });
      }

      // Otherwise we create a new one
      return tx.booking.create({
        data: {
          referenceNumber: bookingRef,
          quotationId,
          bookingEmployeeId: userContext.employeeId!,
          status: 'confirmed',
          notes: body.notes || '',
          vouchers: { create: vouchers },
        },
        include: bookingInclude,
      });
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error: unknown) {
    console.error('Error confirming booking:', error);
    return NextResponse.json({ error: 'Failed to confirm booking' }, { status: 500 });
  }
}

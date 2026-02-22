import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserContext } from '@/lib/permissions';
import { BOARD_TYPES } from '@/lib/constants';

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
    const body = await request.json();

    const quotation = await prisma.quotation.findUnique({
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

    const existing = await prisma.booking.findFirst({ where: { quotationId } });
    if (existing) return NextResponse.json({ error: 'Booking exists', bookingId: existing.id }, { status: 409 });

    const yr = new Date().getFullYear().toString().slice(-2);
    const cnt = await prisma.booking.count();
    const bookingRef = `BK-${yr}-${(cnt + 1).toString().padStart(5, '0')}`;

    const lead = quotation.passengers?.[0];
    const guestAr = lead?.name || quotation.customer?.nameAr || 'غير محدد';
    const guestTr = lead?.name || quotation.customer?.nameAr || 'Belirtilmemiş';

    const vouchers: any[] = [];
    let vi = 1;
    const code = () => { const c = `V-${yr}-${(cnt + 1).toString().padStart(5, '0')}-${(vi++).toString().padStart(2, '0')}`; return c; };

    for (const h of quotation.quotationHotels) {
      const b = h.board as keyof typeof BOARD_TYPES;
      vouchers.push({
        voucherType: 'hotel',
        voucherCode: code(),
        hotelId: h.hotelId,
        guestNameAr: guestAr,
        guestNameTr: guestTr,
        checkIn: h.checkIn,
        checkOut: h.checkOut,
        roomTypeAr: h.roomType?.nameAr || '',
        roomTypeTr: h.roomType?.nameTr || h.roomType?.nameAr || '',
        boardAr: BOARD_TYPES[b]?.ar || h.board,
        boardTr: BOARD_TYPES[b]?.tr || h.board,
        notesAr: body.hotelNotes?.[h.id] || '',
        notesTr: body.hotelNotesTr?.[h.id] || '',
        createdBy: userContext.employeeId,
      });
    }

    for (const c of quotation.quotationCars) {
      vouchers.push({
        voucherType: 'transportation',
        voucherCode: code(),
        guestNameAr: guestAr,
        guestNameTr: guestTr,
        notesAr: `${c.carTypeAr} | ${c.pickupLocation}${c.dropoffLocation ? ` → ${c.dropoffLocation}` : ''}`,
        notesTr: '',
        createdBy: userContext.employeeId,
      });
    }

    // فاوتشر واحد يجمع كل الخدمات (جولات + خدمات أخرى)
    const allServices = quotation.quotationServices || [];
    if (allServices.length > 0) {
      const lines = allServices.map((s: any) => {
        const name = s.nameAr || s.service?.nameAr || 'خدمة';
        const city = s.service?.city?.nameAr || '';
        const date = s.serviceDate ? new Date(s.serviceDate).toLocaleDateString('en-GB') : '';
        return `• ${name}${city ? ` (مدينة: ${city})` : ''}${date ? ` — ${date}` : ''}`;
      }).join('\n');

      vouchers.push({
        voucherType: 'other',
        voucherCode: code(),
        guestNameAr: guestAr,
        guestNameTr: guestTr,
        notesAr: `الخدمات المشمولة:\n${lines}`,
        notesTr: '',
        createdBy: userContext.employeeId,
      });
    }

    const booking = await prisma.$transaction(async (tx) => {
      return tx.booking.create({
        data: {
          referenceNumber: bookingRef,
          quotationId,
          bookingEmployeeId: userContext.employeeId!,
          status: 'pending',
          notes: body.notes || '',
          vouchers: { create: vouchers },
        },
        include: { vouchers: { include: { hotel: true } }, quotation: { include: { customer: true } } },
      });
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error('Error confirming booking:', error);
    return NextResponse.json({ error: 'Failed to confirm booking' }, { status: 500 });
  }
}

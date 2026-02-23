
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserContext, getAccessFilters } from '@/lib/permissions';

export async function GET(request: NextRequest) {
  try {
    const userContext = await getUserContext();
    if (!userContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const tab = searchParams.get('tab') || 'confirmed';

    const accessFilters = getAccessFilters(userContext, 'booking');
    
    if (tab === 'bookings') {
      const bookings = await prisma.booking.findMany({
        where: {
          ...accessFilters,
          ...(search
            ? {
                OR: [
                  { referenceNumber: { contains: search } },
                  { quotation: { referenceNumber: { contains: search } } },
                  { vouchers: { some: { voucherCode: { contains: search } } } },
                ],
              }
            : {}),
        },
        include: {
          quotation: { include: { customer: true, destinationCity: true } },
          bookingEmployee: true,
          vouchers: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json(bookings);
    }

    // All confirmed quotations — apply access filters to show only my sales if I'm a sales user
    const confirmed = await prisma.quotation.findMany({
      where: {
        ...getAccessFilters(userContext, 'quotation'),
        status: 'confirmed',
        ...(search
          ? {
              OR: [
                { referenceNumber: { contains: search } },
                { customer: { nameAr: { contains: search } } },
              ],
            }
          : {}),
      },
      include: {
        customer: true,
        destinationCity: true,
        agent: true,
        salesEmployee: true,
        quotationHotels: { include: { hotel: true, roomType: true } },
        quotationCars: true,
        quotationFlights: true,
        passengers: true,
        bookings: { include: { vouchers: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(confirmed);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userContext = await getUserContext();
    if (!userContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    if (userContext.isSales) {
        const quotation = await prisma.quotation.findUnique({
            where: { id: body.quotationId }
        });
        
        if (!quotation || quotation.salesEmployeeId !== userContext.employeeId) {
            return NextResponse.json({ error: 'Access denied to this quotation' }, { status: 403 });
        }
    }

    const booking = await prisma.booking.create({
      data: {
        referenceNumber: body.referenceNumber,
        quotationId: body.quotationId,
        bookingEmployeeId: body.bookingEmployeeId || userContext.employeeId || '',
        status: 'pending',
        notes: body.notes
      }
    });

    return NextResponse.json(booking);
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}

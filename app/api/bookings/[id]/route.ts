import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserContext } from '@/lib/permissions';

// GET /api/bookings/[id] — Get booking with all vouchers
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userContext = await getUserContext();
    if (!userContext) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        quotation: {
          include: {
            customer: true,
            agent: true,
            destinationCity: true,
            passengers: true,
            quotationHotels: { include: { hotel: { include: { city: true } }, roomType: true } },
            quotationCars: true,
            quotationFlights: true,
          },
        },
        bookingEmployee: true,
        vouchers: {
          include: { hotel: { include: { city: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

    return NextResponse.json(booking);
  } catch (error) {
    console.error('Error fetching booking:', error);
    return NextResponse.json({ error: 'Failed to fetch booking' }, { status: 500 });
  }
}

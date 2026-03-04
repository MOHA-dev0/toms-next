
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const accessFilters = getAccessFilters(userContext, 'booking');
    
    if (tab === 'bookings') {
      const bookings = await prisma.booking.findMany({
        where: {
          ...accessFilters,
          status: 'confirmed',
          ...(search
            ? {
                OR: [
                  { referenceNumber: { contains: search, mode: 'insensitive' } },
                  { quotation: { referenceNumber: { contains: search, mode: 'insensitive' } } },
                  { vouchers: { some: { voucherCode: { contains: search, mode: 'insensitive' } } } },
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
        skip,
        take: limit,
      });

      const total = await prisma.booking.count({ 
        where: {
          ...accessFilters,
          status: 'confirmed',
          ...(search
            ? {
                OR: [
                  { referenceNumber: { contains: search, mode: 'insensitive' } },
                  { quotation: { referenceNumber: { contains: search, mode: 'insensitive' } } },
                  { vouchers: { some: { voucherCode: { contains: search, mode: 'insensitive' } } } },
                ],
              }
            : {}),
        }
      });

      return NextResponse.json({ data: bookings, total, page, limit });
    }

    // All confirmed quotations — apply access filters to show only my sales if I'm a sales user
    const confirmed = await prisma.quotation.findMany({
      where: {
        ...getAccessFilters(userContext, 'quotation'),
        status: 'confirmed',
        bookings: { none: { status: 'confirmed' } },
        ...(search
          ? {
              OR: [
                { referenceNumber: { contains: search, mode: 'insensitive' } },
                { customer: { nameAr: { contains: search, mode: 'insensitive' } } },
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
      skip,
      take: limit,
    });

    const total = await prisma.quotation.count({
      where: {
        ...getAccessFilters(userContext, 'quotation'),
        status: 'confirmed',
        bookings: { none: { status: 'confirmed' } },
        ...(search
          ? {
              OR: [
                { referenceNumber: { contains: search, mode: 'insensitive' } },
                { customer: { nameAr: { contains: search, mode: 'insensitive' } } },
              ],
            }
          : {}),
      }
    });

    return NextResponse.json({ data: confirmed, total, page, limit });
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

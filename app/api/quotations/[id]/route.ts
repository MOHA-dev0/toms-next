import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserContext } from '@/lib/permissions';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userContext = await getUserContext();
    if (!userContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        customer: true,
        destinationCity: true,
        agent: true,
        quotationHotels: {
          include: {
            hotel: { include: { city: true } },
            roomType: true,
          }
        },
        quotationServices: {
          include: {
            service: { include: { city: true } },
          }
        },
        quotationFlights: true,
        quotationCars: true,
        passengers: {
          orderBy: { createdAt: 'asc' }
        },
      },
    });

    if (!quotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    // Security check: 
    // Admin: everything.
    // Sales: only own.
    // Booking: own OR confirmed others.
    const isOwner = quotation.salesEmployeeId === userContext.employeeId;
    const isConfirmed = quotation.status === 'confirmed';

    if (userContext.isSales && !isOwner) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (userContext.isBooking && !isOwner && !isConfirmed) {
      return NextResponse.json({ error: 'Access denied - Quotation not confirmed' }, { status: 403 });
    }

    return NextResponse.json(JSON.parse(JSON.stringify(quotation)));
  } catch (error) {
    console.error('Error fetching quotation:', error);
    return NextResponse.json({ error: 'Failed to fetch quotation' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userContext = await getUserContext();
    if (!userContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    if (body.status === 'confirmed') {
      const existingQuotation = await prisma.quotation.findUnique({
        where: { id },
        include: { passengers: true },
      });

      if (!existingQuotation) {
        return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
      }

      const totalPax = (existingQuotation.adults || 0) + (existingQuotation.children || 0) + (existingQuotation.infants || 0);
      const validPassengers = existingQuotation.passengers.filter(p => p.name && p.name.trim().length > 0 && p.name.trim().toLowerCase() !== 'unknown');

      if (validPassengers.length < totalPax) {
        return NextResponse.json(
          { error: 'يجب إدخال أسماء جميع الضيوف كاملة قبل تأكيد العرض.' },
          { status: 400 }
        );
      }
    }

    const quotation = await prisma.quotation.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(JSON.parse(JSON.stringify(quotation)));
  } catch (error) {
    console.error('Error updating quotation:', error);
    return NextResponse.json({ error: 'Failed to update quotation' }, { status: 500 });
  }
}

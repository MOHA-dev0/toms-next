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
        passengers: true,
      },
    });

    if (!quotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
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

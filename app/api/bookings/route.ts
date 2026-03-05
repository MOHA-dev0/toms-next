
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserContext, getAccessFilters } from '@/lib/permissions';


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

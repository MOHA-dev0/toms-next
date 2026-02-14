
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserContext, getAccessFilters } from '@/lib/permissions';

export async function GET(request: NextRequest) {
  try {
    const userContext = await getUserContext();
    if (!userContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const filters = getAccessFilters(userContext, 'booking');
    if (filters.id === 'impossible-id') {
       return NextResponse.json([]); 
    }

    const bookings = await prisma.booking.findMany({
      where: filters,
      include: {
        quotation: {
          include: {
            customer: true,
            salesEmployee: true
          }
        },
        bookingEmployee: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userContext = await getUserContext();
    if (!userContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Logic: Creating a booking usually comes from confirming a quotation.
    // Ensure the quotation belongs to the sales user if they are sales.
    
    if (userContext.isSales) {
        const quotation = await prisma.quotation.findUnique({
            where: { id: body.quotationId }
        });
        
        if (!quotation || quotation.salesEmployeeId !== userContext.employeeId) {
            return NextResponse.json({ error: 'Access denied to this quotation' }, { status: 403 });
        }
    }

    // Default booking employee assignment logic could go here
    // For now, we assume body contains necessary fields or we validate them.
    
    // Simplistic Create for demonstration
    const booking = await prisma.booking.create({
      data: {
        referenceNumber: body.referenceNumber, // Should probably be generated
        quotationId: body.quotationId,
        bookingEmployeeId: body.bookingEmployeeId || userContext.employeeId || 'assign-admin', // Fallback needed
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

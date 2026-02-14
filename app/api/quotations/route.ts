
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserContext, getAccessFilters } from '@/lib/permissions';

export async function GET(request: NextRequest) {
  try {
    const userContext = await getUserContext();
    if (!userContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const filters = getAccessFilters(userContext, 'quotation');
    if (filters.id === 'impossible-id') {
       return NextResponse.json([]); 
    }

    const quotations = await prisma.quotation.findMany({
      where: filters,
      include: {
        customer: true,
        salesEmployee: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(quotations);
  } catch (error) {
    console.error('Error fetching quotations:', error);
    return NextResponse.json({ error: 'Failed to fetch quotations' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userContext = await getUserContext();
    if (!userContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (userContext.isSales && !userContext.employeeId) {
        return NextResponse.json({ error: 'Sales profile missing' }, { status: 403 });
    }

    const body = await request.json();

    // Enforce ownership
    if (userContext.isSales) {
        body.salesEmployeeId = userContext.employeeId;
    }

    const quotation = await prisma.quotation.create({
      data: body // In real app, validate body against schema including relations
    });

    return NextResponse.json(quotation);
  } catch (error) {
    console.error('Error creating quotation:', error);
    return NextResponse.json({ error: 'Failed to create quotation' }, { status: 500 });
  }
}

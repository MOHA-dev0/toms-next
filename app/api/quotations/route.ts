
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
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';

    const accessFilters = getAccessFilters(userContext, 'quotation');
    if (accessFilters.id === 'impossible-id') {
       return NextResponse.json({ meta: { totalCount: 0, draftCount: 0, unconfirmedCount: 0, confirmedCount: 0, filteredCount: 0, page: 1, pageCount: 0 }, data: [] }); 
    }

    const where: any = { ...accessFilters };

    if (search) {
      where.OR = [
        { referenceNumber: { contains: search, mode: 'insensitive' } },
        { customer: { nameAr: { contains: search, mode: 'insensitive' } } },
        { destinationCity: { nameAr: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (status !== 'all') {
      if (status === 'unconfirmed') {
        where.status = 'sent';
      } else {
        where.status = status;
      }
    }

    const [
      totalCount,
      draftCount,
      unconfirmedCount,
      confirmedCount,
      filteredCount,
      quotations
    ] = await Promise.all([
      prisma.quotation.count({ where: accessFilters }),
      prisma.quotation.count({ where: { ...accessFilters, status: 'draft' } }),
      prisma.quotation.count({ where: { ...accessFilters, status: 'sent' } }),
      prisma.quotation.count({ where: { ...accessFilters, status: 'confirmed' } }),
      prisma.quotation.count({ where }),
      prisma.quotation.findMany({
        where,
        include: {
          customer: true,
          destinationCity: true,
          agent: true,
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      })
    ]);

    const formattedData = quotations.map(q => ({
      id: q.id,
      referenceNumber: q.referenceNumber,
      customerName: q.customer?.nameAr || 'غير محدد',
      agentName: q.agent?.nameEn || '',
      destination: q.destinationCity?.nameAr || 'غير محدد',
      paxCount: (q.adults || 0) + (q.children || 0) + (q.infants || 0),
      totalPrice: q.totalPrice ? Number(q.totalPrice.toString()) : 0,
      paidAmount: q.paidAmount ? Number(q.paidAmount.toString()) : 0,
      startDate: q.startDate,
      createdAt: q.createdAt,
      status: q.status
    }));

    return NextResponse.json({
      meta: {
        totalCount,
        draftCount,
        unconfirmedCount,
        confirmedCount,
        filteredCount,
        page,
        pageCount: Math.ceil(filteredCount / limit)
      },
      data: formattedData
    });
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

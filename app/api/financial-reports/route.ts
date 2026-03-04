import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/auth';
import { Prisma, QuotationStatus } from '@prisma/client';

export interface FinancialReportItem {
  id: string;
  referenceNumber: string;
  customerName: string;
  salesEmployeeName: string;
  status: QuotationStatus;
  date: Date;
  totalPrice: number;
  paidAmount: number;
  remainingAmount: number;
  paymentMethod: string;
}

export interface FinancialReportSummary {
  totalAmount: number;
  totalPaid: number;
  totalRemaining: number;
}

export interface FinancialReportMeta {
  totalCount: number;
  page: number;
  limit: number;
  pageCount: number;
}

export interface FinancialReportResponse {
  data: FinancialReportItem[];
  summary: FinancialReportSummary;
  meta: FinancialReportMeta;
}

export async function GET(request: Request): Promise<NextResponse<FinancialReportResponse | { error: string }>> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'غير مصرح لك بالوصول' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'confirmed';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');
    const source = searchParams.get('source');
    const search = searchParams.get('search')?.trim();
    
    // Build where clause
    const whereClause: Prisma.QuotationWhereInput = {};
    
    if (filter === 'confirmed') {
      whereClause.status = QuotationStatus.confirmed;
    } else if (filter !== 'all') {
      if (Object.values(QuotationStatus).includes(filter as QuotationStatus)) {
        whereClause.status = filter as QuotationStatus;
      }
    }

    if (source === 'b2b' || source === 'b2c') {
      whereClause.source = source;
    }

    if (search) {
      whereClause.OR = [
        { referenceNumber: { contains: search, mode: 'insensitive' } },
        { customer: { is: { nameAr: { contains: search, mode: 'insensitive' } } } },
        { salesEmployee: { is: { nameAr: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    if (fromDate || toDate) {
      whereClause.createdAt = {};
      if (fromDate) {
        whereClause.createdAt.gte = new Date(fromDate);
      }
      if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        whereClause.createdAt.lte = to;
      }
    }

    const skip = (page - 1) * limit;

    // Run queries in parallel for performance
    const [quotations, totalCount, aggregations] = await Promise.all([
      // 1. Fetch paginated data
      prisma.quotation.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          customer: { select: { nameAr: true, phone: true } },
          salesEmployee: { select: { nameAr: true } },
          payments: { select: { paymentMethod: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      // 2. Count total records matching filters
      prisma.quotation.count({ where: whereClause }),
      // 3. Aggregate totals natively in the database
      prisma.quotation.aggregate({
        where: whereClause,
        _sum: {
          totalPrice: true,
          paidAmount: true
        }
      })
    ]);

    const totalAmount = Number(aggregations._sum.totalPrice || 0);
    const totalPaid = Number(aggregations._sum.paidAmount || 0);
    const totalRemaining = totalAmount - totalPaid;

    const formattedData: FinancialReportItem[] = quotations.map(q => {
      const price = q.totalPrice?.toNumber()
      const paid = Number(q.paidAmount || 0);
      const remaining = price - paid;
      
      const paymentMethods = q.payments.length > 0
        ? Array.from(new Set(q.payments.map(p => p.paymentMethod))).join('، ')
        : 'غير متوفر';

      return {
        id: q.id,
        referenceNumber: q.referenceNumber,
        customerName: q.customer?.nameAr || 'غير معروف',
        salesEmployeeName: q.salesEmployee?.nameAr || 'غير معروف',
        status: q.status,
        date: q.createdAt,
        totalPrice: price,
        paidAmount: paid,
        remainingAmount: remaining,
        paymentMethod: paymentMethods,
      };
    });

    const responsePayload: FinancialReportResponse = {
      data: formattedData,
      summary: {
        totalAmount,
        totalPaid,
        totalRemaining
      },
      meta: {
        totalCount,
        page,
        limit,
        pageCount: Math.ceil(totalCount / limit)
      }
    };

    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error('Error fetching financial reports:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب التقارير المالية' }, { status: 500 });
  }
}

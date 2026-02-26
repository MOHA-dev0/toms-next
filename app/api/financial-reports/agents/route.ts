import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/auth';

export interface AgentFinancialItem {
  id: string;
  agentName: string;
  customersCount: number;
  quotationsCount: number;
  totalSellingAmount: number;
}

export interface AgentFinancialResponse {
  data: AgentFinancialItem[];
  summary: {
    totalAgents: number;
    totalCustomers: number;
    totalQuotations: number;
    totalSellingAmount: number;
  };
  meta: {
    totalCount: number;
    page: number;
    limit: number;
    pageCount: number;
  };
}

export async function GET(request: Request): Promise<NextResponse<AgentFinancialResponse | { error: string }>> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'غير مصرح لك بالوصول' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));

    // Get all agents with their confirmed quotations
    const agents = await prisma.agent.findMany({
      where: { isActive: true },
      include: {
        quotations: {
          where: { status: 'confirmed' },
          select: {
            id: true,
            customerId: true,
            totalPrice: true,
          },
        },
      },
      orderBy: { nameEn: 'asc' },
    });

    let totalCustomers = 0;
    let totalQuotations = 0;
    let totalSelling = 0;

    const allData: AgentFinancialItem[] = agents.map((agent) => {
      const quotationsCount = agent.quotations.length;
      // Count unique customers
      const uniqueCustomers = new Set(agent.quotations.map((q) => q.customerId));
      const customersCount = uniqueCustomers.size;
      const sellingAmount = agent.quotations.reduce(
        (sum, q) => sum + Number(q.totalPrice), 0
      );

      totalCustomers += customersCount;
      totalQuotations += quotationsCount;
      totalSelling += sellingAmount;

      return {
        id: agent.id,
        agentName: agent.nameEn,
        customersCount,
        quotationsCount,
        totalSellingAmount: sellingAmount,
      };
    });

    // Sort: agents with quotations first, then by amount descending
    allData.sort((a, b) => {
      if (a.quotationsCount === 0 && b.quotationsCount > 0) return 1;
      if (a.quotationsCount > 0 && b.quotationsCount === 0) return -1;
      return b.totalSellingAmount - a.totalSellingAmount;
    });

    const totalCount = allData.length;
    const skip = (page - 1) * limit;
    const paginatedData = allData.slice(skip, skip + limit);

    return NextResponse.json({
      data: paginatedData,
      summary: {
        totalAgents: allData.filter((a) => a.quotationsCount > 0).length,
        totalCustomers,
        totalQuotations,
        totalSellingAmount: totalSelling,
      },
      meta: { totalCount, page, limit, pageCount: Math.ceil(totalCount / limit) },
    });
  } catch (error) {
    console.error('Error fetching agent financial reports:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب تقارير الوكلاء' }, { status: 500 });
  }
}

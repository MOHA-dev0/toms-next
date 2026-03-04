import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export interface QuotationListOptions {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}

export async function getQuotations(options?: QuotationListOptions) {
  const { page = 1, pageSize = 10, search = '', status = 'all' } = options || {};

  const where: Prisma.QuotationWhereInput = {};

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
      // Avoid raw 'any' by telling typescript we are assigning what the db expects for status
      // We leverage the built-in string map for status if necessary
      where.status = status as any;
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
    prisma.quotation.count(),
    prisma.quotation.count({ where: { status: 'draft' } }),
    prisma.quotation.count({ where: { status: 'sent' } }),
    prisma.quotation.count({ where: { status: 'confirmed' } }),
    prisma.quotation.count({ where }),
    prisma.quotation.findMany({
      where,
      include: {
        customer: true,
        destinationCity: true,
        cities_quotationdestinations: true,
        agent: true,
      },
      orderBy: [
        { createdAt: 'desc' },
        { id: 'desc' }
      ],
      skip: (page - 1) * pageSize,
      take: pageSize,
    })
  ]);

  return {
    meta: {
      totalCount,
      draftCount,
      unconfirmedCount,
      confirmedCount,
      filteredCount,
      pageCount: Math.ceil(filteredCount / pageSize)
    },
    quotations: quotations.map(q => ({
      id: q.id,
      referenceNumber: q.referenceNumber,
      customerName: q.customer?.nameAr || 'غير محدد',
      agentName: q.agent?.nameEn || '',
      destination: q.cities_quotationdestinations?.length > 0 
        ? q.cities_quotationdestinations.map(d => d.nameAr).join(' - ') 
        : (q.destinationCity?.nameAr || 'غير محدد'),
      paxCount: (q.adults || 0) + (q.children || 0) + (q.infants || 0),
      totalPrice: q.totalPrice ? Number(q.totalPrice.toString()) : 0,
      createdAt: q.createdAt,
      status: q.status
    }))
  };
}

export async function updateQuotationStatus(quotationId: string, status: string) {
  if (!quotationId) throw new Error("Quotation ID is required");
  return await prisma.quotation.update({
    where: { id: quotationId },
    data: { status: status as any }
  });
}

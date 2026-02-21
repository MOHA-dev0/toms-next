
"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

export async function getQuotationReferenceData() {
  const [agents, companies, cities, employees, currentUserId] = await Promise.all([
    prisma.agent.findMany({ where: { isActive: true }, select: { id: true, nameEn: true } }),
    prisma.company.findMany({ where: { isActive: true }, select: { id: true, nameEn: true } }),
    prisma.city.findMany({ where: { isActive: true }, select: { id: true, nameAr: true, nameTr: true } }),
    prisma.employee.findMany({ where: { isActive: true }, select: { id: true, nameAr: true, email: true } }),
    getCurrentUserId()
  ]);
  
  let currentEmployeeId = null;
  if (currentUserId) {
    const emp = await prisma.employee.findUnique({ where: { userId: currentUserId } });
    if (emp) currentEmployeeId = emp.id;
  }

  return {
    agents,
    companies,
    cities,
    employees,
    currentEmployeeId
  };
}

export async function getHotelsByCity(cityId: string) {
  if (!cityId) return [];
  
  const hotels = await prisma.hotel.findMany({
    where: { cityId, isActive: true },
    select: {
      id: true,
      nameAr: true,
      roomTypes: {
        where: { isActive: true },
        select: {
          id: true,
          nameAr: true,
          basePrice: true, // Fallback price
          currency: true,  // Fallback currency
          roomPricing: {
            where: { isActive: true },
            select: {
              id: true,
              usage: true,
              board: true,
              sellingPrice: true,
              purchasePrice: true,
              currency: true,
              validFrom: true,
              validTo: true
            }
          }
        }
      }
    }
  });

  // Convert Decimals to numbers
  return hotels.map(hotel => ({
    ...hotel,
    roomTypes: hotel.roomTypes.map(rt => ({
      ...rt,
      basePrice: rt.basePrice ? Number(rt.basePrice) : 0,
      roomPricing: rt.roomPricing.map(rp => ({
        ...rp,
        sellingPrice: Number(rp.sellingPrice),
        purchasePrice: Number(rp.purchasePrice)
      }))
    }))
  }));
}
export async function getServices() {
  const services = await prisma.service.findMany({
    where: { isActive: true },
    select: {
      id: true,
      nameAr: true,
      nameEn: true,
      purchasePrice: true,
      currency: true,
      cityId: true
    },
    orderBy: { nameAr: 'asc' }
  });

  return services.map(service => ({
    ...service,
    purchasePrice: Number(service.purchasePrice)
  }));
}

export async function getOtherServices() {
  const services = await prisma.otherService.findMany({
    where: { isActive: true },
    select: {
      id: true,
      nameAr: true,
      nameEn: true,
      purchasePrice: true,
      currency: true
    },
    orderBy: { nameAr: 'asc' }
  });

  return services.map(service => ({
    ...service,
    purchasePrice: Number(service.purchasePrice)
  }));
}

export async function getQuotations(options?: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}) {
  const { page = 1, pageSize = 10, search = '', status = 'all' } = options || {};

  const where: any = {};

  if (search) {
    where.OR = [
      { referenceNumber: { contains: search } },
      { customer: { nameAr: { contains: search } } },
      { destinationCity: { nameAr: { contains: search } } },
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
        agent: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
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
      destination: q.destinationCity?.nameAr || 'غير محدد',
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

export async function finalizeQuotation(quotationId: string, data: {
  subtotal: number;
  totalPrice: number;
  profit: number;
  commissionAmount: number;
  status: string;
}) {
  if (!quotationId) throw new Error("Quotation ID is required");
  return await prisma.quotation.update({
    where: { id: quotationId },
    data: { 
      subtotal: data.subtotal,
      totalPrice: data.totalPrice,
      profit: data.profit,
      commissionAmount: data.commissionAmount,
      status: data.status as any 
    }
  });
}


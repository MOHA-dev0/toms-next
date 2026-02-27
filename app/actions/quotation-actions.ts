
"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { getUserContext } from "@/lib/permissions";

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
        destinations: true, // Fetch multiple destinations if mapped
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
      customerName: (q as any).customer?.nameAr || 'غير محدد',
      agentName: (q as any).agent?.nameEn || '',
      destination: (q as any).destinations?.length > 0 
        ? (q as any).destinations.map((d: any) => d.nameAr).join(' - ') 
        : ((q as any).destinationCity?.nameAr || 'غير محدد'),
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
}, state?: any) {
  if (!quotationId) throw new Error("Quotation ID is required");

  const existingQuotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: { salesEmployee: true }
  });

  if (!existingQuotation) throw new Error("Quotation not found");

  const context = await getUserContext();
  if (!context) throw new Error("Unauthorized");

  if (existingQuotation.status === 'confirmed' && !context.isAdmin) {
    throw new Error("You don't have permission to edit a confirmed quotation.");
  }



  let finalReferenceNumber = existingQuotation.referenceNumber;
  
  if (existingQuotation.status === 'draft') {
    const empInitial = (existingQuotation.salesEmployee?.initial)
      ? existingQuotation.salesEmployee.initial.toUpperCase()
      : (existingQuotation.salesEmployee?.nameAr)
        ? existingQuotation.salesEmployee.nameAr.charAt(0).toUpperCase()
        : 'M';
    const currentYear = new Date().getFullYear().toString().slice(-2);
    let randomNum = '';
    let isUnique = false;

    while (!isUnique) {
      randomNum = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
      finalReferenceNumber = `${empInitial}-${currentYear}-${randomNum}`;
      const exists = await prisma.quotation.findUnique({ where: { referenceNumber: finalReferenceNumber } });
      if (!exists) isUnique = true;
    }
    
    const booking = await prisma.booking.findFirst({ where: { quotationId } });
    if (booking) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { referenceNumber: finalReferenceNumber }
      });
    }
  }

  // Clean existing relations first just in case to avoid duplicates if re-submitted later
  // Ideally this would be a transaction but Prisma `update` doesn't support nested deleteMany for all without specific queries
  await prisma.$transaction([
    prisma.quotationHotel.deleteMany({ where: { quotationId } }),
    prisma.quotationFlight.deleteMany({ where: { quotationId } }),
    prisma.quotationCar.deleteMany({ where: { quotationId } }),
    prisma.quotationService.deleteMany({ where: { quotationId } }),
    prisma.quotationPassenger.deleteMany({ where: { quotationId } }),
  ]);

  if (state?.basicInfo?.passengers && state.basicInfo.passengers.length > 0) {
    const mainPassengerName = state.basicInfo.passengers[0].name;
    if (existingQuotation.customerId && mainPassengerName) {
      await prisma.customer.update({
        where: { id: existingQuotation.customerId },
        data: { nameAr: mainPassengerName }
      });
    }
  }

  // Fetch valid services to ensure we don't send invalid foreign keys for `serviceId`
  const validServices = await prisma.service.findMany({ select: { id: true } });
  const validServiceIds = new Set(validServices.map(s => s.id));

  // Helper: safely parse a date value (string or Date) into a timezone-safe Date
  // This prevents date shifting when the user is in a timezone ahead of UTC
  function toSafeDate(value: any): Date | null {
    if (!value) return null;
    // If it's already a Date object, extract its local date parts
    if (value instanceof Date) {
      return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 12, 0, 0);
    }
    // If it's an ISO string like "2026-03-15T00:00:00.000Z" or "2026-03-15"
    const str = String(value);
    // Extract just the YYYY-MM-DD part to avoid timezone shifts
    const dateMatch = str.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (dateMatch) {
      const [, year, month, day] = dateMatch;
      // Create date at noon UTC to avoid any edge-case timezone drift
      return new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0));
    }
    // Fallback
    return new Date(str);
  }

  await prisma.quotation.update({
    
    where: { id: quotationId },
    data: { 
      referenceNumber: finalReferenceNumber,
      createdAt: existingQuotation.status === 'draft' ? new Date() : existingQuotation.createdAt,
      subtotal: data.subtotal,
      totalPrice: data.totalPrice,
      profit: data.profit,
      commissionAmount: data.commissionAmount,
      status: data.status as any,
      
      ...(state?.basicInfo && {
        adults: state.basicInfo.adults,
        children: state.basicInfo.children,
        infants: state.basicInfo.infants,
        destinationCityId: state.basicInfo.destinationCityIds?.[0] || null, // Keep for backward compatibility
        destinations: {
          set: (state.basicInfo.destinationCityIds || []).filter((id: string) => id && id.length === 36).map((id: string) => ({ id }))
        },
        source: state.basicInfo.channel || 'b2c',
        agentId: state.basicInfo.agencyId || null,
        notes: state.basicInfo.notes || null,
        // Always persist salesEmployeeId and companyId
        ...(state.basicInfo.salesPersonId && { salesEmployeeId: state.basicInfo.salesPersonId }),
        ...(state.basicInfo.companyId ? { companyId: state.basicInfo.companyId } : { companyId: null }),
        // Always write dates using timezone-safe parsing (never skip them)
        startDate: toSafeDate(state.basicInfo.startDate) || existingQuotation.startDate,
        endDate: toSafeDate(state.basicInfo.endDate) || existingQuotation.endDate,
        passengers: {
          create: state.basicInfo.passengers.map((p: any, index: number) => ({
            name: p.name || '',
            type: p.type || 'adult',
            passport: p.passport || null,
            createdAt: new Date(Date.now() + index * 1000)
          }))
        }
      }),

      ...(state && {
        quotationHotels: {
          create: state.hotelSegments?.map((h: any) => {
            const checkInDate = toSafeDate(h.checkIn) || new Date();
            const checkOutDate = toSafeDate(h.checkOut) || new Date();
            const nightsCount = Math.max(1, Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)));
            
            return {
              hotelId: h.hotelId,
              roomTypeId: h.roomTypeId,
              checkIn: checkInDate,
              checkOut: checkOutDate,
              nights: nightsCount,
              roomsCount: h.roomsCount || 1,
              usage: h.usage || 'dbl',
              board: h.boardType || 'bb',
              purchasePrice: h.purchasePrice || 0,
              sellingPrice: h.sellingPrice || 0, // Always USD (converted at selection time)
              notes: h.notes || null,
              // Audit trail: original currency info (if converted from non-USD)
              ...(h.originalPrice ? {
                originalPrice: h.originalPrice,
                originalCurrency: h.originalCurrency || null,
                exchangeRate: h.exchangeRate || null,
              } : {}),
            };
          }) || []
        },
        quotationFlights: {
          create: state.isFlightsEnabled ? (state.flights?.map((f: any) => ({
            airlineAr: 'غير محدد',
            flightNumber: f.description, // using description as flight info
            departureCity: 'غير محدد',
            arrivalCity: 'غير محدد',
            departureDate: toSafeDate(f.date) || new Date(),
            passengers: f.paxCount || 1,
            purchasePrice: 0,
            sellingPrice: f.price || 0,
          })) || []) : []
        },
        quotationCars: {
          create: state.isCarsEnabled ? (state.carRentals?.map((c: any) => ({
            carTypeAr: c.description,
            pickupLocation: 'غير محدد',
            pickupDate: toSafeDate(c.pickupDate) || new Date(),
            dropoffDate: toSafeDate(c.dropoffDate) || new Date(),
            days: c.days || 1,
            purchasePrice: 0,
            sellingPrice: c.price || 0,
          })) || []) : []
        },
        quotationServices: {
          create: [
            ...(state.itineraryServices?.filter((s: any) => s.serviceId || (s.name && s.name.trim() !== '') || s.sellingPrice > 0).map((s: any) => ({
              ...(s.serviceId && validServiceIds.has(s.serviceId) ? { serviceId: s.serviceId } : {}),
              nameAr: s.name || 'بدون اسم',
              quantity: s.quantity || 1,
              serviceDate: toSafeDate(s.date) || new Date(),
              purchasePrice: s.purchasePrice || 0,
              sellingPrice: s.sellingPrice || 0,
              descriptionAr: s.notes || null,
            })) || []),
            ...(state.otherServices?.filter((s: any) => s.serviceId || (s.name && s.name.trim() !== '') || s.sellingPrice > 0).map((s: any) => ({
              ...(s.serviceId && validServiceIds.has(s.serviceId) ? { serviceId: s.serviceId } : {}),
              nameAr: s.name || 'بدون اسم',
              quantity: s.quantity || 1,
              serviceDate: toSafeDate(s.date) || new Date(),
              purchasePrice: s.purchasePrice || 0,
              sellingPrice: s.sellingPrice || 0,
              descriptionAr: s.notes || null,
            })) || [])
          ]
        }
      })
    }
  });

  return { success: true, referenceNumber: finalReferenceNumber };
}


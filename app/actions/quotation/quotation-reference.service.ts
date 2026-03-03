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
  
  let currentEmployeeId: string | null = null;
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
          basePrice: true,
          currency: true,
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

export async function getServiceProviders() {
  const providers = await prisma.serviceProvider.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  });
  return providers;
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

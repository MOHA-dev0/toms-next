import { prisma } from "@/lib/prisma";
import { getUserContext } from "@/lib/permissions";
import { generateQuotationReference } from "./quotation-reference-generator";
import { toSafeDate } from "./quotation-date-utils";
import { mapHotelSegments, HotelSegmentState } from "./quotation-hotel-mapper";
import {
  calculateActualSubtotal,
  calculateFinalFinancials
} from "./quotation-calculator";
import { RoomType, RoomPricing, Currency, SourceType } from "@prisma/client";
import { reportCache } from "@/lib/cache";

export interface FinalizeQuotationData {
  subtotal: number;
  totalPrice: number;
  profit: number;
  commissionAmount: number;
  status: string;
  rebalanceMode?: 'update_total' | 'rebalance_internally';
}

export interface PassengerState {
  name?: string;
  type?: string;
  passport?: string | null;
  age?: number | null;
}

export interface FlightState {
  description?: string;
  type?: string;
  date?: string | Date | null;
  paxCount?: number;
  price?: number;
  currency?: string;
}

export interface CarRentalState {
  pickupDate?: string | Date | null;
  dropoffDate?: string | Date | null;
  description?: string;
  days?: number;
  price?: number;
  currency?: string;
}

export interface ServiceState {
  serviceId?: string;
  providerId?: string;
  name?: string;
  quantity?: number;
  date?: string | Date | null;
  purchasePrice?: number;
  sellingPrice?: number;
  notes?: string;
}

export interface QuotationState {
  basicInfo?: {
    passengers?: PassengerState[];
    destinationCityIds?: string[];
    adults?: number;
    children?: number;
    infants?: number;
    channel?: string;
    agencyId?: string;
    notes?: string;
    salesPersonId?: string;
    companyId?: string;
    startDate?: string | Date | null;
    endDate?: string | Date | null;
  };
  hotelSegments?: HotelSegmentState[];
  isFlightsEnabled?: boolean;
  flights?: FlightState[];
  isCarsEnabled?: boolean;
  carRentals?: CarRentalState[];
  itineraryServices?: ServiceState[];
  otherServices?: ServiceState[];
}

export async function finalizeQuotation(
  quotationId: string,
  data: FinalizeQuotationData,
  state?: QuotationState
) {
  if (!quotationId) throw new Error("Quotation ID is required");

  const existingQuotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: { salesEmployee: true, quotationHotels: true }
  });

  if (!existingQuotation) throw new Error("Quotation not found");

  const context = await getUserContext();
  if (!context) throw new Error("Unauthorized");

  if (existingQuotation.status === 'confirmed' && !context.isAdmin) {
    throw new Error("You don't have permission to edit a confirmed quotation.");
  }

  if (existingQuotation.status === 'confirmed' && existingQuotation.endDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const programEnd = new Date(existingQuotation.endDate);
    programEnd.setHours(0, 0, 0, 0);

    if (programEnd < today && data.rebalanceMode !== 'rebalance_internally') {
      throw new Error("This quotation is finalized and the program has ended. You can only adjust internal costs. The total quotation price cannot be changed.");
    }
  }

  let finalReferenceNumber = existingQuotation.referenceNumber;
  
  if (existingQuotation.status === 'draft') {
    const empInitial = (existingQuotation.salesEmployee?.initial)
      ? existingQuotation.salesEmployee.initial.toUpperCase()
      : (existingQuotation.salesEmployee?.nameAr)
        ? existingQuotation.salesEmployee.nameAr.charAt(0).toUpperCase()
        : 'M';
    const currentYear = new Date().getFullYear().toString().slice(-2);
    
    finalReferenceNumber = await generateQuotationReference(empInitial, currentYear);
    
    const booking = await prisma.booking.findFirst({ where: { quotationId } });
    if (booking) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { referenceNumber: finalReferenceNumber }
      });
    }
  }

  // Optimize: Preload room types to avoid loop queries by utilizing Map pattern caching
  const roomTypeIds = Array.from(new Set(
    (state?.hotelSegments || [])
      .map(h => h.roomTypeId)
      .filter((id): id is string => Boolean(id))
  ));
    
  let roomTypePricingMap = new Map<string, RoomType & { roomPricing: RoomPricing[] }>();
  if (roomTypeIds.length > 0) {
    const roomTypes = await prisma.roomType.findMany({
      where: { id: { in: roomTypeIds } },
      include: { roomPricing: true }
    });
    roomTypePricingMap = new Map(roomTypes.map(rt => [rt.id, rt]));
  }

  const mappedHotels = mapHotelSegments(
    state?.hotelSegments || [],
    existingQuotation.quotationHotels,
    data.rebalanceMode,
    roomTypePricingMap
  );

  const itineraryServicesCreate = state?.itineraryServices?.filter(s => s.serviceId || (s.name && s.name.trim() !== '') || (s.sellingPrice && s.sellingPrice > 0)) || [];
  const otherServicesCreate = state?.otherServices?.filter(s => s.serviceId || (s.name && s.name.trim() !== '') || (s.sellingPrice && s.sellingPrice > 0)) || [];
  const allServices = [...itineraryServicesCreate, ...otherServicesCreate];

  // Map to purely domain models for calculators to compute subtotals separately
  const actualSubtotal = calculateActualSubtotal(
    mappedHotels,
    state?.isFlightsEnabled ? (state.flights || []).map(f => ({ price: f.price || 0, paxCount: f.paxCount || 1 })) : [],
    state?.isCarsEnabled ? (state.carRentals || []).map(c => ({ price: c.price || 0, days: c.days || 1 })) : [],
    allServices.map(s => ({ sellingPrice: s.sellingPrice || 0, quantity: s.quantity || 1 }))
  );

  const { finalTotalPrice, finalSubtotal, finalCommission, finalProfit } = calculateFinalFinancials(
    data.rebalanceMode,
    actualSubtotal,
    data.totalPrice,
    data.profit,
    data.commissionAmount,
    Number(existingQuotation.totalPrice || 0),
    Number(existingQuotation.commissionAmount || 0)
  );

  const validServices = await prisma.service.findMany({ select: { id: true } });
  const validServiceIds = new Set(validServices.map(s => s.id));

  // Track structural changes for confirmed quotations
  let structuralChangesDetected = false;

  if (existingQuotation.status === 'confirmed') {
    // 1. Check Hotels change
    // Using simple length check here, but more complex logic can be added if needed
    if (state?.hotelSegments) {
      if (state.hotelSegments.length !== existingQuotation.quotationHotels.length) {
        structuralChangesDetected = true;
      } else {
        // Deep check could be added here; for now, if lengths differ or if it's explicitly modified
        // In the mapper, new segments don't have IDs of previous ones, which signals a change 
        structuralChangesDetected = true; 
      }
    }
    
    // 2. Flights
    if (state?.isFlightsEnabled !== undefined || state?.flights !== undefined) structuralChangesDetected = true;
    
    // 3. Cars
    if (state?.isCarsEnabled !== undefined || state?.carRentals !== undefined) structuralChangesDetected = true;

    // 4. Services
    if (state?.itineraryServices !== undefined || state?.otherServices !== undefined) structuralChangesDetected = true;

    // 5. Passengers
    if (state?.basicInfo?.passengers !== undefined) structuralChangesDetected = true;
  }

  // Single monolithic transaction enforcing atomicity containing all relational deletions and recreations sequentially.
  await prisma.$transaction(async (tx) => {
    const passengers = state?.basicInfo?.passengers;
    if (passengers && passengers.length > 0) {
      const mainPassengerName = passengers[0].name;
      if (existingQuotation.customerId && mainPassengerName) {
        await tx.customer.update({
          where: { id: existingQuotation.customerId },
          data: { nameAr: mainPassengerName }
        });
      }
    }

    await tx.quotationHotel.deleteMany({ where: { quotationId } });
    await tx.quotationFlight.deleteMany({ where: { quotationId } });
    await tx.quotationCar.deleteMany({ where: { quotationId } });
    await tx.quotationService.deleteMany({ where: { quotationId } });
    await tx.quotationPassenger.deleteMany({ where: { quotationId } });

    await tx.quotation.update({
      where: { id: quotationId },
      data: {
        referenceNumber: finalReferenceNumber,
        createdAt: existingQuotation.status === 'draft' ? new Date() : existingQuotation.createdAt,
        subtotal: finalSubtotal,
        totalPrice: finalTotalPrice,
        profit: finalProfit,
        commissionAmount: finalCommission,
        status: data.status as any,

        ...(state?.basicInfo && {
          adults: state.basicInfo.adults,
          children: state.basicInfo.children,
          infants: state.basicInfo.infants,
          destinationCityId: state.basicInfo.destinationCityIds?.[0] || null,
          cities_quotationdestinations: {
            set: (state.basicInfo.destinationCityIds || []).filter(id => id && id.length === 36).map(id => ({ id }))
          },
          source: (state.basicInfo.channel as SourceType) || 'b2c',
          agentId: state.basicInfo.agencyId || null,
          notes: state.basicInfo.notes || null,
          ...(state.basicInfo.salesPersonId && { salesEmployeeId: state.basicInfo.salesPersonId }),
          ...(state.basicInfo.companyId ? { companyId: state.basicInfo.companyId } : { companyId: null }),
          startDate: toSafeDate(state.basicInfo.startDate) || existingQuotation.startDate,
          endDate: toSafeDate(state.basicInfo.endDate) || existingQuotation.endDate,
          passengers: {
            create: state.basicInfo.passengers?.map((p, index) => ({
              name: p.name || '',
              type: p.type || 'adult',
              passport: p.passport || null,
              age: p.age ?? null,
              createdAt: new Date(Date.now() + index * 1000)
            })) || []
          }
        }),

        ...(state && {
          quotationHotels: {
            create: mappedHotels
          },
          quotationFlights: {
            create: state.isFlightsEnabled ? (state.flights?.map(f => ({
              description: f.description || '',
              flightType: f.type || 'domestic',
              departureDate: toSafeDate(f.date) || new Date(),
              passengers: f.paxCount || 1,
              price: f.price || 0,
              currency: (f.currency as Currency) || 'USD',
              totalAmount: (f.price || 0) * (f.paxCount || 1)
            })) || []) : []
          },
          quotationCars: {
            create: state.isCarsEnabled ? (state.carRentals?.map(c => ({
              pickupDate: toSafeDate(c.pickupDate) || new Date(),
              dropoffDate: toSafeDate(c.dropoffDate) || new Date(),
              description: c.description || '',
              days: c.days || 1,
              pricePerDay: c.price || 0,
              currency: (c.currency as Currency) || 'USD',
              totalAmount: (c.price || 0) * (c.days || 1)
            })) || []) : []
          },
          quotationServices: {
            create: allServices.map(s => ({
              ...(s.serviceId && validServiceIds.has(s.serviceId) ? { serviceId: s.serviceId } : {}),
              ...(s.providerId ? { providerId: s.providerId } : {}),
              nameAr: s.name || 'بدون اسم',
              quantity: s.quantity || 1,
              serviceDate: toSafeDate(s.date) || new Date(),
              purchasePrice: s.purchasePrice || 0,
              sellingPrice: s.sellingPrice || 0,
              descriptionAr: s.notes || null,
            }))
          }
        })
      }
    });

    // If structural changes were detected, mark related booking for invoice regeneration
    if (structuralChangesDetected && existingQuotation.status === 'confirmed') {
      await tx.booking.updateMany({
        where: { quotationId, status: 'confirmed' },
        data: { invoiceNeedsUpdate: true }
      });
      
      // We ALSO find invalid vouchers that belonged to these deleted structures,
      // but typically we let the UI tell the user the invoice needs update 
      // rather than hard deleting here to avoid breaking reference history.
    }
  }, {
    maxWait: 5000,
    timeout: 10000,
  });

  // Invalidate any related hotel reports cache
  reportCache.invalidate('hotel-report-');

  return { success: true, referenceNumber: finalReferenceNumber };
}

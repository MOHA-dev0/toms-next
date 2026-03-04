import { notFound, redirect } from "next/navigation";
import { getUserContext } from "@/lib/permissions";
import prisma from "@/lib/prisma";
import QuotationEditClient from "./QuotationEditClient";
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { getServices, getServiceProviders, getQuotationReferenceData, getHotelsByCity } from '@/app/actions/quotation-actions';

export default async function EditQuotationPage({ params }: { params: Promise<{ id: string }> }) {
  const userContext = await getUserContext();
  if (!userContext) {
    redirect("/auth");
  }

  const { id } = await params;

  // 1. Fetch the main quotation first with simple select
  const quotationBase = await prisma.quotation.findUnique({
    where: { id },
    select: {
      id: true,
      referenceNumber: true,
      customerId: true,
      salesEmployeeId: true,
      agentId: true,
      source: true,
      destinationCityId: true,
      status: true,
      startDate: true,
      endDate: true,
      adults: true,
      children: true,
      infants: true,
      subtotal: true,
      commissionAmount: true,
      totalPrice: true,
      profit: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
      paidAmount: true,
      companyId: true,
      customer: true,
      destinationCity: true,
      cities_quotationdestinations: true,
      agent: true,
    },
  });

  if (!quotationBase) {
    notFound();
  }

  // Security check mapping
  const isOwner = quotationBase.salesEmployeeId === userContext.employeeId;
  const isConfirmed = quotationBase.status === 'confirmed';

  if (userContext.isSales && !isOwner) {
    redirect("/dashboard/quotations");
  }

  if (userContext.isBooking && !isOwner && !isConfirmed) {
    redirect("/dashboard/quotations");
  }

  // 2. Fetch heavy nested objects in parallel
  const [
    quotationHotels,
    quotationServices,
    quotationFlights,
    quotationCars,
    passengers,
  ] = await Promise.all([
    prisma.quotationHotel.findMany({
      where: { quotationId: id },
      include: { hotel: true, roomType: true },
    }),
    prisma.quotationService.findMany({
      where: { quotationId: id },
      include: { service: true },
    }),
    prisma.quotationFlight.findMany({
      where: { quotationId: id },
    }),
    prisma.quotationCar.findMany({
      where: { quotationId: id },
    }),
    prisma.quotationPassenger.findMany({
      where: { quotationId: id },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  // Helper: safely parse date strings without timezone shifting
  function toSafeDate(value: any): Date | undefined {
    if (!value) return undefined;
    const str = value instanceof Date ? value.toISOString() : String(value);
    const dateMatch = str.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (dateMatch) {
      const [, year, month, day] = dateMatch;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0);
    }
    return new Date(str);
  }

  const parsedStartDate = toSafeDate(quotationBase.startDate);
  const parsedEndDate = toSafeDate(quotationBase.endDate);

  // Mapped Data to pass cleanly into Client Component without Prism's native Decimals
  const mappedState = {
    basicInfo: {
      channel: quotationBase.source as "b2c" | "b2b",
      agencyId: quotationBase.agentId || undefined,
      salesPersonId: quotationBase.salesEmployeeId || undefined,
      referenceNumber: quotationBase.referenceNumber,
      quotationId: quotationBase.id,
      companyId: quotationBase.companyId || undefined,
      destinationCityIds: quotationBase.cities_quotationdestinations?.length > 0
        ? quotationBase.cities_quotationdestinations.map((d: any) => d.id)
        : (quotationBase.destinationCityId ? [quotationBase.destinationCityId] : []),
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      nights: parsedStartDate && parsedEndDate ? Math.ceil((parsedEndDate.getTime() - parsedStartDate.getTime()) / (1000 * 60 * 60 * 24)) : 0,
      adults: quotationBase.adults || 1,
      children: quotationBase.children || 0,
      infants: quotationBase.infants || 0,
      notes: quotationBase.notes || undefined,
      passengers: passengers?.map((p: any) => ({
        id: p.id,
        name: p.name && p.name.toLowerCase() !== 'unknown' ? p.name : '',
        type: p.type,
        age: p.age,
      })) || [],
    },
    hotelSegments: quotationHotels?.map((h: any) => ({
        id: h.id,
        checkIn: toSafeDate(h.checkIn) || new Date(),
        checkOut: toSafeDate(h.checkOut) || new Date(),
        cityId: h.hotel?.cityId || "",
        hotelId: h.hotelId,
        roomTypeId: h.roomTypeId,
        boardType: h.board || "bb",
        roomsCount: h.roomsCount || 1,
        usage: h.usage || "dbl",
        purchasePrice: Number(h.purchasePrice) || 0,
        sellingPrice: Number(h.sellingPrice) || 0, // Always USD (frozen)
        currency: "USD",
        originalPrice: h.originalPrice ? Number(h.originalPrice) : undefined,
        originalCurrency: h.originalCurrency || undefined,
        exchangeRate: h.exchangeRate ? Number(h.exchangeRate) : undefined,
        notes: h.notes || "",
        isVoucherVisible: true,
      })) || [],
    itineraryServices: quotationServices
        ?.filter((s: any) => s.serviceId) // Services with linked service master
        .map((s: any) => {
          const sDate = toSafeDate(s.serviceDate) || new Date();
          const qStart = parsedStartDate || sDate;
          const dNum = Math.max(1, Math.floor((sDate.getTime() - qStart.getTime()) / (1000 * 60 * 60 * 24)) + 1);
          return {
            id: s.id,
            dayNumber: dNum,
            date: sDate,
            serviceId: s.serviceId,
            providerId: s.providerId || "",
            name: s.nameAr || "",
            quantity: s.quantity || 1,
            purchasePrice: Number(s.purchasePrice) || 0,
            sellingPrice: Number(s.sellingPrice) || 0,
            currency: "USD",
            notes: s.descriptionAr || "",
          };
        }) || [],
    otherServices: quotationServices
        ?.filter((s: any) => !s.serviceId && s.nameAr && s.nameAr !== 'بدون اسم')
        .map((s: any) => {
          const sDate = toSafeDate(s.serviceDate) || new Date();
          const qStart = parsedStartDate || sDate;
          const dNum = Math.max(1, Math.floor((sDate.getTime() - qStart.getTime()) / (1000 * 60 * 60 * 24)) + 1);
          return {
            id: s.id,
            dayNumber: dNum,
            date: sDate,
            serviceId: "",
            providerId: s.providerId || "",
            name: s.nameAr || "",
            quantity: s.quantity || 1,
            purchasePrice: Number(s.purchasePrice) || 0,
            sellingPrice: Number(s.sellingPrice) || 0,
            currency: "USD",
            notes: s.descriptionAr || "",
          };
        }) || [],
    isFlightsEnabled: quotationFlights && quotationFlights.length > 0,
    flights: quotationFlights?.map((f: any) => ({
      id: f.id,
      date: toSafeDate(f.departureDate) || new Date(),
      description: f.description || "",
      type: f.flightType || "domestic",
      paxCount: f.passengers || 1,
      price: Number(f.price) || 0,
      currency: f.currency || "USD",
    })) || [],
    isCarsEnabled: quotationCars && quotationCars.length > 0,
    carRentals: quotationCars?.map((c: any) => ({
      id: c.id,
      pickupDate: toSafeDate(c.pickupDate) || new Date(),
      dropoffDate: toSafeDate(c.dropoffDate) || new Date(),
      days: c.days || 1,
      description: c.description || "",
      price: Number(c.pricePerDay) || 0,
      currency: c.currency || "USD",
    })) || [],
    financials: {
      marginType: "fixed",
      marginValue: Number(quotationBase.profit) || 0,
      commissionType: "fixed",
      commissionValue: Number(quotationBase.commissionAmount) || 0,
      currency: "USD",
    },
  };

  // Prefetch ONLY Step 1 data synchronously to ensure instant UX.
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({ queryKey: ['quotationReferenceData'], queryFn: getQuotationReferenceData });

  // Do NOT block on hotels, services, or providers.
  // They will be pre-fetched in the background via QuotationWizard on the client.

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <QuotationEditClient initialState={mappedState} quotationStatus={quotationBase.status} />
    </HydrationBoundary>
  );
}

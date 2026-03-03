import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserContext } from '@/lib/permissions';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userContext = await getUserContext();
    if (!userContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    // Security check: 
    // Admin: everything.
    // Sales: only own.
    // Booking: own OR confirmed others.
    const isOwner = quotationBase.salesEmployeeId === userContext.employeeId;
    const isConfirmed = quotationBase.status === 'confirmed';

    if (userContext.isSales && !isOwner) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (userContext.isBooking && !isOwner && !isConfirmed) {
      return NextResponse.json({ error: 'Access denied - Quotation not confirmed' }, { status: 403 });
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
        select: {
          id: true,
          quotationId: true,
          hotelId: true,
          roomTypeId: true,
          roomPricingId: true,
          checkIn: true,
          checkOut: true,
          nights: true,
          roomsCount: true,
          usage: true,
          board: true,
          purchasePrice: true,
          sellingPrice: true,
          notes: true,
          originalPrice: true,
          originalCurrency: true,
          exchangeRate: true,
          createdAt: true,
          hotel: {
            select: {
              id: true,
              cityId: true,
              nameAr: true,
              nameTr: true,
              addressAr: true,
              addressTr: true,
              stars: true,
              phone: true,
              email: true,
              isActive: true,
              createdAt: true,
              city: true,
            },
          },
          roomType: true,
        },
      }),
      prisma.quotationService.findMany({
        where: { quotationId: id },
        select: {
          id: true,
          quotationId: true,
          serviceId: true,
          providerId: true,
          nameAr: true,
          descriptionAr: true,
          quantity: true,
          purchasePrice: true,
          sellingPrice: true,
          serviceDate: true,
          createdAt: true,
          descriptionEn: true,
          service: {
            select: {
              id: true,
              cityId: true,
              nameAr: true,
              nameEn: true,
              descriptionAr: true,
              purchasePrice: true,
              currency: true,
              isActive: true,
              createdAt: true,
              descriptionEn: true,
              city: true,
            },
          },
        },
      }),
      prisma.quotationFlight.findMany({
        where: { quotationId: id },
        select: {
          id: true,
          quotationId: true,
          departureDate: true,
          description: true,
          flightType: true,
          passengers: true,
          price: true,
          currency: true,
          totalAmount: true,
          createdAt: true,
        },
      }),
      prisma.quotationCar.findMany({
        where: { quotationId: id },
        select: {
          id: true,
          quotationId: true,
          pickupDate: true,
          dropoffDate: true,
          description: true,
          days: true,
          pricePerDay: true,
          currency: true,
          totalAmount: true,
          createdAt: true,
        },
      }),
      prisma.quotationPassenger.findMany({
        where: { quotationId: id },
        select: {
          id: true,
          quotationId: true,
          name: true,
          type: true,
          passport: true,
          age: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    // Assemble the complete payload to match the original response format exactly
    const fullQuotation = {
      ...quotationBase,
      quotationHotels,
      quotationServices,
      quotationFlights,
      quotationCars,
      passengers,
    };

    return NextResponse.json(fullQuotation);
  } catch (error) {
    console.error('Error fetching quotation:', error);
    return NextResponse.json({ error: 'Failed to fetch quotation' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userContext = await getUserContext();
    if (!userContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    if (body.status === 'confirmed') {
      const existingQuotation = await prisma.quotation.findUnique({
        where: { id },
        include: { passengers: true },
      });

      if (!existingQuotation) {
        return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
      }

      const totalPax = (existingQuotation.adults || 0) + (existingQuotation.children || 0) + (existingQuotation.infants || 0);
      const validPassengers = existingQuotation.passengers.filter(p => p.name && p.name.trim().length > 0 && p.name.trim().toLowerCase() !== 'unknown');

      if (validPassengers.length < totalPax) {
        return NextResponse.json(
          { error: 'يجب إدخال أسماء جميع الضيوف كاملة قبل تأكيد العرض.' },
          { status: 400 }
        );
      }
    }

    const quotation = await prisma.quotation.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(quotation);
  } catch (error) {
    console.error('Error updating quotation:', error);
    return NextResponse.json({ error: 'Failed to update quotation' }, { status: 500 });
  }
}

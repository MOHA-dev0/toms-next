import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { getUserContext } from "@/lib/permissions";
import ItineraryView from "@/components/quotations/itinerary/ItineraryView";
import QuotationViewActions from "./components/QuotationViewActions";
import FullscreenLayoutWrapper from "./components/FullscreenLayoutWrapper";

// Force caching or revalidation for 2 minutes to reduce DB load
export const revalidate = 120; // 120 seconds

async function getQuotationData(id: string) {
  // 1. Authorization checks immediately
  const userContext = await getUserContext();
  if (!userContext) {
    throw new Error("Unauthorized");
  }

  // 2. Fetch Base Quotation
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
    return null;
  }

  // 3. Security checks
  const isOwner = quotationBase.salesEmployeeId === userContext.employeeId;
  const isConfirmed = quotationBase.status === "confirmed";

  if (userContext.isSales && !isOwner) {
    throw new Error("Access denied - You can only view your own quotations");
  }

  if (userContext.isBooking && !isOwner && !isConfirmed) {
    throw new Error("Access denied - Quotation not confirmed");
  }

  // 4. Parallel fetch of the heavy relations
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
      orderBy: { createdAt: "asc" },
    }),
  ]);

  // Return exactly the structure expected by ItineraryView
  return {
    ...quotationBase,
    quotationHotels,
    quotationServices,
    quotationFlights,
    quotationCars,
    passengers,
  };
}

// Ensure params are properly typed for App Router async params
type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function QuotationViewPage({ params }: PageProps) {
  const { id } = await params;

  let quotation;
  try {
    quotation = await getQuotationData(id);
    if (!quotation) {
      notFound();
    }
  } catch (error: any) {
    return (
      <div className="flex h-screen items-center justify-center p-8 bg-gray-50">
        <div className="bg-white border-red-200 border p-8 rounded-lg text-center max-w-lg shadow-sm">
          <h2 className="text-xl font-bold text-red-600 mb-2">خطأ في الصلاحيات أو التحميل</h2>
          <p className="text-gray-600 font-medium">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mutate body classes for fullscreen display safely on client mount */}
      <FullscreenLayoutWrapper />

      <style dangerouslySetInnerHTML={{ __html: `
        body.itinerary-fullscreen aside,
        body.itinerary-fullscreen [data-sidebar],
        body.itinerary-fullscreen nav {
          display: none !important;
        }

        /* إلغاء الهامش الأيمن (mr-64) من الـ main */
        body.itinerary-fullscreen main {
          margin-right: 0 !important;
          margin-left: 0 !important;
        }

        /* إخفاء هيدر الداشبورد */
        body.itinerary-fullscreen main > header:first-child {
          display: none !important;
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 12mm;
          }

          /* إخفاء شريط الإجراءات */
          #no-print-header {
            display: none !important;
          }

          /* إخفاء الشريط الجانبي والهيدر */
          aside, nav, header, footer,
          [data-sidebar], #no-print-header {
            display: none !important;
          }

          /* إلغاء الهامش */
          main {
            margin-right: 0 !important;
            margin-left: 0 !important;
          }

          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          #page-content-wrapper {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            min-height: auto !important;
          }

          #printable-itinerary {
            display: block !important;
            position: static !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            height: auto !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
          }
        }
      `}} />

      {/* شريط الإجراءات (Interactive Client Component) */}
      <QuotationViewActions referenceNumber={quotation.referenceNumber} />

      {/* محتوى مسار الرحلة */}
      <div id="page-content-wrapper" className="w-full bg-[#f8f9fc] min-h-screen pb-12 font-sans">
        <div className="max-w-4xl mx-auto mt-8 print:mt-0 print:max-w-none">
          <ItineraryView quotation={quotation} />
        </div>
      </div>
    </>
  );
}

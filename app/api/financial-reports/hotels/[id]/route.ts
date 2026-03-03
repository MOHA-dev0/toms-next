import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/auth';

export interface HotelDetailBooking {
  quotationHotelId: string;
  quotationId: string;
  referenceNumber: string;
  customerName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  roomsCount: number;
  roomTypeName: string;
  usage: string;
  board: string;
  purchasePrice: number;
  purchasePriceOriginal: number;
  originalCurrency: string;
  sellingPrice: number;
  profit: number;
}

export interface HotelDetailResponse {
  hotel: {
    id: string;
    nameAr: string;
    cityName: string;
    stars: number | null;
  };
  bookings: HotelDetailBooking[];
  summary: {
    totalBookings: number;
    totalNights: number;
    totalRooms: number;
    totalPurchase: number;
    totalSelling: number;
    totalProfit: number;
  };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<HotelDetailResponse | { error: string }>> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'غير مصرح لك بالوصول' }, { status: 401 });
    }

    const { id: hotelId } = await params;
    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');

    // Fetch hotel info
    const hotel = await prisma.hotel.findUnique({
      where: { id: hotelId },
      include: { city: { select: { nameAr: true } } },
    });

    if (!hotel) {
      return NextResponse.json({ error: 'الفندق غير موجود' }, { status: 404 });
    }

    // Build date filter for check-in
    const dateFilter: Record<string, Date> = {};
    if (fromDate) {
      dateFilter.gte = new Date(fromDate);
    }
    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      dateFilter.lte = to;
    }

    // Fetch all quotation_hotels for this hotel where quotation is confirmed
    const quotationHotels = await prisma.quotationHotel.findMany({
      where: {
        hotelId,
        quotation: { status: 'confirmed' },
        ...(Object.keys(dateFilter).length > 0 ? { checkIn: dateFilter } : {}),
      },
      include: {
        quotation: {
          include: {
            customer: { select: { nameAr: true } },
          },
        },
        roomType: { select: { nameAr: true } },
      },
      orderBy: { checkIn: 'desc' },
    });

    let totalPurchase = 0;
    let totalSelling = 0;
    let totalNights = 0;
    let totalRooms = 0;

    const bookings: HotelDetailBooking[] = quotationHotels.map((qh) => {
      const nightsTotal = qh.nights * qh.roomsCount;
      const purchase = Number(qh.purchasePrice) * qh.nights * qh.roomsCount;
      
      let purchaseOriginUnit = Number(qh.purchasePrice);
      const cur = qh.originalCurrency || 'USD';
      
      if (cur !== 'USD' && qh.exchangeRate && Number(qh.exchangeRate) > 0) {
        purchaseOriginUnit = Number(qh.purchasePrice) / Number(qh.exchangeRate);
      } else if (qh.originalPrice) {
        purchaseOriginUnit = Number(qh.originalPrice);
      }
      const purchaseOriginalTotal = purchaseOriginUnit * qh.nights * qh.roomsCount;

      const selling = Number(qh.sellingPrice) * qh.nights * qh.roomsCount;
      const profit = selling - purchase;

      totalPurchase += purchase;
      totalSelling += selling;
      totalNights += nightsTotal;
      totalRooms += qh.roomsCount;

      return {
        quotationHotelId: qh.id,
        quotationId: qh.quotationId,
        referenceNumber: qh.quotation.referenceNumber,
        customerName: qh.quotation.customer?.nameAr || 'غير معروف',
        checkIn: qh.checkIn.toISOString(),
        checkOut: qh.checkOut.toISOString(),
        nights: qh.nights,
        roomsCount: qh.roomsCount,
        roomTypeName: qh.roomType?.nameAr || '-',
        usage: qh.usage,
        board: qh.board,
        purchasePrice: purchase,
        purchasePriceOriginal: purchaseOriginalTotal,
        originalCurrency: cur,
        sellingPrice: selling,
        profit,
      };
    });

    return NextResponse.json({
      hotel: {
        id: hotel.id,
        nameAr: hotel.nameAr,
        cityName: hotel.city?.nameAr || '-',
        stars: hotel.stars,
      },
      bookings,
      summary: {
        totalBookings: bookings.length,
        totalNights,
        totalRooms,
        totalPurchase,
        totalSelling,
        totalProfit: totalSelling - totalPurchase,
      },
    });
  } catch (error) {
    console.error('Error fetching hotel detail report:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب تقرير الفندق' }, { status: 500 });
  }
}

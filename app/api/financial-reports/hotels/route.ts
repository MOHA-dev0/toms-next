import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/auth';
import type { Prisma } from '@prisma/client';

export interface HotelFinancialItem {
  id: string;
  hotelName: string;
  cityName: string;
  bookingsCount: number;
  totalNights: number;
  totalPurchaseAmount: number;
  totalSellingAmount: number;
  totalProfit: number;
}

export interface HotelFinancialResponse {
  data: HotelFinancialItem[];
  summary: {
    totalHotels: number;
    totalBookings: number;
    totalPurchaseAmount: number;
    totalSellingAmount: number;
    totalProfit: number;
  };
  meta: {
    totalCount: number;
    page: number;
    limit: number;
    pageCount: number;
  };
}

export async function GET(request: Request): Promise<NextResponse<HotelFinancialResponse | { error: string }>> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'غير مصرح لك بالوصول' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
    const source = searchParams.get('source'); // b2b | b2c | null (all)
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');

    // Build quotation filter
    const quotationWhere: Prisma.QuotationWhereInput = { status: 'confirmed' };
    if (source === 'b2b' || source === 'b2c') {
      quotationWhere.source = source;
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

    const qhWhere: Prisma.QuotationHotelWhereInput = {
      quotation: quotationWhere,
      ...(Object.keys(dateFilter).length > 0 ? { checkIn: dateFilter } : {}),
    };

    const hotels = await prisma.hotel.findMany({
      where: { isActive: true },
      include: {
        city: { select: { nameAr: true } },
        quotationHotels: {
          where: qhWhere,
          select: {
            nights: true,
            roomsCount: true,
            purchasePrice: true,
            sellingPrice: true,
          },
        },
      },
      orderBy: { nameAr: 'asc' },
    });

    let totalBookings = 0;
    let totalPurchase = 0;
    let totalSelling = 0;

    const allData: HotelFinancialItem[] = hotels.map((hotel) => {
      const bookingsCount = hotel.quotationHotels.length;
      const totalNights = hotel.quotationHotels.reduce(
        (sum, qh) => sum + (qh.nights * qh.roomsCount), 0
      );
      const purchaseAmount = hotel.quotationHotels.reduce(
        (sum, qh) => sum + Number(qh.purchasePrice) * qh.nights * qh.roomsCount, 0
      );
      const sellingAmount = hotel.quotationHotels.reduce(
        (sum, qh) => sum + Number(qh.sellingPrice) * qh.nights * qh.roomsCount, 0
      );

      totalBookings += bookingsCount;
      totalPurchase += purchaseAmount;
      totalSelling += sellingAmount;

      return {
        id: hotel.id,
        hotelName: hotel.nameAr,
        cityName: hotel.city?.nameAr || '-',
        bookingsCount,
        totalNights,
        totalPurchaseAmount: purchaseAmount,
        totalSellingAmount: sellingAmount,
        totalProfit: sellingAmount - purchaseAmount,
      };
    });

    allData.sort((a, b) => {
      if (a.bookingsCount === 0 && b.bookingsCount > 0) return 1;
      if (a.bookingsCount > 0 && b.bookingsCount === 0) return -1;
      return b.totalSellingAmount - a.totalSellingAmount;
    });

    const totalCount = allData.length;
    const skip = (page - 1) * limit;
    const paginatedData = allData.slice(skip, skip + limit);

    return NextResponse.json({
      data: paginatedData,
      summary: {
        totalHotels: allData.filter((h) => h.bookingsCount > 0).length,
        totalBookings,
        totalPurchaseAmount: totalPurchase,
        totalSellingAmount: totalSelling,
        totalProfit: totalSelling - totalPurchase,
      },
      meta: { totalCount, page, limit, pageCount: Math.ceil(totalCount / limit) },
    });
  } catch (error) {
    console.error('Error fetching hotel financial reports:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب تقارير الفنادق' }, { status: 500 });
  }
}

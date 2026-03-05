import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/auth';
import { reportCache } from '@/lib/cache';
import ExcelJS from 'exceljs';
import { Prisma } from '@prisma/client';

export interface HotelDetailBooking {
  quotationHotelId: string;
  quotationId: string;
  referenceNumber: string;
  channel: string;
  agency: string;
  sales: string;
  voucherNo: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  roomsCount: number;
  room: string;
  roomTypeSpecification: string;
  board: string;
  adults: number;
  child: number;
  totalPax: number;
  cost: number;
  totalCost: number;
  salePrice: number;
  totalSale: number;
  note: string;
  names: string;
  originalCurrency: string;
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
  };
  pagination: {
    totalRecords: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<HotelDetailResponse | { error: string }> | Response> {
  try {
    const userId = await getCurrentUserId();
    if (!userId && process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'غير مصرح لك بالوصول' }, { status: 401 });
    }

    const { id: hotelId } = await params;
    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');
    const pageString = searchParams.get('page');
    const page = pageString ? parseInt(pageString, 10) : 1;
    const pageSizeString = searchParams.get('pageSize');
    const pageSize = pageSizeString ? parseInt(pageSizeString, 10) : 25;
    const exportExcel = searchParams.get('export') === 'excel';

    const cacheKey = `hotel-report-${hotelId}-${fromDate || ''}-${toDate || ''}-${page}-${pageSize}-${exportExcel}-v2`;
    const cachedData = reportCache.get<any>(cacheKey);

    if (cachedData) {
      if (exportExcel) {
        return new NextResponse(Buffer.from(cachedData.base64, 'base64'), {
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(cachedData.filename)}.xlsx`,
          },
        });
      }
      return NextResponse.json(cachedData);
    }

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
    const to = toDate ? new Date(toDate) : undefined;
    if (fromDate) {
      dateFilter.gte = new Date(fromDate);
    }
    if (to) {
      to.setHours(23, 59, 59, 999);
      dateFilter.lte = to;
    }

    const dbWhere: Prisma.QuotationHotelWhereInput = {
      hotelId,
      quotation: { status: 'confirmed' },
      ...(Object.keys(dateFilter).length > 0 ? { checkIn: dateFilter } : {}),
    };

    const whereConditions = [Prisma.sql`qh.hotel_id = ${hotelId}::uuid AND q.status = 'confirmed'::"QuotationStatus"`];
    if (fromDate) whereConditions.push(Prisma.sql`qh.check_in >= ${dateFilter.gte!}`);
    if (to) whereConditions.push(Prisma.sql`qh.check_in <= ${dateFilter.lte!}`);
    const whereQuery = Prisma.sql`${Prisma.join(whereConditions, ' AND ')}`;

    // Database-level Aggregation Queries
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const summaryResult = await prisma.$queryRaw<any[]>`
      SELECT 
        COUNT(*)::int AS "totalBookings",
        COALESCE(SUM(qh.nights * qh.rooms_count)::int, 0) AS "totalNights",
        COALESCE(SUM(qh.rooms_count)::int, 0) AS "totalRooms",
        COALESCE(SUM(qh.purchase_price * qh.nights * qh.rooms_count)::numeric, 0) AS "totalPurchase",
        COALESCE(SUM(qh.selling_price * qh.nights * qh.rooms_count)::numeric, 0) AS "totalSelling"
      FROM quotation_hotels qh
      INNER JOIN quotations q ON qh.quotation_id = q.id
      WHERE ${whereQuery}
    `;

    const summaryRaw = summaryResult[0];

    const summary = {
      totalBookings: Number(summaryRaw?.totalBookings || 0),
      totalNights: Number(summaryRaw?.totalNights || 0),
      totalRooms: Number(summaryRaw?.totalRooms || 0),
      totalPurchase: Number(summaryRaw?.totalPurchase || 0),
      totalSelling: Number(summaryRaw?.totalSelling || 0),
    };

    const totalRecords = summary.totalBookings;
    const totalPages = Math.ceil(totalRecords / pageSize);
    const skip = (page - 1) * pageSize;

    // Fetch quotation_hotels matching the criteria
    const quotationHotels = await prisma.quotationHotel.findMany({
      where: dbWhere,
      include: {
        quotation: {
          include: {
            customer: { select: { nameAr: true } },
            agent: { select: { nameEn: true } },
            salesEmployee: { select: { nameAr: true } },
            passengers: { select: { name: true } },
            bookings: {
              include: {
                vouchers: {
                  where: { hotelId }
                }
              }
            }
          },
        },
        roomType: { select: { nameAr: true } },
      },
      orderBy: { checkIn: 'desc' },
      skip: exportExcel ? undefined : skip,
      take: exportExcel ? undefined : pageSize,
    });

    const bookings: HotelDetailBooking[] = quotationHotels.map((qh) => {
      const q = qh.quotation;
      
      const purchase = Number(qh.purchasePrice);
      let purchaseOriginUnit = purchase;
      const cur = qh.originalCurrency || 'USD';
      
      if (cur !== 'USD' && qh.exchangeRate && Number(qh.exchangeRate) > 0) {
        purchaseOriginUnit = purchase / Number(qh.exchangeRate);
      } else if (qh.originalPrice) {
        purchaseOriginUnit = Number(qh.originalPrice);
      }
      const purchaseOriginalTotal = purchaseOriginUnit * qh.nights * qh.roomsCount;

      const selling = Number(qh.sellingPrice);
      const sellingTotal = selling * qh.nights * qh.roomsCount;

      // Extract voucher
      let voucherNo = '';
      if (q.bookings && q.bookings.length > 0) {
        for (const bk of q.bookings) {
          if (bk.vouchers && bk.vouchers.length > 0) {
            voucherNo = bk.vouchers[0].voucherCode;
            break;
          }
        }
      }

      const adults = q.adults || 0;
      const child = q.children || 0;
      const infants = q.infants || 0;
      const totalPax = adults + child + infants;
      
      let names = q.passengers?.map(p => p.name).join(' | ') || '';
      if (!names) {
        names = q.customer?.nameAr || '';
      }

      return {
        quotationHotelId: qh.id,
        quotationId: qh.quotationId,
        referenceNumber: q.referenceNumber,
        channel: q.source === 'b2b' ? 'B2B' : 'B2C',
        agency: q.agent?.nameEn || '',
        sales: q.salesEmployee?.nameAr || '',
        voucherNo: voucherNo,
        checkIn: qh.checkIn.toISOString(),
        checkOut: qh.checkOut.toISOString(),
        nights: qh.nights,
        roomsCount: qh.roomsCount,
        room: qh.roomType?.nameAr || '-',
        roomTypeSpecification: qh.usage,
        board: qh.board,
        adults: adults,
        child: child,
        totalPax: totalPax,
        cost: purchaseOriginUnit,
        totalCost: purchaseOriginalTotal,
        salePrice: selling,
        totalSale: sellingTotal,
        note: qh.notes || '',
        names: names,
        originalCurrency: cur,
      };
    });

    if (exportExcel) {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('تقرير حجوزات الفندق');

      sheet.columns = [
        { header: 'Reference', key: 'referenceNumber', width: 15 },
        { header: 'Channel', key: 'channel', width: 10 },
        { header: 'Agency', key: 'agency', width: 20 },
        { header: 'Sales', key: 'sales', width: 20 },
        { header: 'Customer/Passengers', key: 'names', width: 30 },
        { header: 'Voucher No', key: 'voucherNo', width: 15 },
        { header: 'Check In', key: 'checkIn', width: 15 },
        { header: 'Check Out', key: 'checkOut', width: 15 },
        { header: 'Nights', key: 'nights', width: 10 },
        { header: 'Rooms', key: 'roomsCount', width: 10 },
        { header: 'Room Type', key: 'room', width: 20 },
        { header: 'Board', key: 'board', width: 10 },
        { header: 'Adults', key: 'adults', width: 10 },
        { header: 'Child', key: 'child', width: 10 },
        { header: 'Total Pax', key: 'totalPax', width: 10 },
        { header: 'Cost', key: 'cost', width: 15 },
        { header: 'Total Cost', key: 'totalCost', width: 15 },
        { header: 'Currency', key: 'originalCurrency', width: 10 },
        { header: 'Sale Price', key: 'salePrice', width: 15 },
        { header: 'Total Sale', key: 'totalSale', width: 15 },
        { header: 'Note', key: 'note', width: 30 },
      ];

      const headerRow = sheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4F46E5' } // Indigo color
      };
      headerRow.height = 25;

      bookings.forEach(b => {
        sheet.addRow({
          ...b,
          checkIn: new Date(b.checkIn).toLocaleDateString('en-GB'),
          checkOut: new Date(b.checkOut).toLocaleDateString('en-GB'),
        });
      });

      sheet.getColumn('cost').numFmt = '#,##0.00';
      sheet.getColumn('totalCost').numFmt = '#,##0.00';
      sheet.getColumn('salePrice').numFmt = '#,##0.00';
      sheet.getColumn('totalSale').numFmt = '#,##0.00';

      sheet.addRow({
        referenceNumber: 'Total / الإجمالي',
        nights: summary.totalNights,
        roomsCount: summary.totalRooms,
        totalCost: summary.totalPurchase,
        totalSale: summary.totalSelling,
      });
      const totalsRow = sheet.lastRow;
      if (totalsRow) {
        totalsRow.font = { bold: true, color: { argb: 'FF1F2937' } };
        totalsRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF3F4F6' } // light gray 
        };
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const base64Excel = Buffer.from(buffer).toString('base64');
      
      const safeHotelName = hotel.nameAr || hotel.nameTr || 'Hotel_Report';
      const cleanHotelName = safeHotelName.replace(/[/\\?%*:|"<>]/g, '-');
      const finalFileName = `${cleanHotelName}_Report_${new Date().toISOString().split('T')[0]}`;
      
      reportCache.set(cacheKey, { base64: base64Excel, filename: finalFileName }, 30);

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(finalFileName)}.xlsx`,
        },
      });
    }

    const payload: HotelDetailResponse = {
      hotel: {
        id: hotel.id,
        nameAr: hotel.nameAr,
        cityName: hotel.city?.nameAr || '-',
        stars: hotel.stars,
      },
      bookings,
      summary,
      pagination: {
        totalRecords,
        totalPages,
        currentPage: page,
        pageSize,
      },
    };

    reportCache.set(cacheKey, payload, 30);

    return NextResponse.json(payload);
  } catch (error: any) {
    console.error('Error fetching hotel detail report:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب تقرير الفندق', details: error?.message, stack: error?.stack }, { status: 500 });
  }
}

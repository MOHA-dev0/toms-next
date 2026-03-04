import { NextResponse } from 'next/server'
import { hotelService } from '@/services/hotel.service'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 1. Extract and parse query parameters (with defaults)
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '9', 10);
    const search = searchParams.get('search') || '';

    // 2. Build the exact Prisma `where` clause
    const whereClause: any = {};
    if (search) {
      whereClause.OR = [
        { nameAr: { contains: search, mode: 'insensitive' } },
        { city: { nameAr: { contains: search, mode: 'insensitive' } } }
      ];
    }

    // 3. Fire two queries in parallel: Count + Data
    // We use Promise.all so the DB executes them concurrently
    const [totalCount, hotels] = await Promise.all([
      // Query A: get the total number of rows matching the search
      prisma.hotel.count({ where: whereClause }),
      
      // Query B: get the actual N rows for THIS page
      // OPTIMIZATION: Replacing `include` with `select`.
      // The frontend grid only displays hotel name, city name, and basic room type stats.
      // Fetching all deep `roomPricing` matrices here forces Neon to perform immense JOIN logic and bloats the JS heap.
      prisma.hotel.findMany({
        where: whereClause,
        select: {
          id: true,
          nameAr: true,
          createdAt: true,
          city: {
            select: { nameAr: true, id: true }
          },
          roomTypes: {
             select: {
               id: true,
               nameAr: true,
               board: true,
               basePrice: true,
               currency: true
             }
          }
        },
        skip: (page - 1) * limit, // The Pagination Math
        take: limit,
        orderBy: { createdAt: 'desc' }
      })
    ]);

    // 4. Return the new payload structure
    return NextResponse.json({
      data: hotels,
      totalCount: totalCount,
      totalPages: Math.ceil(totalCount / limit)
    });

  } catch (error) {
    console.error('Error fetching hotels:', error);
    return NextResponse.json({ error: 'Error fetching hotels' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    // The service expects numbers for price.
    const formatedRoomTypes = body.roomTypes?.map((rt: any) => ({
      ...rt,
      price: parseFloat(rt.price) || 0,
      pricings: rt.pricings?.map((p: any) => ({
        ...p,
        price: parseFloat(p.price) || 0,
      })) || []
    })) || []

    const hotel = await hotelService.create({
      ...body,
      roomTypes: formatedRoomTypes,
    })
    return NextResponse.json(hotel)
  } catch (error: any) {
    console.error('Error creating hotel:', error)
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Error creating hotel' }, { status: 500 })
  }
}

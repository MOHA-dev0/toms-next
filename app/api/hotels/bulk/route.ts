import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const hotels = await request.json()

    if (!Array.isArray(hotels) || hotels.length === 0) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
    }

    // Process in transaction to ensure consistency
    await prisma.$transaction(async (tx) => {
      for (const hotel of hotels) {
        // Create hotel
        const createdHotel = await tx.hotel.create({
          data: {
            nameAr: hotel.nameAr,
            cityId: hotel.cityId,
          }
        })

        // Create room types
        if (hotel.roomTypes && hotel.roomTypes.length > 0) {
           await tx.roomType.createMany({
             data: hotel.roomTypes.map((rt: any) => ({
               hotelId: createdHotel.id,
               nameAr: rt.nameAr,
               board: rt.board || 'bb',
               basePrice: parseFloat(rt.price) || 0,
               currency: 'USD', // Default currency as per import logic
               imageUrl: rt.imageUrl || ''
             }))
           })
        }
      }
    })

    return NextResponse.json({ message: 'Hotels imported successfully' })
  } catch (error) {
    console.error('Error importing hotels:', error)
    return NextResponse.json({ error: 'Error importing hotels' }, { status: 500 })
  }
}

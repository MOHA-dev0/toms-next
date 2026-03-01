import { NextResponse } from 'next/server'
import { hotelService } from '@/services/hotel.service'

export async function GET() {
  try {
    const hotels = await hotelService.getAll()
    return NextResponse.json(hotels)
  } catch (error) {
    console.error('Error fetching hotels:', error)
    return NextResponse.json({ error: 'Error fetching hotels' }, { status: 500 })
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

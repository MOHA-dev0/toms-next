import { NextRequest, NextResponse } from 'next/server'
import { hotelService } from '@/services/hotel.service'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const formatedRoomTypes = body.roomTypes?.map((rt: any) => ({
      ...rt,
      price: parseFloat(rt.price) || 0,
    })) || []

    const hotel = await hotelService.update(id, {
      ...body,
      roomTypes: formatedRoomTypes,
    })
    return NextResponse.json(hotel)
  } catch (error) {
    console.error('Error updating hotel:', error)
    return NextResponse.json({ error: 'Error updating hotel' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await hotelService.delete(id)
    return NextResponse.json({ message: 'Hotel deleted successfully' })
  } catch (error) {
    console.error('Error deleting hotel:', error)
    return NextResponse.json({ error: 'Error deleting hotel' }, { status: 500 })
  }
}

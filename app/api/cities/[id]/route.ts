import { NextRequest, NextResponse } from 'next/server'
import { cityService } from '@/services/city.service'

// PUT /api/cities/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const city = await cityService.update(id, body)
    return NextResponse.json(city)
  } catch (error) {
    console.error('Error updating city:', error)
    return NextResponse.json({ error: 'Error updating city' }, { status: 500 })
  }
}

// DELETE /api/cities/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await cityService.delete(id)
    return NextResponse.json({ message: 'City deleted successfully' })
  } catch (error) {
    console.error('Error deleting city:', error)
    return NextResponse.json({ error: 'Error deleting city' }, { status: 500 })
  }
}

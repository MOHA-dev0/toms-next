import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const roomType = await prisma.globalRoomType.update({
      where: { id },
      data: {
        nameAr: body.nameAr,
        nameEn: body.nameEn
      }
    })
    return NextResponse.json(roomType)
  } catch (error) {
    console.error('Error updating global room type:', error)
    return NextResponse.json({ error: 'Error updating global room type' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.globalRoomType.delete({
      where: { id },
    })
    return NextResponse.json({ message: 'Room type deleted successfully' })
  } catch (error) {
    console.error('Error deleting global room type:', error)
    return NextResponse.json({ error: 'Error deleting global room type' }, { status: 500 })
  }
}

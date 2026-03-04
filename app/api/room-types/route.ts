import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    const whereClause: any = {};
    if (search) {
      whereClause.OR = [
        { nameAr: { contains: search, mode: 'insensitive' } },
        { nameEn: { contains: search, mode: 'insensitive' } }
      ];
    }

    const roomTypes = await prisma.globalRoomType.findMany({
      where: whereClause,
      orderBy: { nameEn: 'asc' }
    });
    
    return NextResponse.json(roomTypes);
  } catch (error) {
    console.error('Error fetching global room types:', error);
    return NextResponse.json({ error: 'Error fetching global room types' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const roomType = await prisma.globalRoomType.create({
      data: {
        nameAr: body.nameAr,
        nameEn: body.nameEn
      }
    })
    return NextResponse.json(roomType)
  } catch (error) {
    console.error('Error creating global room type:', error)
    return NextResponse.json({ error: 'Error creating global room type' }, { status: 500 })
  }
}

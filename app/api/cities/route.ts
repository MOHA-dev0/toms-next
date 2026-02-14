import { NextRequest, NextResponse } from 'next/server'
import { cityService } from '@/services/city.service'

// GET /api/cities
export async function GET() {
  try {
    const cities = await cityService.getAll()
    return NextResponse.json(cities)
  } catch (error) {
    console.error('Error fetching cities:', error)
    return NextResponse.json({ error: 'Error fetching cities' }, { status: 500 })
  }
}

// POST /api/cities
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const city = await cityService.create(body)
    return NextResponse.json(city)
  } catch (error) {
    console.error('Error creating city:', error)
    return NextResponse.json({ error: 'Error creating city' }, { status: 500 })
  }
}

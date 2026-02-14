import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/services/auth.service'
import { getCurrentUserId, getTokenFromRequest, verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Get token from cookie or header
    const token = getTokenFromRequest(request)
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const user = await authService.getMe(payload.userId)

    return NextResponse.json({ user }, { status: 200 })
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

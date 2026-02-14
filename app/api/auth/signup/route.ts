import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { authService } from '@/services/auth.service'
import { AppRole } from '@prisma/client'

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  initial: z.string().min(1),
  role: z.enum(['admin', 'sales', 'booking'] as const),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, initial, role } = signUpSchema.parse(body)

    const result = await authService.signUp(email, password, name, initial, role as AppRole)

    const response = NextResponse.json(result, { status: 201 })
    
    // Set HTTP-only cookie for security
    response.cookies.set('auth-token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 1 day
    })

    return response
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

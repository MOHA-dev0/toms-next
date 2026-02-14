import { NextRequest } from 'next/server'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'secret')

export interface JWTPayload {
  userId: string
  role: string
  iat?: number
  exp?: number
}

export async function generateToken(userId: string, role: string): Promise<string> {
  return new SignJWT({ userId, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1d')
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as JWTPayload
  } catch {
    return null
  }
}

export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('auth-token')?.value || null
}

export async function getCurrentUserId(): Promise<string | null> {
  const token = await getAuthToken()
  if (!token) return null
  
  const payload = await verifyToken(token)
  return payload?.userId || null
}

export function getTokenFromRequest(request: NextRequest): string | null {
  // Try cookie first
  const cookieToken = request.cookies.get('auth-token')?.value
  if (cookieToken) return cookieToken
  
  // Try Authorization header
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  
  return null
}

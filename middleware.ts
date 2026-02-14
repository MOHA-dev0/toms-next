import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getTokenFromRequest, verifyToken } from './lib/auth'

// Public routes that don't require authentication
const publicRoutes = ['/auth', '/api/auth/login', '/api/auth/signup', '/auth/accept-invite', '/api/auth/accept-invite']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Allow Next.js internal routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  // Check authentication for protected routes
  const token = getTokenFromRequest(request)

  if (!token) {
    return NextResponse.redirect(new URL('/auth', request.url))
  }

  const payload = await verifyToken(token)
  if (!payload) {
    // Invalid token - clear it and redirect to auth
    const response = NextResponse.redirect(new URL('/auth', request.url))
    response.cookies.delete('auth-token')
    return response
  }

  // RBAC Logic
  const role = payload.role as string;
  
  // Admin-only paths
  const adminPaths = [
    '/dashboard/cities', 
    '/dashboard/hotels', 
    '/dashboard/services', 
    '/dashboard/other-services', 
    '/dashboard/companies', 
    '/settings', 
    '/reports',
    '/companies', 
    '/agents', 
    '/dashboard/agents',
    '/employees'
  ];

  if (role !== 'admin' && adminPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Sales-only/Admin paths (restricted for Booking)
  // Example: Payments might be sensitive? 
  // For now, focusing on blocking Admin pages for non-admins as primary goal.

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}

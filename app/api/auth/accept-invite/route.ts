
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { authService } from '@/services/auth.service';

const acceptSchema = z.object({
  token: z.string(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  initial: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, password, initial } = acceptSchema.parse(body);

    const invitation = await prisma.employeeInvitation.findUnique({
      where: { token },
    });

    if (!invitation || invitation.status !== 'pending') {
      return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 400 });
    }

    if (invitation.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invitation expired' }, { status: 400 });
    }

    // Determine initial: user input > invitation data > first letter of name
    const userInitial = initial || invitation.initial || invitation.nameAr.charAt(0);

    const result = await authService.signUp(
      invitation.email,
      password,
      invitation.nameAr,
      userInitial,
      invitation.role
    );

    // Update invitation status
    await prisma.employeeInvitation.update({
      where: { id: invitation.id },
      data: { status: 'accepted' },
    });

    const response = NextResponse.json(result, { status: 200 });
    
    // Set cookie
    response.cookies.set('auth-token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 1 day
    });

    return response;

  } catch (error) {
    if (error instanceof z.ZodError) {
        return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Accept invite error:', error);
    return NextResponse.json({ error: 'Failed to accept invitation' }, { status: 500 });
  }
}

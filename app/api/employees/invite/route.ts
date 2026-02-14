
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { getUserContext } from '@/lib/permissions';
import { AppRole } from '@prisma/client';
import { sendEmail } from '@/lib/email';
import crypto from 'crypto';

const inviteSchema = z.object({
  email: z.string().email(),
  nameAr: z.string().min(1, 'Arabic Name is required'),
  phone: z.string().optional(),
  initial: z.string().optional(),
  role: z.enum(['admin', 'sales', 'booking']),
});

export async function POST(request: Request) {
  try {
    const userContext = await getUserContext();
    if (!userContext || !userContext.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { email, nameAr, phone, initial, role } = inviteSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    // Check if invitation already exists
    const existingInvitation = await prisma.employeeInvitation.findUnique({
      where: { email },
    });

    if (existingInvitation && existingInvitation.status === 'pending') {
      // Allow re-sending invitation? 
      // For strictness, let's just update the token/time or delete old.
      await prisma.employeeInvitation.delete({ where: { email } });
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiration

    await prisma.employeeInvitation.create({
      data: {
        email,
        nameAr,
        phone,
        initial,
        role: role as AppRole,
        token,
        expiresAt,
      },
    });

    // Send email
    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/accept-invite?token=${token}`;
    
    await sendEmail({
      to: email,
      subject: 'You have been invited to join TOMS System',
      text: `Hello ${nameAr},\n\nYou have been invited to join the TOMS System as a ${role}.\n\nPlease click the following link to set your password and activate your account:\n${inviteLink}\n\nThis link will expire in 24 hours.`,
      html: `<p>Hello ${nameAr},</p><p>You have been invited to join the TOMS System as a <strong>${role}</strong>.</p><p><a href="${inviteLink}">Click here to accept the invitation</a> and set your password.</p><p>This link will expire in 24 hours.</p>`
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Invite error:', error);
    return NextResponse.json({ error: 'Failed to invite employee' }, { status: 500 });
  }
}

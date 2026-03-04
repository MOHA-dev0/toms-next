
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserContext } from '@/lib/permissions';

export async function GET() {
  try {
    const userContext = await getUserContext();
    if (!userContext || !userContext.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const invitations = await prisma.employeeInvitation.findMany({
      select: {
        id: true,
        email: true,
        nameAr: true,
        role: true,
        status: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(invitations);
  } catch (error) {
    console.error('Fetch invitations error:', error);
    return NextResponse.json({ error: 'Failed to fetch invitations' }, { status: 500 });
  }
}

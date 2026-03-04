
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserContext } from '@/lib/permissions';

export async function GET() {
  try {
    const userContext = await getUserContext();
    if (!userContext || !userContext.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const [employees, invitations] = await prisma.$transaction([
      prisma.employee.findMany({
        select: {
          id: true,
          nameAr: true,
          email: true,
          phone: true,
          initial: true,
          isActive: true,
          user: {
            select: {
              userRoles: {
                select: {
                  role: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.employeeInvitation.findMany({
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
      })
    ]);

    return NextResponse.json({ employees, invitations });
  } catch (error) {
    console.error('Fetch employees and invitations error:', error);
    return NextResponse.json({ error: 'Failed to fetch employees data' }, { status: 500 });
  }
}

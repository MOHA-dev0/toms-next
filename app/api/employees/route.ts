
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserContext } from '@/lib/permissions';

export async function GET() {
  try {
    const userContext = await getUserContext();
    if (!userContext || !userContext.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const employees = await prisma.employee.findMany({
      include: {
        user: {
          include: {
            userRoles: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(employees);
  } catch (error) {
    console.error('Fetch employees error:', error);
    return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 });
  }
}

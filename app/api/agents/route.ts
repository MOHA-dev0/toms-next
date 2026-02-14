
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { getUserContext } from '@/lib/permissions';

const agentSchema = z.object({
  nameEn: z.string().min(1, 'Agency Name (English) is required'),
  logoUrl: z.string().optional(),
});

export async function GET() {
  try {
    const userContext = await getUserContext();
    if (!userContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const agents = await prisma.agent.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(agents);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userContext = await getUserContext();
    if (!userContext || !userContext.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = agentSchema.parse(body);

    const agent = await prisma.agent.create({
      data: {
        nameEn: validatedData.nameEn,
        logoUrl: validatedData.logoUrl,
      },
    });

    return NextResponse.json(agent);
  } catch (error) {
    if (error instanceof z.ZodError) {
        return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create agent' }, { status: 500 });
  }
}

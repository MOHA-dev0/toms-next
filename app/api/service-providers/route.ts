import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const serviceProviderSchema = z.object({
  name: z.string().min(1, 'Name is required'),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    const whereClause: any = {};
    if (search) {
      whereClause.name = { contains: search, mode: 'insensitive' };
    }

    const providers = await prisma.serviceProvider.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(providers);
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching service providers' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = serviceProviderSchema.parse(body);

    const provider = await prisma.serviceProvider.create({
      data: {
        name: validatedData.name,
      },
      select: { id: true, name: true }
    });

    return NextResponse.json(provider);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Error creating service provider:', error);
    return NextResponse.json({ error: 'Error creating service provider' }, { status: 500 });
  }
}

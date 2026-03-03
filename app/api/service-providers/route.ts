import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const serviceProviderSchema = z.object({
  name: z.string().min(1, 'Name is required'),
});

export async function GET() {
  try {
    const providers = await prisma.serviceProvider.findMany({
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

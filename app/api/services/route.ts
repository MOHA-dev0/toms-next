
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Schema for validation
const serviceSchema = z.object({
  nameAr: z.string().min(1, 'Name (Arabic) is required'),
  nameEn: z.string().optional(),
  cityId: z.string().min(1, 'City is required'),
  purchasePrice: z.number().min(0).default(0),
  sellingPrice: z.number().min(0).default(0), // Optional or default
  currency: z.enum(['USD', 'EUR', 'TRY', 'SAR', 'AED', 'GBP']).default('USD'),
  descriptionAr: z.string().optional(),
});

export async function GET() {
  try {
    const services = await prisma.service.findMany({
      include: {
        city: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(services);
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching services' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = serviceSchema.parse(body);

    const service = await prisma.service.create({
      data: {
        nameAr: validatedData.nameAr,
        nameEn: validatedData.nameEn,
        cityId: validatedData.cityId,
        purchasePrice: validatedData.purchasePrice,
        sellingPrice: validatedData.sellingPrice,
        currency: validatedData.currency,
        descriptionAr: validatedData.descriptionAr,
      },
    });

    return NextResponse.json(service);
  } catch (error) {
    if (error instanceof z.ZodError) {
        return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error creating service' }, { status: 500 });
  }
}

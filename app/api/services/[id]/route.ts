
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const serviceSchema = z.object({
  nameAr: z.string().min(1, 'Name (Arabic) is required'),
  nameEn: z.string().optional(),
  cityId: z.string().min(1, 'City is required'),
  purchasePrice: z.number().min(0).default(0),
  currency: z.enum(['USD', 'EUR', 'TRY', 'SAR', 'AED', 'GBP']).default('USD'),
  descriptionAr: z.string().optional(),
  descriptionEn: z.string().optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = serviceSchema.parse(body);

    const service = await prisma.service.update({
      where: { id },
      data: {
        nameAr: validatedData.nameAr,
        nameEn: validatedData.nameEn,
        cityId: validatedData.cityId,
        purchasePrice: validatedData.purchasePrice,
        currency: validatedData.currency,
        descriptionAr: validatedData.descriptionAr,
        descriptionEn: validatedData.descriptionEn,
      },
    });

    return NextResponse.json(service);
  } catch (error) {
    return NextResponse.json({ error: 'Error updating service' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.service.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Service deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Error deleting service' }, { status: 500 });
  }
}

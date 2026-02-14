
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const otherServiceSchema = z.object({
  nameAr: z.string().min(1, 'الاسم العربي مطلوب'),
  nameEn: z.string().optional(),
  descriptionAr: z.string().optional(),
  purchasePrice: z.number().min(0).default(0),
  sellingPrice: z.number().min(0).default(0),
  currency: z.enum(['USD', 'EUR', 'TRY', 'SAR', 'AED', 'GBP']).default('USD'),
});

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = otherServiceSchema.parse(body);

    const service = await prisma.otherService.update({
      where: { id: params.id },
      data: {
        nameAr: validatedData.nameAr,
        nameEn: validatedData.nameEn,
        descriptionAr: validatedData.descriptionAr,
        purchasePrice: validatedData.purchasePrice,
        sellingPrice: validatedData.sellingPrice,
        currency: validatedData.currency,
      },
    });

    return NextResponse.json(service);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error updating service' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.otherService.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Service deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error deleting service' },
      { status: 500 }
    );
  }
}

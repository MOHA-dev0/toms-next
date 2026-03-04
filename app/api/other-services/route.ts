
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

export async function GET() {
  try {
    const services = await prisma.otherService.findMany({
      select: {
        id: true,
        nameAr: true,
        nameEn: true,
        descriptionAr: true,
        purchasePrice: true,
        sellingPrice: true,
        currency: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(services);
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب الخدمات الأخرى' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = otherServiceSchema.parse(body);

    const service = await prisma.otherService.create({
      data: {
        nameAr: validatedData.nameAr,
        nameEn: validatedData.nameEn,
        descriptionAr: validatedData.descriptionAr,
        purchasePrice: validatedData.purchasePrice,
        sellingPrice: validatedData.sellingPrice,
        currency: validatedData.currency,
      },
      select: { id: true, nameAr: true }
    });

    return NextResponse.json(service);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'حدث خطأ أثناء إنشاء الخدمة' }, { status: 500 });
  }
}

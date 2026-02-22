
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const companySchema = z.object({
  name_en: z.string().min(1, 'Company Name is required'),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = companySchema.parse(body);

    const company = await prisma.company.update({
      where: { id },
      data: {
        nameEn: validatedData.name_en,
      },
    });

    return NextResponse.json(company);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update company' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.company.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete company' }, { status: 500 });
  }
}

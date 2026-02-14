
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const companySchema = z.object({
  name_en: z.string().min(1, 'Company Name is required'),
});

export async function GET() {
  try {
    const companies = await prisma.company.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(companies);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = companySchema.parse(body);

    const company = await prisma.company.create({
      data: {
        nameEn: validatedData.name_en,
      },
    });

    return NextResponse.json(company);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create company' }, { status: 500 });
  }
}

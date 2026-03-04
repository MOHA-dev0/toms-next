import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const serviceProviderSchema = z.object({
  name: z.string().min(1, 'Name is required'),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = serviceProviderSchema.parse(body);

    const provider = await prisma.serviceProvider.update({
      where: { id },
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
    console.error('Error updating service provider:', error);
    return NextResponse.json({ error: 'Error updating service provider' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.serviceProvider.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Service provider deleted successfully' });
  } catch (error) {
    console.error('Error deleting service provider:', error);
    return NextResponse.json({ error: 'Error deleting service provider' }, { status: 500 });
  }
}

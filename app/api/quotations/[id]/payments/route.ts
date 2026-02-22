import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserContext } from '@/lib/permissions';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userContext = await getUserContext();
    if (!userContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { amount, paymentMethod, referenceNumber, receiverName } = body;

    const quotation = await prisma.quotation.findUnique({
      where: { id },
    });

    if (!quotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    const paymentAmount = Number(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const currentPaid = Number(quotation.paidAmount || 0);
    const newPaidAmount = currentPaid + paymentAmount;

    // Use a transaction to create the payment and update the quotation
    const [payment, updatedQuotation] = await prisma.$transaction([
      prisma.payment.create({
        data: {
          quotationId: id,
          customerId: quotation.customerId,
          amount: paymentAmount,
          paymentMethod,
          referenceNumber,
          receiverName,
          createdBy: userContext.employeeId,
        },
      }),
      prisma.quotation.update({
        where: { id },
        data: {
          paidAmount: newPaidAmount,
          status: 'confirmed', // Automatically set status to 'confirmed' (مؤكد)
        },
      }),
    ]);

    return NextResponse.json({ payment, quotation: updatedQuotation });
  } catch (error) {
    console.error('Error adding payment:', error);
    return NextResponse.json({ error: 'Failed to add payment' }, { status: 500 });
  }
}

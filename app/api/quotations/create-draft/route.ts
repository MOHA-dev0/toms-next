
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createDraftQuotationSchema, formatZodErrors } from '@/lib/validations/quotation';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // ── Step 1: Backend Validation (NEVER trust the frontend) ──
    const parsed = createDraftQuotationSchema.safeParse({
      channel: body.channel,
      agency: body.agency,
      sales: body.sales,
      company: body.company,
      destinationCityIds: body.destinationCityIds ?? [],
      startDate: body.startDate,
      nights: body.nights,
      adults: body.adults,
      children: body.children,
      infants: body.infants,
      passengers: body.passengers,
      notes: body.notes,
      customerId: body.customerId,
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'فشل التحقق من البيانات (Validation failed)',
          validationErrors: formatZodErrors(parsed.error),
        },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // ── Transaction: Generate IDs + Create Draft ──
    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Generate Quotation Number
      await tx.$executeRaw`
        INSERT INTO system_sequences (\`key\`, last_seq, prefix, updated_at) 
        VALUES ('quotation_draft', 1, 'D', NOW()) 
        ON DUPLICATE KEY UPDATE last_seq = last_seq + 1, updated_at = NOW();
      `;

      const quotationSeqRes = await tx.$queryRaw`SELECT last_seq FROM system_sequences WHERE \`key\` = 'quotation_draft'`;
      const quotationSeq = Number((quotationSeqRes as any)[0].last_seq);
      const quotationNumber = `D-${String(quotationSeq).padStart(4, '0')}`;

      // 2. Resolve or Create Customer
      let customerId = data.customerId;

      if (!customerId) {
        const leadPassengerName =
          data.passengers[0]?.name?.trim() || 'Unknown Client';

        const newCustomer = await tx.customer.create({
          data: {
            nameAr: leadPassengerName,
            phone: '000000000',
            email: null,
          },
        });
        customerId = newCustomer.id;
      }

      // 3. Resolve Sales Employee
      let salesEmployeeId = data.sales;
      if (!salesEmployeeId) {
        const firstEmployee = await tx.employee.findFirst({
          where: { isActive: true },
        });
        if (firstEmployee) {
          salesEmployeeId = firstEmployee.id;
        } else {
          throw new Error('No active sales employee found to assign quotation.');
        }
      }

      // 4. Compute start/end dates (timezone-safe)
      const startDateStr = String(data.startDate);
      const startMatch = startDateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
      let startDate: Date;
      if (startMatch) {
        const [, y, m, d] = startMatch;
        startDate = new Date(Date.UTC(parseInt(y), parseInt(m) - 1, parseInt(d), 12, 0, 0));
      } else {
        startDate = new Date(data.startDate);
      }
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + data.nights);

      // 5. Resolve destination city IDs (filtering valid UUIDs)
      const validDestinationIds = data.destinationCityIds.filter(
        (id: string) => id && id.length === 36
      );

      // 6. Create the Quotation
      const quotation = await tx.quotation.create({
        data: {
          referenceNumber: quotationNumber,
          customerId: customerId,
          salesEmployeeId: salesEmployeeId,
          agentId: data.agency || null,
          companyId: data.company || null,
          source: data.channel === 'b2b' ? 'b2b' : 'b2c',
          destinationCityId: validDestinationIds[0] || null, // Keep for backward compatibility
          cities_quotationdestinations: {
            connect: validDestinationIds.map((id: string) => ({ id })),
          },
          notes: data.notes || null,
          adults: data.adults || 1,
          children: data.children || 0,
          infants: data.infants || 0,
          status: 'draft',
          startDate,
          endDate,
          passengers: {
            create: data.passengers.map((p, index) => ({
              name: p.name || '',
              type: p.type || 'adult',
              createdAt: new Date(Date.now() + index * 1000),
            })),
          },
        } as any,
      });

      return {
        quotationNumber,
        quotationId: quotation.id,
      };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error creating quotation draft:', error);
    return NextResponse.json(
      {
        error: 'Failed to create quotation draft',
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}

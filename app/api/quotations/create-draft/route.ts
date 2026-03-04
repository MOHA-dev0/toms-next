
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
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
    // Setting isolation level to Serializable or using standard transaction logic for safe sequence increments
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Generate Quotation Number
      const seq = await tx.systemSequence.upsert({
        where: { key: 'quotation_draft' },
        update: {
          lastSeq: { increment: 1 },
        },
        create: {
          key: 'quotation_draft',
          lastSeq: 1,
          prefix: 'D',
        },
      });

      const quotationSeq = seq.lastSeq;
      const quotationNumber = `D-${String(quotationSeq).padStart(4, '0')}`;

      // 2. Resolve or Create Customer
      let customerId = data.customerId;

      if (!customerId) {
        // If no passengers provided or first passenger has no name, use fallback
        const passengersArray = data.passengers as Array<{ name?: string }>;
        const leadPassengerName = passengersArray?.[0]?.name?.trim() || 'Unknown Client';

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

      // 5. Resolve destination city IDs (filtering valid UUIDs using strict regex)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const destinationCityIdsArray = data.destinationCityIds as string[];
      const validDestinationIds = destinationCityIdsArray.filter(
        (id: string) => id && uuidRegex.test(id)
      );

      // Map passengers payload accurately to satisfy Prisma types
      const passengersArray = data.passengers as Array<{ name?: string, type?: string, age?: number | null }>;
      const passengersData = passengersArray.map((p, index) => ({
        name: p.name || '',
        type: p.type || 'adult',
        age: p.age ?? null,
        createdAt: new Date(Date.now() + index * 1000),
      }));

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
          cities_quotationdestinations: validDestinationIds.length > 0 ? {
            connect: validDestinationIds.map((id: string) => ({ id })),
          } : undefined,
          notes: data.notes || null,
          adults: data.adults || 1,
          children: data.children || 0,
          infants: data.infants || 0,
          status: 'draft',
          startDate,
          endDate,
          passengers: {
            create: passengersData,
          },
        },
      });

      return {
        quotationNumber,
        quotationId: quotation.id,
      };
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 5000, // 5 seconds max wait to connect to prisma
      timeout: 10000, // 10 seconds max timeout for the query to finish
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('Error creating quotation draft:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    
    return NextResponse.json(
      {
        error: 'Failed to create quotation draft',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

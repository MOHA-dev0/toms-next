
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      channel, 
      agency, 
      sales, 
      ref, 
      company, 
      destination, 
      paxCount, 
      passengers,
      adults,
      children,
      infants
    } = body;

    // Use a transaction to ensure unique numbers and atomic creation
    // Cast to any because Prisma Client types may be outdated due to locked 'prisma generate' process
    const result = await prisma.$transaction(async (tx: any) => {
      


      // 2. Generate Quotation Number
      await tx.$executeRaw`
        INSERT INTO system_sequences (\`key\`, last_seq, prefix, updated_at) 
        VALUES ('quotation_draft', 1, 'D', NOW()) 
        ON DUPLICATE KEY UPDATE last_seq = last_seq + 1, updated_at = NOW();
      `;

      const quotationSeqRes = await tx.$queryRaw`SELECT last_seq FROM system_sequences WHERE \`key\` = 'quotation_draft'`;
      const quotationSeq = Number((quotationSeqRes as any)[0].last_seq);
      const quotationNumber = `D-${String(quotationSeq).padStart(4, '0')}`;

      // 3. Create Draft Quotation FIRST
      
      // Map UI fields to DB fields
      let customerId = body.customerId;

      if (!customerId) {
        const leadPassenger = (passengers && passengers.length > 0 && passengers[0]?.name) 
          ? passengers[0].name 
          : 'Unknown Client';
        
        const newCustomer = await tx.customer.create({
          data: {
            nameAr: leadPassenger,
            phone: '000000000', // Placeholder
            email: null,
          }
        });
        customerId = newCustomer.id;
      }

      // Ensure salesEmployeeId is present (Required by DB)
      let salesEmployeeId = sales;
      if (!salesEmployeeId) {
          // Fallback: Get first active employee
          const firstEmployee = await tx.employee.findFirst({ where: { isActive: true } });
          if (firstEmployee) {
              salesEmployeeId = firstEmployee.id;
          } else {
              throw new Error("No active sales employee found to assign quotation.");
          }
      }
      
      // Create Quotation
      const quotation = await tx.quotation.create({
        data: {
          referenceNumber: quotationNumber,
          customerId: customerId,
          salesEmployeeId: salesEmployeeId,
          agentId: agency,
          source: channel === 'b2b' ? 'b2b' : 'b2c',
          // Fix: destination can be free text now. Only link foreign key if it looks like a valid UUID.
          // Otherwise, we might need a separate 'destinationText' field or just omit relation.
          // For now: omit relation if free text.
          destinationCityId: (destination && destination.length === 36) ? destination : null,
          // Store free text destination in notes if not a valid ID? 
          notes: (destination && destination.length !== 36) ? `Destination: ${destination}` : null,
          adults: adults || paxCount,
          children: children || 0,
          infants: infants || 0,
          status: 'draft',
          startDate: new Date(), 
          endDate: new Date(),
          // Use 'create: ...' for relation if client updated, else manual via separate call?
          // We will use relation create here assuming client update eventually.
          passengers: {
            create: passengers.map((p: any, index: number) => ({
              name: p.name || '',
              type: p.type || 'adult',
              createdAt: new Date(Date.now() + index * 1000)
            }))
          }
        } as any // Cast to any to bypass type check on 'passengers'
      });

      return {
        quotationNumber,
        quotationId: quotation.id
      };
    });

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Error creating quotation draft:', error);
    return NextResponse.json({ 
        error: 'Failed to create quotation draft',
        details: error?.message || String(error),
        stack: error?.stack 
    }, { status: 500 });
  }
}


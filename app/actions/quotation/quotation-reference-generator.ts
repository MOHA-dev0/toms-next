import { prisma } from "@/lib/prisma";

export async function generateQuotationReference(initial: string, currentYear: string): Promise<string> {
  let isUnique = false;
  let finalReferenceNumber = "";
  
  while (!isUnique) {
    const randomNum = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    finalReferenceNumber = `${initial}-${currentYear}-${randomNum}`;
    const exists = await prisma.quotation.findUnique({ where: { referenceNumber: finalReferenceNumber } });
    if (!exists) {
      isUnique = true;
    }
  }
  
  return finalReferenceNumber;
}

import { NextRequest, NextResponse } from "next/server";
import { getUserContext } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserContext();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        quotation: true,
      },
    });

    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    // Validate if update is actually required
    if (!booking.invoiceNeedsUpdate) return NextResponse.json({ error: "No update required for this invoice" }, { status: 400 });

    // We fetch the latest quotation generation (which created new structural references)
    // First, let's grab the related confirmed quotation again to ensure we have the most up to date structural data.
    const quotationId = booking.quotationId;

    // Archive previous vouchers instead of deleting them to prevent breaking foreign keys,
    // Or we delete them directly based on business rule (here we delete old, replace with new)
    await prisma.$transaction(async (tx) => {
      // 1. Delete old vouchers for this booking
      await tx.voucher.deleteMany({
        where: { bookingId: id },
      });

      // 2. Fetch fresh quotation data for generation
      const freshQ = await tx.quotation.findUnique({
        where: { id: quotationId },
        include: {
          customer: true,
          quotationHotels: { include: { hotel: true, roomType: true } },
          quotationFlights: true,
          quotationCars: true,
          quotationServices: { include: { service: { include: { city: true } } } },
          passengers: true,
        },
      });

      if (!freshQ) throw new Error("Quotation data missing");

      // Shared passenger logic
      const paxDetails = freshQ.passengers.length > 0
        ? freshQ.passengers.map(p => p.name).join(', ')
        : (freshQ.customer?.nameAr || 'Guest');
        
      const paxNameTr = typeof paxDetails === 'string' ? paxDetails : paxDetails[0] || 'Guest';

      // 3. Generate New Hotel Vouchers
      for (const h of freshQ.quotationHotels) {
        await tx.voucher.create({
          data: {
            bookingId: booking.id,
            voucherType: "hotel",
            ...generateVoucherSequenceData(), // Utility func to be placed or you do string manip here
            hotelId: h.hotelId,
            guestNameAr: paxDetails.substring(0, 100),
            guestNameTr: paxNameTr.substring(0, 100),
            checkIn: h.checkIn,
            checkOut: h.checkOut,
            roomTypeAr: h.roomType?.nameAr || "",
            roomTypeTr: h.roomType?.nameTr || "",
            boardAr: ["ro", "bb", "hb", "fb", "ai"].includes(h.board?.toLowerCase() || "") 
              ? h.board.toUpperCase() : h.board,
            boardTr: ["ro", "bb", "hb", "fb", "ai"].includes(h.board?.toLowerCase() || "") 
              ? h.board.toUpperCase() : h.board,
            createdBy: user.employeeId,
            notesAr: h.notes || null,
          },
        });
      }

      // 4. Generate Transportation Voucher
      if (freshQ.quotationCars && freshQ.quotationCars.length > 0) {
        let details = "Cars:\n" + freshQ.quotationCars.map(c => `- ${c.description} (${c.days} days)`).join("\n");
        await tx.voucher.create({
          data: {
            bookingId: booking.id,
            voucherType: "transportation",
            ...generateVoucherSequenceData(),
            guestNameAr: paxDetails.substring(0, 100),
            guestNameTr: paxNameTr.substring(0, 100),
            notesAr: details,
            createdBy: user.employeeId,
          },
        });
      }

      // 5. Generate Other Services Voucher
      if (freshQ.quotationServices && freshQ.quotationServices.length > 0) {
        const formatServiceLine = (s: any): string => {
          const nameEn = s.service?.nameEn || s.nameAr || s.service?.nameAr || 'Service';
          const nameAr = s.nameAr || s.service?.nameAr || 'Service';
          const cityEn = s.service?.city?.nameTr || '-';
          const cityAr = s.service?.city?.nameAr || '-';
          const dateStr = s.serviceDate ? new Date(s.serviceDate).toLocaleDateString('en-GB') : ''; // e.g., dd/mm/yyyy

          // We need format like: • Service Name (City) — Date
          // The frontend uses regex that extracts (City) and uses — for date.
          return `• ${nameEn} (${cityEn})${dateStr ? ` — ${dateStr.replace(/\//g, '-')}` : ''}`;
        };

        const formatServiceLineAr = (s: any): string => {
          const nameAr = s.nameAr || s.service?.nameAr || 'Service';
          const cityAr = s.service?.city?.nameAr || '-';
          const dateStr = s.serviceDate ? new Date(s.serviceDate).toLocaleDateString('en-GB') : ''; 
          return `• ${nameAr} (${cityAr})${dateStr ? ` — ${dateStr.replace(/\//g, '-')}` : ''}`;
        };

        const linesEn = freshQ.quotationServices.map(formatServiceLine).join("\n");
        const linesAr = freshQ.quotationServices.map(formatServiceLineAr).join("\n");
        
        await tx.voucher.create({
          data: {
            bookingId: booking.id,
            voucherType: "other",
            ...generateVoucherSequenceData(),
            guestNameAr: paxDetails.substring(0, 100),
            guestNameTr: paxNameTr.substring(0, 100),
            notesAr: linesAr,
            notesTr: linesEn,
            createdBy: user.employeeId,
          },
        });
      }

      // 6. Finalize: Set the flag back to false
      await tx.booking.update({
        where: { id },
        data: { invoiceNeedsUpdate: false },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Regenerate Invoice Error:", error);
    return NextResponse.json({ error: error.message || "Failed to regenerate invoice" }, { status: 500 });
  }
}

// Inline generation for voucher sequences (in a larger refactor, put in a shared service string)
function generateVoucherSequenceData() {
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
  const timestamp = Date.now().toString().slice(-4);
  return { voucherCode: `VOU-${timestamp}-${randomStr}` }; // Must be unique globally in the DB
}

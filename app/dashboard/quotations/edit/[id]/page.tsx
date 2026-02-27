"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuotationStore } from "@/lib/store/quotationStore";
import QuotationWizard from "@/components/quotations/wizard/QuotationWizard";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function EditQuotationPage() {
  const params = useParams() as { id: string };
  const id = params?.id;
  const router = useRouter();
  const setFullState = useQuotationStore((state) => state.setFullState);
  const reset = useQuotationStore((state) => state.reset);
  const [loading, setLoading] = useState(true);
  const [quotationStatus, setQuotationStatus] = useState<string>("");

  useEffect(() => {
    async function loadQuotation() {
      try {
        const res = await fetch(`/api/quotations/${id}`);
        if (!res.ok) throw new Error("Failed to fetch quotation");
        const data = await res.json();

        setQuotationStatus(data.status);

        // Helper: safely parse date strings without timezone shifting
        // Extracts YYYY-MM-DD and creates at noon UTC to avoid drift
        function toSafeDate(value: any): Date | undefined {
          if (!value) return undefined;
          const str = String(value);
          const dateMatch = str.match(/(\d{4})-(\d{2})-(\d{2})/);
          if (dateMatch) {
            const [, year, month, day] = dateMatch;
            return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0);
          }
          return new Date(str);
        }

        const parsedStartDate = toSafeDate(data.startDate);
        const parsedEndDate = toSafeDate(data.endDate);

        // Map backend data to local store structure
        setFullState({
          basicInfo: {
            channel: data.source as "b2c" | "b2b",
            agencyId: data.agentId || undefined,
            salesPersonId: data.salesEmployeeId || undefined,
            referenceNumber: data.referenceNumber,
            quotationId: data.id,
            companyId: data.companyId || undefined,
            destinationCityIds: data.destinations?.length > 0 
              ? data.destinations.map((d: any) => d.id) 
              : (data.destinationCityId ? [data.destinationCityId] : []),
            startDate: parsedStartDate,
            endDate: parsedEndDate,
            nights: parsedStartDate && parsedEndDate ? Math.ceil((parsedEndDate.getTime() - parsedStartDate.getTime()) / (1000 * 60 * 60 * 24)) : 0,
            adults: data.adults || 1,
            children: data.children || 0,
            infants: data.infants || 0,
            notes: data.notes || undefined,
            passengers:
              data.passengers?.map((p: any) => ({
                id: p.id,
                name: p.name && p.name.toLowerCase() !== 'unknown' ? p.name : '',
                type: p.type,
              })) || [],
          },
          hotelSegments:
            data.quotationHotels?.map((h: any) => ({
              id: h.id,
              checkIn: toSafeDate(h.checkIn) || new Date(),
              checkOut: toSafeDate(h.checkOut) || new Date(),
              cityId: h.hotel?.cityId || "",
              hotelId: h.hotelId,
              roomTypeId: h.roomTypeId,
              boardType: h.board || "bb",
              roomsCount: h.roomsCount || 1,
              usage: h.usage || "dbl",
              purchasePrice: Number(h.purchasePrice) || 0,
              sellingPrice: Number(h.sellingPrice) || 0, // Always USD (frozen)
              currency: "USD",
              // Audit trail for display only (ConversionInfoBadge)
              originalPrice: h.originalPrice ? Number(h.originalPrice) : undefined,
              originalCurrency: h.originalCurrency || undefined,
              exchangeRate: h.exchangeRate ? Number(h.exchangeRate) : undefined,
              notes: h.notes || "",
              isVoucherVisible: true,
            })) || [],
          itineraryServices:
            data.quotationServices
              ?.filter((s: any) => s.serviceId) // Services with linked service master
              .map((s: any) => {
                const sDate = toSafeDate(s.serviceDate) || new Date();
                const qStart = parsedStartDate || sDate;
                const dNum = Math.max(1, Math.floor((sDate.getTime() - qStart.getTime()) / (1000 * 60 * 60 * 24)) + 1);
                
                return {
                  id: s.id,
                  dayNumber: dNum,
                  date: sDate,
                  serviceId: s.serviceId,
                  name: s.nameAr || "",
                  quantity: s.quantity || 1,
                  purchasePrice: Number(s.purchasePrice) || 0,
                  sellingPrice: Number(s.sellingPrice) || 0,
                  currency: "USD",
                  notes: s.descriptionAr || "",
                };
              }) || [],
          otherServices:
            data.quotationServices
              ?.filter((s: any) => !s.serviceId && s.nameAr && s.nameAr !== 'بدون اسم') // Services without linked master (custom) that are not empty placeholders
              .map((s: any) => {
                const sDate = toSafeDate(s.serviceDate) || new Date();
                const qStart = parsedStartDate || sDate;
                const dNum = Math.max(1, Math.floor((sDate.getTime() - qStart.getTime()) / (1000 * 60 * 60 * 24)) + 1);
                
                return {
                  id: s.id,
                  dayNumber: dNum,
                  date: sDate,
                  serviceId: "",
                  name: s.nameAr || "",
                  quantity: s.quantity || 1,
                  purchasePrice: Number(s.purchasePrice) || 0,
                  sellingPrice: Number(s.sellingPrice) || 0,
                  currency: "USD",
                  notes: s.descriptionAr || "",
                };
              }) || [],
          isFlightsEnabled: data.quotationFlights && data.quotationFlights.length > 0,
          flights:
            data.quotationFlights?.map((f: any) => ({
              id: f.id,
              date: toSafeDate(f.departureDate) || new Date(),
              description: f.flightNumber || "",
              type: "international",
              paxCount: f.passengers || 1,
              price: Number(f.sellingPrice) || 0,
              currency: "USD",
            })) || [],
          isCarsEnabled: data.quotationCars && data.quotationCars.length > 0,
          carRentals:
            data.quotationCars?.map((c: any) => ({
              id: c.id,
              pickupDate: toSafeDate(c.pickupDate) || new Date(),
              dropoffDate: toSafeDate(c.dropoffDate) || new Date(),
              days: c.days || 1,
              description: c.carTypeAr || "",
              price: Number(c.sellingPrice) || 0,
              currency: "USD",
            })) || [],
          financials: {
            marginType: "fixed",
            marginValue: Number(data.profit) || 0,
            commissionType: "fixed",
            commissionValue: Number(data.commissionAmount) || 0,
            currency: "USD",
          },
        });

      } catch (error) {
        console.error("Error loading quotation:", error);
        toast.error("حدث خطأ أثناء تحميل بيانات العرض");
        router.push("/dashboard/quotations");
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadQuotation();
    }
  }, [id, router, setFullState]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">جاري تحميل بيانات العرض...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Optional: Add a subtle overlay warning if it's confirmed here or keep it simple */}
      {quotationStatus === 'confirmed' && (
        <div className="max-w-7xl mx-auto mt-4 p-4 bg-orange-50 border border-orange-200 text-orange-800 rounded-lg text-right" dir="rtl">
          <strong>تنبيه:</strong> هذا العرض مؤكد بالفعل. أي تعديلات سيتم حفظها على العرض الحالي.
        </div>
      )}
      <QuotationWizard isEditMode={true} existingStatus={quotationStatus} />
    </div>
  );
}

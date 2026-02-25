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

        // Map backend data to local store structure
        setFullState({
          basicInfo: {
            channel: data.source as "b2c" | "b2b",
            agencyId: data.agentId || undefined,
            salesPersonId: data.salesEmployeeId || undefined,
            referenceNumber: data.referenceNumber,
            quotationId: data.id,
            companyId: undefined, // Not typically fetched directly in quotation details response unless joined
            destinationCityIds: data.destinationCityId ? [data.destinationCityId] : [],
            startDate: data.startDate ? new Date(data.startDate) : undefined,
            endDate: data.endDate ? new Date(data.endDate) : undefined,
            nights: data.startDate && data.endDate ? Math.ceil((new Date(data.endDate).getTime() - new Date(data.startDate).getTime()) / (1000 * 60 * 60 * 24)) : 0,
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
              checkIn: new Date(h.checkIn),
              checkOut: new Date(h.checkOut),
              cityId: h.hotel?.cityId || "",
              hotelId: h.hotelId,
              roomTypeId: h.roomTypeId,
              boardType: h.board || "bb",
              roomsCount: h.roomsCount || 1,
              usage: h.usage || "dbl",
              purchasePrice: Number(h.purchasePrice) || 0,
              sellingPrice: Number(h.sellingPrice) || 0,
              currency: "USD",
              notes: h.notes || "",
              isVoucherVisible: true,
            })) || [],
          itineraryServices:
            data.quotationServices
              ?.filter((s: any) => s.serviceId) // Services with linked service master
              .map((s: any) => {
                const sDate = s.serviceDate ? new Date(s.serviceDate) : new Date();
                const qStart = data.startDate ? new Date(data.startDate) : sDate;
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
                const sDate = s.serviceDate ? new Date(s.serviceDate) : new Date();
                const qStart = data.startDate ? new Date(data.startDate) : sDate;
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
              date: new Date(f.departureDate || new Date()),
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
              pickupDate: new Date(c.pickupDate || new Date()),
              dropoffDate: new Date(c.dropoffDate || new Date()),
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

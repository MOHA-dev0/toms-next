"use client";

import { useQuotationStore } from "@/lib/store/quotationStore";
import { useState } from "react";
import StepBasicInfo from "./steps/StepBasicInfo";
import StepHotels from "./steps/StepHotels";
import StepServices from "./steps/StepServices";
import StepOtherServices from "./steps/StepOtherServices";
import StepFlightsCars from "./steps/StepFlightsCars"; // Imported Step 5
import StepFinancials from "./steps/StepFinancials"; // Imported Step 6

import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { finalizeQuotation } from "@/app/actions/quotation-actions";
import { calculateQuotationTotals } from "@/lib/pricing-engine";

export default function QuotationWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const state = useQuotationStore();
  const { basicInfo, setBasicInfo, reset } = state;

  const handleNext = async () => {
    if (currentStep === 1) {
      // Validate Step 1
      setIsSubmitting(true);
      try {
        const response = await fetch('/api/quotations/create-draft', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                channel: basicInfo.channel,
                agency: basicInfo.agencyId,
                sales: basicInfo.salesPersonId,
                ref: basicInfo.referenceNumber,
                company: basicInfo.companyId,
                destination: basicInfo.destinationCityIds?.[0], 
                paxCount: basicInfo.adults, 
                adults: basicInfo.adults,
                children: basicInfo.children,
                infants: basicInfo.infants,
                passengers: basicInfo.passengers.map(p => ({
                    name: p.name,
                    type: p.type
                }))
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            console.error("Server Error Details:", data);
            throw new Error(data.details || data.error || "Failed to create draft");
        }
        
        // Save the generated IDs to our store for future updates in the wizard
        setBasicInfo({ 
          quotationId: data.quotationId, 
          referenceNumber: data.quotationNumber 
        });

        toast.success(`تم إنشاء الحجز بنجاح: ${data.bookingNumber}`);
        
        setCurrentStep(2);
      } catch (error: any) {
        console.error("API Error:", error);
        toast.error(`حدث خطأ: ${error.message || "Error Creating Quotation"}`);
      } finally {
        setIsSubmitting(false);
      }
    } else if (currentStep === 6) {
        setIsSubmitting(true);
        try {
          if (basicInfo.quotationId) {
            const totals = calculateQuotationTotals(state);
            // From pricing-engine: 
            // - totalCost (sum of purchases) -> we map to 'subtotal' in DB
            // - profit (markup)
            // - commissionAmount
            // - totalSales (Sales Price) -> mapped to 'totalPrice' in DB
            await finalizeQuotation(basicInfo.quotationId, {
              status: 'sent',
              subtotal: totals.totalCost,
              totalPrice: totals.totalSales,
              profit: totals.profit,
              commissionAmount: totals.commissionAmount
            });
          }
          toast.success("تم تحديث الفاتورة والتسعير النهائي بنجاح!");
          reset(); // Reset wizard store for the next time
          router.push("/dashboard/quotations");
        } catch (error: any) {
          console.error("Failed to finalize quotation:", error);
          toast.error("حدث خطأ أثناء حفظ الفاتورة");
        } finally {
          setIsSubmitting(false);
        }
    } else {
        // Simple navigation for subsequent steps
        setCurrentStep(prev => prev + 1);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white shadow-lg rounded-xl my-8 text-right" dir="rtl">
      {/* Header / Stepper */}
      <div className="mb-8 border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">إنشاء عرض سعر جديد (New Quotation)</h1>
        <div className="flex gap-2 text-sm text-gray-500 items-center overflow-x-auto">
           <span className={currentStep >= 1 ? "text-blue-600 font-bold whitespace-nowrap" : "whitespace-nowrap"}>1. المعلومات الأساسية</span>
           <span>&gt;</span>
           <span className={currentStep >= 2 ? "text-blue-600 font-bold whitespace-nowrap" : "whitespace-nowrap"}>2. الفنادق</span>
           <span>&gt;</span>
           <span className={currentStep >= 3 ? "text-blue-600 font-bold whitespace-nowrap" : "whitespace-nowrap"}>3. الخدمات</span>
           <span>&gt;</span>
           <span className={currentStep >= 4 ? "text-blue-600 font-bold whitespace-nowrap" : "whitespace-nowrap"}>4. خدمات أخرى</span>
           <span>&gt;</span>
           <span className={currentStep >= 5 ? "text-blue-600 font-bold whitespace-nowrap" : "whitespace-nowrap"}>5. الطيران والسيارات</span>
           <span>&gt;</span>
           <span className={currentStep >= 6 ? "text-blue-600 font-bold whitespace-nowrap" : "whitespace-nowrap"}>6. التسعير النهائي</span>
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {currentStep === 1 && <StepBasicInfo />}
        {currentStep === 2 && <StepHotels />}
        {currentStep === 3 && <StepServices />}
        {currentStep === 4 && <StepOtherServices />}
        {currentStep === 5 && <StepFlightsCars />}
        {currentStep === 6 && <StepFinancials />}
      </div>

      {/* Footer Actions */}
      <div className="mt-8 pt-4 border-t flex justify-end gap-4">
        <button
          onClick={() => {
            if (currentStep > 1) {
                setCurrentStep(prev => prev - 1);
            } else {
                router.back();
            }
          }}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-medium transition-all"
        >
          {currentStep > 1 ? "السابق (Previous)" : "إلغاء / عودة (Back)"}
        </button>

        <button
          onClick={handleNext}
          disabled={isSubmitting}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              جاري الحفط...
            </>
          ) : currentStep === 6 ? (
            "حفظ وإنهاء (Save & Finish)"
          ) : (
            "التالي (Next)"
          )}
        </button>
      </div>
    </div>
  );
}

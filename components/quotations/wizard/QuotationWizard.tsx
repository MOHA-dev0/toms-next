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
import { useQueryClient } from "@tanstack/react-query";
import { finalizeQuotation } from "@/app/actions/quotation-actions";
import { calculateQuotationTotals } from "@/lib/pricing-engine";
import { createDraftQuotationSchema, formatZodErrors } from "@/lib/validations/quotation";

interface QuotationWizardProps {
  isEditMode?: boolean;
  existingStatus?: string;
}

export default function QuotationWizard({ isEditMode, existingStatus }: QuotationWizardProps = {}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const router = useRouter();
  const queryClient = useQueryClient();
  const state = useQuotationStore();
  const { basicInfo, setBasicInfo, reset } = state;

  const handleNext = async () => {
    if (currentStep === 1) {
      if (basicInfo.quotationId) {
        setCurrentStep(2);
        return;
      }

      // ── Frontend validation (for instant UX feedback) ──
      const payload = {
        channel: basicInfo.channel,
        agency: basicInfo.agencyId,
        sales: basicInfo.salesPersonId,
        company: basicInfo.companyId,
        destinationCityIds: basicInfo.destinationCityIds,
        startDate: basicInfo.startDate ? new Date(basicInfo.startDate).toISOString() : undefined,
        nights: basicInfo.nights,
        adults: basicInfo.adults,
        children: basicInfo.children,
        infants: basicInfo.infants,
        passengers: basicInfo.passengers.map(p => ({
          name: p.name,
          type: p.type
        })),
        notes: basicInfo.notes,
      };

      const clientValidation = createDraftQuotationSchema.safeParse(payload);
      if (!clientValidation.success) {
        const errors = formatZodErrors(clientValidation.error);
        setValidationErrors(errors);
        // Show the first error as a toast for visibility
        const firstError = Object.values(errors)[0];
        if (firstError) {
          toast.error(firstError);
        }
        return;
      }

      // Clear any previous errors
      setValidationErrors({});
      setIsSubmitting(true);

      try {
        const response = await fetch('/api/quotations/create-draft', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await response.json();
        
        if (!response.ok) {
          // Handle structured validation errors from backend
          if (response.status === 400 && data.validationErrors) {
            setValidationErrors(data.validationErrors);
            const firstError = Object.values(data.validationErrors)[0] as string;
            toast.error(firstError || data.error);
          } else {
            toast.error(data.details || data.error || "Failed to create draft");
          }
          return;
        }
        
        // Save the generated IDs to our store for future updates in the wizard
        setBasicInfo({ 
          quotationId: data.quotationId, 
          referenceNumber: data.quotationNumber 
        });

        toast.success(`تم إنشاء الحجز بنجاح: ${data.quotationNumber}`);
        
        setCurrentStep(2);
      } catch (error: any) {
        console.error("API Error:", error);
        toast.error(`حدث خطأ: ${error.message || "Error Creating Quotation"}`);
      } finally {
        setIsSubmitting(false);
      }
    } else if (currentStep === 6) {
        if (existingStatus === 'confirmed') {
          const confirmUpdate = window.confirm("هذا العرض مؤكد بالفعل. هل أنت متأكد من رغبتك في تحديثه؟ (This quotation is already confirmed. Are you sure you want to update it?)");
          if (!confirmUpdate) return;
        }

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
              status: existingStatus === 'confirmed' ? 'confirmed' : 'sent',
              subtotal: totals.totalCost,
              totalPrice: totals.totalSales,
              profit: totals.profit,
              commissionAmount: totals.commissionAmount
            }, {
              basicInfo: state.basicInfo,
              hotelSegments: state.hotelSegments,
              flights: state.flights,
              isFlightsEnabled: state.isFlightsEnabled,
              carRentals: state.carRentals,
              isCarsEnabled: state.isCarsEnabled,
              itineraryServices: state.itineraryServices,
              otherServices: state.otherServices,
            });
          }
          toast.success("تم تحديث الفاتورة والتسعير النهائي بنجاح!");
          
          queryClient.invalidateQueries({ queryKey: ['quotations'] });
          reset(); // Reset wizard store for the next time
          router.push("/dashboard/quotations");
        } catch (error: any) {
          console.error("Failed to finalize quotation:", error);
          toast.error("حدث خطأ أثناء حفظ الفاتورة");
        } finally {
          setIsSubmitting(false);
        }
    } else {
        if (currentStep === 2) {
            // Hotels are optional, but if one is added it must have a room selected
            const incompleteHotel = state.hotelSegments.find(h => h.hotelId && !h.roomTypeId);
            if (incompleteHotel) {
                toast.error("يجب اختيار نوع الغرفة لكل فندق مضاف ");
                return;
            }
        }
        // Simple navigation for subsequent steps
        setCurrentStep(prev => prev + 1);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white shadow-lg rounded-xl my-8 text-right" dir="rtl">
      {/* Header / Stepper */}
      <div className="mb-8 border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {isEditMode ? "تعديل عرض سعر (Edit Quotation)" : "إنشاء عرض سعر جديد (New Quotation)"}
        </h1>
        <div className="flex gap-2 text-sm text-gray-500 items-center overflow-x-auto">
           <span className={currentStep >= 1 ? "text-blue-600 font-bold whitespace-nowrap" : "whitespace-nowrap"}>1. المعلومات الأساسية</span>
           <span>&gt;</span>
           <span className={currentStep >= 2 ? "text-blue-600 font-bold whitespace-nowrap" : "whitespace-nowrap"}>2. الفنادق</span>
           <span>&gt;</span>
           <span className={currentStep >= 3 ? "text-blue-600 font-bold whitespace-nowrap" : "whitespace-noدwrap"}>3. الخدمات</span>
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
        {currentStep === 1 && <StepBasicInfo validationErrors={validationErrors} />}
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

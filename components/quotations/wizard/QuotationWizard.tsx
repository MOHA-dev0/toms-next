"use client";

import { useQuotationStore } from "@/lib/store/quotationStore";
import { useState, useEffect } from "react";
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
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface QuotationWizardProps {
  isEditMode?: boolean;
  existingStatus?: string;
}

export default function QuotationWizard({ isEditMode, existingStatus }: QuotationWizardProps = {}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [dialogType, setDialogType] = useState<'none' | 'program_ended' | 'price_locking'>('none');
  const router = useRouter();
  const queryClient = useQueryClient();
  const state = useQuotationStore();
  const { basicInfo, setBasicInfo, reset } = state;

  useEffect(() => {
    // 🚀 Background Prefetching (Zero UI blocking execution)
    // Instantly begins downloading Step 3 & Step 4 resources without freezing Step 1
    const { getServices, getServiceProviders, getHotelsByCity } = require("@/app/actions/quotation-actions");

    queryClient.prefetchQuery({ queryKey: ['services'], queryFn: getServices, staleTime: Infinity });
    queryClient.prefetchQuery({ queryKey: ['providers'], queryFn: getServiceProviders, staleTime: Infinity });

    // Fetch hotels corresponding to existing city segments seamlessly
    const hotelCityIds = Array.from(new Set(state.hotelSegments.map(h => h.cityId).filter(Boolean)));
    hotelCityIds.forEach(cityId => {
      queryClient.prefetchQuery({ queryKey: ['hotels', cityId], queryFn: () => getHotelsByCity(cityId), staleTime: Infinity });
    });
  }, [queryClient, state.hotelSegments]);

  const proceedWithFinalize = async (rebalanceMode: 'update_total' | 'rebalance_internally') => {
    setDialogType('none');
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
          commissionAmount: totals.commissionAmount,
          rebalanceMode
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
  };

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
          type: p.type,
          age: p.age
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
        if (isEditMode && existingStatus !== 'draft') {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const endDate = basicInfo.endDate ? new Date(basicInfo.endDate) : null;
          if (endDate) endDate.setHours(0, 0, 0, 0);

          const isProgramEnded = endDate && endDate < today;

          if (existingStatus === 'confirmed' && isProgramEnded) {
            setDialogType('program_ended');
          } else {
            setDialogType('price_locking');
          }
        } else {
          proceedWithFinalize('update_total');
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

      {/* Action Dialog */}
      <AlertDialog open={dialogType !== 'none'} onOpenChange={(open) => {
        if (!open) setDialogType('none');
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">
              {dialogType === 'program_ended' ? 'تحديث عرض مؤكد ومنتهي' : 'تأكيد تعديل الأسعار'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              {dialogType === 'program_ended' ? (
                <>
                  هذا العرض <span className="font-bold text-foreground">منتهي ومؤكد</span>.
                  {' '}يمكنك فقط تعديل التكاليف الداخلية. لا يمكن تغيير السعر الإجمالي للعرض.
                  {' '}هل تريد المتابعة؟
                </>
              ) : (
                <>
                  هل تريد لهذه التعديلات أن تؤثر على <span className="font-bold text-foreground">السعر الإجمالي</span> للعرض؟
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="ml-0" onClick={() => setDialogType('none')}>إلغاء</AlertDialogCancel>
            {dialogType === 'program_ended' ? (
              <button
                onClick={() => proceedWithFinalize('rebalance_internally')}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white transition-colors"
              >
                متابعة وتحديث التكاليف
              </button>
            ) : (
              <>
                <button
                  onClick={() => proceedWithFinalize('rebalance_internally')}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white transition-colors"
                >
                  الإبقاء على السعر
                </button>
                <button
                  onClick={() => proceedWithFinalize('update_total')}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                >
                  تحديث السعر الإجمالي
                </button>
              </>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

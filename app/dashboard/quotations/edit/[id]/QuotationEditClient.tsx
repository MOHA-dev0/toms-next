"use client";

import { useRef, useEffect } from "react";

import { useQuotationStore } from "@/lib/store/quotationStore";
import QuotationWizard from "@/components/quotations/wizard/QuotationWizard";

interface QuotationEditClientProps {
  initialState: Record<string, unknown>;
  quotationStatus: string;
}

export default function QuotationEditClient({ initialState, quotationStatus }: QuotationEditClientProps) {
  const setFullState = useQuotationStore((state) => state.setFullState);
  
  // Use a ref to initialize the store synchronously ONLY ONCE.
  // This completely eliminates any rendering logic flicker.
  const isInitialized = useRef(false);
  if (!isInitialized.current) {
    // We update the global store synchronously before the first render completes.
    useQuotationStore.getState().setFullState(initialState);
    isInitialized.current = true;
  }

  return (
    <div>
      {quotationStatus === 'confirmed' && (
        <div className="max-w-7xl mx-auto mt-4 p-4 bg-orange-50 border border-orange-200 text-orange-800 rounded-lg text-right" dir="rtl">
          <strong>تنبيه:</strong> هذا العرض مؤكد بالفعل. أي تعديلات سيتم حفظها على العرض الحالي.
        </div>
      )}
      <QuotationWizard isEditMode={true} existingStatus={quotationStatus} />
    </div>
  );
}

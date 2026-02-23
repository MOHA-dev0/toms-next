"use client";

import { useEffect, useState } from "react";
import QuotationWizard from "@/components/quotations/wizard/QuotationWizard";
import { useQuotationStore } from "@/lib/store/quotationStore";

export default function CreateQuotationPage() {
  const reset = useQuotationStore((state) => state.reset);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Clear persisted data from localStorage
    localStorage.removeItem("quotation-storage");
    // Reset the in-memory store to defaults
    reset();
    // Now safe to render the wizard
    setReady(true);
  }, [reset]);

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <QuotationWizard />
    </div>
  );
}

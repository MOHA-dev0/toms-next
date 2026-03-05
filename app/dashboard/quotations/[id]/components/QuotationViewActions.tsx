"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight, Printer } from "lucide-react";

export default function QuotationViewActions({
  referenceNumber,
}: {
  referenceNumber: string | null;
}) {
  const router = useRouter();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      id="no-print-header"
      className="sticky top-0 z-10 bg-white border-b px-4 py-3 shadow-sm flex items-center justify-between"
      dir="rtl"
    >
      <div className="flex items-center gap-4">
        <Button variant="ghost" className="gap-2" onClick={() => router.back()}>
          <ArrowRight className="h-4 w-4" />
          رجوع
        </Button>
        <div className="h-6 w-px bg-slate-200"></div>
        <h1 className="font-bold text-slate-800">
          عرض السعر {referenceNumber ? `#${referenceNumber}` : ""}
        </h1>
      </div>
      <div className="flex items-center gap-2">
        <Button
          onClick={handlePrint}
          className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Printer className="h-4 w-4" />
          طباعة / PDF
        </Button>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Printer, ArrowRight, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ItineraryView from "@/components/quotations/itinerary/ItineraryView";
import { toast } from "sonner";

export default function QuotationViewPage() {
  const params = useParams() as { id: string };
  const id = params?.id;
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Hide sidebar + header on this page (full-screen itinerary)
  useEffect(() => {
    document.body.classList.add("itinerary-fullscreen");
    return () => {
      document.body.classList.remove("itinerary-fullscreen");
    };
  }, []);

  useEffect(() => {
    async function loadQuotation() {
      try {
        const res = await fetch(`/api/quotations/${id}`);
        if (!res.ok) throw new Error("Failed to fetch quotation");
        const json = await res.json();
        setData(json);
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
  }, [id, router]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">جاري تحميل بيانات العرض...</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        body.itinerary-fullscreen aside,
        body.itinerary-fullscreen [data-sidebar],
        body.itinerary-fullscreen nav {
          display: none !important;
        }

        /* إلغاء الهامش الأيمن (mr-64) من الـ main */
        body.itinerary-fullscreen main {
          margin-right: 0 !important;
          margin-left: 0 !important;
        }

        /* إخفاء هيدر الداشبورد */
        body.itinerary-fullscreen main > header:first-child {
          display: none !important;
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 12mm;
          }

          /* إخفاء شريط الإجراءات */
          #no-print-header {
            display: none !important;
          }

          /* إخفاء الشريط الجانبي والهيدر */
          aside, nav, header, footer,
          [data-sidebar], #no-print-header {
            display: none !important;
          }

          /* إلغاء الهامش */
          main {
            margin-right: 0 !important;
            margin-left: 0 !important;
          }

          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          #page-content-wrapper {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            min-height: auto !important;
          }

          #printable-itinerary {
            display: block !important;
            position: static !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            height: auto !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
          }
        }
      `}} />

      {/* شريط الإجراءات */}
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
          <h1 className="font-bold text-slate-800">عرض السعر #{data.referenceNumber}</h1>
        </div>
        <div className="flex items-center gap-2">
       
          <Button onClick={handlePrint} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
            <Printer className="h-4 w-4" />
            طباعة / PDF
          </Button>
        </div>
      </div>

      {/* محتوى مسار الرحلة */}
      <div id="page-content-wrapper" className="w-full bg-[#f8f9fc] min-h-screen pb-12 font-sans">
        <div className="max-w-4xl mx-auto mt-8 print:mt-0 print:max-w-none">
          <ItineraryView quotation={data} />
        </div>
      </div>
    </>
  );
}

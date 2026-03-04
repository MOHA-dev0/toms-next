import { Loader2 } from "lucide-react";

export default function EditQuotationLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4" dir="rtl">
      {/* Spinner */}
      <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
      
      {/* Loading text */}
      <p className="text-gray-500 font-medium">جاري تحميل بيانات العرض...</p>
      
      {/* Quick Skeleton representing the Wizard outline layout */}
      <div className="max-w-7xl mx-auto w-full p-6 bg-white shadow-lg rounded-xl mt-4 opacity-50 pulse border border-gray-100">
        <div className="mb-8 border-b pb-4">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4" />
          <div className="flex gap-2 w-full mt-4">
            <div className="h-4 bg-gray-200 rounded w-1/5" />
            <div className="h-4 bg-gray-200 rounded w-1/5" />
            <div className="h-4 bg-gray-200 rounded w-1/5" />
          </div>
        </div>
        <div className="min-h-[400px] flex flex-col gap-6">
           <div className="grid grid-cols-2 gap-4">
             <div className="h-10 bg-gray-100 rounded" />
             <div className="h-10 bg-gray-100 rounded" />
             <div className="h-10 bg-gray-100 rounded" />
             <div className="h-10 bg-gray-100 rounded" />
           </div>
           <div className="h-40 bg-gray-100 rounded w-full" />
        </div>
      </div>
    </div>
  );
}

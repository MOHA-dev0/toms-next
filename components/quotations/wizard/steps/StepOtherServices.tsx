"use client";

import { useQuotationStore } from "@/lib/store/quotationStore";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getOtherServices } from "@/app/actions/quotation-actions";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function StepOtherServices() {
  const { basicInfo, otherServices, addService, updateService, removeService } = useQuotationStore();
  const [availableServices, setAvailableServices] = useState<{ id: string; nameAr: string; nameEn: string | null; purchasePrice: number; currency: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch available services on mount
  useEffect(() => {
    getOtherServices()
      .then((data) => {
        console.log("Other Services fetched:", data);
        setAvailableServices(data);
      })
      .catch((error) => {
        console.error("Error fetching other services:", error);
        toast.error("فشل في تحميل الخدمات الإضافية");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleAddService = () => {
    addService({
      id: crypto.randomUUID(),
      dayNumber: 0, // Not tied to day
      date: basicInfo.startDate ? new Date(basicInfo.startDate) : new Date(),
      serviceId: "",
      name: "",
      quantity: 1,
      purchasePrice: 0,
      sellingPrice: 0,
      currency: "USD",
    }, 'other');
  };

  const handleServiceChange = (itemId: string, value: string) => {
    // Check if value matches an existing service name
    const matchedService = availableServices.find(s => s.nameAr === value || s.nameEn === value);
    
    if (matchedService) {
        // Auto-fill price from existing
        updateService(itemId, {
            serviceId: matchedService.id,
            name: matchedService.nameAr,
            sellingPrice: matchedService.purchasePrice || 0, // Default to purchase price
            purchasePrice: matchedService.purchasePrice || 0,
            currency: matchedService.currency || 'USD'
        }, 'other');
    } else {
        // Custom service - Keep price if user typed it, or reset if they JUST started typing a new name?
        // Better to execute this logic: if switching from existing to custom, maybe keep price? 
        // Or if it's completely new, user enters price manually.
        // We only update name here.
        updateService(itemId, {
            serviceId: "", // Clear ID as it's custom
            name: value
        }, 'other');
    }
  };

  const grandTotal = otherServices.reduce((sum, s) => sum + (s.sellingPrice * (s.quantity || 1)), 0);

  return (
    <div className="space-y-6" dir="rtl">
        <div className="overflow-x-auto border rounded-lg shadow-sm">
            <table className="w-full text-sm text-right bg-white">
                <thead className="bg-gray-50 text-gray-700 font-medium">
                    <tr>
                        <th className="p-3 border-b w-40">التاريخ</th>
                        <th className="p-3 border-b">الخدمة (Other Service)</th>
                        <th className="p-3 border-b w-32">السعر</th>
                        <th className="p-3 border-b w-24">العملة</th>
                        <th className="p-3 border-b w-32">الإجمالي</th>
                        <th className="p-3 border-b w-16">حذف</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {otherServices.map((service, index) => (
                        <tr key={service.id} className="hover:bg-gray-50 transition-colors">
                            <td className="p-3">
                                <input 
                                    type="date"
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                    value={service.date ? new Date(service.date).toISOString().split('T')[0] : ''}
                                    onChange={(e) => updateService(service.id, { date: new Date(e.target.value) }, 'other')}
                                />
                            </td>
                            <td className="p-3 relative">
                                <input
                                    list={`other-services-list-${index}`}
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                    placeholder="اختر أو اكتب خدمة..."
                                    value={service.name}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        const matched = availableServices.find(s => s.nameAr === value || s.nameEn === value);
                                        if (matched) {
                                            updateService(service.id, {
                                                serviceId: matched.id,
                                                name: matched.nameAr,
                                                sellingPrice: matched.purchasePrice || 0,
                                                currency: matched.currency || 'USD'
                                            }, 'other');
                                        } else {
                                            updateService(service.id, { serviceId: "", name: value }, 'other');
                                        }
                                    }}
                                />
                                <datalist id={`other-services-list-${index}`}>
                                    {availableServices.map(s => (
                                        <option key={s.id} value={s.nameAr}>{s.purchasePrice ? `(${s.purchasePrice} ${s.currency})` : ''}</option>
                                    ))}
                                </datalist>
                            </td>
                            <td className="p-3">
                                <input
                                    type="number"
                                    min="0"
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-center"
                                    value={service.sellingPrice || 0}
                                    onChange={(e) => updateService(service.id, { sellingPrice: Number(e.target.value) }, 'other')}
                                />
                            </td>
                            <td className="p-3">
                                <span className="inline-block px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                                    {service.currency || 'USD'}
                                </span>
                            </td>
                            <td className="p-3 font-bold text-gray-900">
                                {service.sellingPrice.toLocaleString()} {service.currency}
                            </td>
                            <td className="p-3 text-center">
                                <button
                                    onClick={() => removeService(service.id, 'other')}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded transition-all"
                                    title="حذف الخدمة"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </td>
                        </tr>
                    ))}
                    
                    {/* Empty State */}
                    {otherServices.length === 0 && (
                        <tr>
                            <td colSpan={6} className="p-8 text-center text-gray-500">
                                لا توجد خدمات إضافية. اضغط على "إضافة خدمة" للمتابعة.
                            </td>
                        </tr>
                    )}
                </tbody>
                <tfoot className="bg-gray-50 font-bold border-t">
                    <tr>
                        <td colSpan={2} className="p-3">
                            <button
                                onClick={handleAddService}
                                className="flex items-center gap-2 text-blue-600 hover:bg-blue-50 px-4 py-2 rounded transition-colors"
                            >
                                <Plus size={18} />
                                إضافة خدمة (Add Service)
                            </button>
                        </td>
                        <td colSpan={2} className="p-3 text-left">الإجمالي الكلي:</td>
                        <td className="p-3 text-blue-700 text-lg">
                            {grandTotal.toLocaleString()} USD
                        </td>
                        <td></td>
                    </tr>
                </tfoot>
            </table>
        </div>
    </div>
  );
}

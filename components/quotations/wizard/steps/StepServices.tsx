"use client";

import { useEffect, useState } from "react";
import { useQuotationStore } from "@/lib/store/quotationStore";
import { getServices } from "@/app/actions/quotation-actions";
import { format, addDays } from "date-fns";
import { Plus, Trash2, Coins } from "lucide-react";
import { toast } from "sonner";

export default function StepServices() {
  const { basicInfo, itineraryServices, addService, updateService, removeService } = useQuotationStore();
  const [availableServices, setAvailableServices] = useState<{ id: string; nameAr: string; nameEn: string | null; purchasePrice: number; currency: string; cityId: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch available services on mount
  useEffect(() => {
    getServices()
      .then((data) => {
        console.log("Services fetched:", data); // Debug log
        setAvailableServices(data);
      })
      .catch((error) => {
        console.error("Error fetching services:", error);
        toast.error("فشل في تحميل الخدمات");
      })
      .finally(() => setLoading(false));
  }, []);

  // Initialize services based on stay duration if empty or if days are missing
  useEffect(() => {
    if (!basicInfo.startDate || !basicInfo.nights || basicInfo.nights <= 0) return;

    // We check the store synchronously
    const currentServices = useQuotationStore.getState().itineraryServices;
    const existingDays = new Set(currentServices.map(s => s.dayNumber));
    const startDate = new Date(basicInfo.startDate);
    
    let missingDays = false;
    for (let i = 0; i < basicInfo.nights; i++) {
      const dayNum = i + 1;
      if (!existingDays.has(dayNum)) {
        missingDays = true;
        addService({
          id: crypto.randomUUID(),
          dayNumber: dayNum,
          date: addDays(startDate, i),
          serviceId: "",
          name: "",
          quantity: 1, // Default Days = 1
          purchasePrice: 0,
          sellingPrice: 0,
          currency: "USD",
        }, 'itinerary');
      }
    }
  }, [basicInfo.startDate, basicInfo.nights, itineraryServices.length, addService]);

  const handleServiceSelect = (serviceId: string, itemId: string) => {
    console.log("Selecting service:", serviceId);
    
    const selectedService = availableServices.find(s => s.id === serviceId);
    
    if (selectedService) {
      console.log("Found service:", selectedService);
      console.log("Price to set:", selectedService.purchasePrice);
      
      updateService(itemId, {
        serviceId: selectedService.id,
        name: selectedService.nameAr,
        sellingPrice: Number(selectedService.purchasePrice || 0), // Use purchase price as selling price initially
        purchasePrice: Number(selectedService.purchasePrice || 0),
        currency: selectedService.currency || 'USD',
        quantity: 1
      }, 'itinerary');
    } else {
      console.log("Service not found in list");
      // Reset if cleared
      updateService(itemId, {
        serviceId: "",
        name: "",
        sellingPrice: 0,
        purchasePrice: 0,
        currency: "USD"
      }, 'itinerary');
    }
  };

  const handleAddServiceOnDay = (date: Date, dayNumber: number) => {
    addService({
      id: crypto.randomUUID(),
      dayNumber: dayNumber,
      date: date,
      serviceId: "",
      name: "",
      quantity: 1,
      purchasePrice: 0,
      sellingPrice: 0,
      currency: "USD",
    }, 'itinerary');
  };

  const totalServicesCost = itineraryServices.reduce((sum, item) => {
    return sum + (item.sellingPrice * item.quantity);
  }, 0);

  // Filter services by selected cities
  const filteredAvailableServices = availableServices.filter(s => 
    basicInfo.destinationCityIds?.includes(s.cityId)
  );

  if (!basicInfo.startDate) {
      return <div className="text-center p-8 text-gray-500">يرجى تحديد تاريخ البداية في الخطوة الأولى أولاً.</div>;
  }

  // Calculate stay days
  const stayDays = [];
  if (basicInfo.startDate && basicInfo.nights) {
      const start = new Date(basicInfo.startDate);
      for (let i = 0; i < basicInfo.nights; i++) {
          stayDays.push({
              dayNumber: i + 1,
              date: addDays(start, i)
          });
      }
  }

  // Group services by date key for easier rendering
  const servicesByDate = itineraryServices.reduce((acc, service) => {
    const dateKey = new Date(service.date).toISOString().split('T')[0];
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(service);
    return acc;
  }, {} as Record<string, typeof itineraryServices>);

  return (
    <div className="space-y-6" dir="rtl">
        <div className="overflow-x-auto border rounded-lg shadow-sm">
            <table className="w-full text-sm text-right bg-white">
                <thead className="bg-gray-50 text-gray-700 font-bold uppercase">
                    <tr>
                        <th className="px-4 py-3 border-b text-center w-32">التاريخ</th>
                        <th className="px-4 py-3 border-b">الخدمة</th>
                        <th className="px-4 py-3 border-b w-24 text-center">الأيام</th>
                        <th className="px-4 py-3 border-b w-32 text-center">السعر</th>
                        <th className="px-4 py-3 border-b w-24 text-center">العملة</th>
                        <th className="px-4 py-3 border-b w-32 text-center">الإجمالي</th>
                        <th className="px-4 py-3 border-b w-16 text-center">حذف</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {stayDays.map((day) => {
                        const dateKey = day.date.toISOString().split('T')[0];
                        const dayServices = servicesByDate[dateKey] || [];
                        const rowCount = Math.max(1, dayServices.length);
                        
                        // If no services, render one empty placeholder row with "Add" button?
                        // Actually, if dayServices is empty, we show a button to add.
                        
                        return (
                            <>
                                {dayServices.length > 0 ? (
                                    dayServices.map((item, index) => (
                                        <tr key={item.id} className="hover:bg-gray-50">
                                            {/* Date Cell - RowSpan for first item */}
                                            {index === 0 && (
                                                <td rowSpan={rowCount} className="px-4 py-3 border-r border-gray-100 align-top bg-white">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <span className="font-bold text-gray-900">{format(day.date, 'dd/MM/yyyy')}</span>
                                                        <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">اليوم {day.dayNumber}</span>
                                                        <button 
                                                            onClick={() => handleAddServiceOnDay(day.date, day.dayNumber)}
                                                            className="mt-2 text-xs flex items-center gap-1 text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 px-2 py-1 rounded transition-colors"
                                                            title="إضافة خدمة في نفس اليوم"
                                                        >
                                                            <Plus size={14} /> إضافة
                                                        </button>
                                                    </div>
                                                </td>
                                            )}

                                            <td className="px-4 py-2">
                                                <select
                                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                                    value={item.serviceId}
                                                    onChange={(e) => handleServiceSelect(e.target.value, item.id)}
                                                >
                                                    <option value="">-- اختر الخدمة --</option>
                                                    {filteredAvailableServices.map(s => (
                                                        <option key={s.id} value={s.id}>{s.nameAr}</option>
                                                    ))}
                                                </select>
                                            </td>

                                            <td className="px-4 py-2 text-center">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    className="w-full p-2 border border-gray-300 rounded-md text-center"
                                                    value={item.quantity}
                                                    onChange={(e) => updateService(item.id, { quantity: parseInt(e.target.value) || 1 }, 'itinerary')}
                                                />
                                            </td>

                                            <td className="px-4 py-2 text-center">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    className="w-full p-2 border border-gray-300 rounded-md text-center"
                                                    value={item.sellingPrice}
                                                    onChange={(e) => updateService(item.id, { sellingPrice: parseFloat(e.target.value) || 0 }, 'itinerary')}
                                                />
                                            </td>

                                            <td className="px-4 py-2 text-center">
                                                <span className="text-sm font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                                    {item.currency}
                                                </span>
                                            </td>

                                            <td className="px-4 py-2 text-center font-bold text-gray-800">
                                                {(item.sellingPrice * item.quantity).toLocaleString()}
                                            </td>

                                            <td className="px-4 py-2 text-center">
                                                <button
                                                    onClick={() => removeService(item.id, 'itinerary')}
                                                    className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors"
                                                    title="حذف"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    /* Empty state for the day */
                                    <tr key={`empty-${day.dayNumber}`}>
                                        <td className="px-4 py-3 border-r border-gray-100 align-top bg-white text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <span className="font-bold text-gray-900">{format(day.date, 'dd/MM/yyyy')}</span>
                                                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">اليوم {day.dayNumber}</span>
                                            </div>
                                        </td>
                                        <td colSpan={6} className="px-4 py-4 text-center bg-gray-50/50">
                                            <button 
                                                onClick={() => handleAddServiceOnDay(day.date, day.dayNumber)}
                                                className="text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center gap-2 mx-auto"
                                            >
                                                <Plus size={18} /> إضافة خدمة لهذا اليوم
                                            </button>
                                        </td>
                                    </tr>
                                )}
                            </>
                        );
                    })}
                </tbody>
            </table>
        </div>

        {/* Subtotal Footer */}
        <div className="bg-white border rounded-lg shadow-sm p-4 flex justify-between items-center sticky bottom-4 z-10">
            <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                    <Coins size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-gray-800">إجمالي الخدمات الإضافية</h3>
                    <p className="text-xs text-gray-500">مجموع أسعار الخدمات المختارة (Total Services)</p>
                </div>
            </div>
            <div className="text-2xl font-bold text-blue-700 flex items-end gap-2">
                {totalServicesCost.toLocaleString()}
                <span className="text-sm font-normal text-gray-500 mb-1">USD</span>
            </div>
        </div>
    </div>
  );
}

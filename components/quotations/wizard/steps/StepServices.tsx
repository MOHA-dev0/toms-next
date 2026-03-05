"use client";

import React, { useEffect, useMemo, memo, useCallback } from "react";
import { useShallow } from "zustand/shallow";
import { useQuotationStore } from "@/lib/store/quotationStore";
import { getServices, getServiceProviders } from "@/app/actions/quotation-actions";
import { format, addDays } from "date-fns";
import { Plus, Trash2, Coins } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

// ----------------------------------------------------------------------
// MEMOIZED ROW COMPONENT: O(1) Isolation
// Only this specific row re-renders when its target Zustand state changes.
// ----------------------------------------------------------------------
const ServiceTableRow = memo(function ServiceTableRow({
  serviceId,
  availableServices,
  providers,
}: {
  serviceId: string;
  availableServices: any[];
  providers: any[];
}) {
  // Subscribe strictly to this specific service object in the store
  const item = useQuotationStore(useCallback(
    state => state.itineraryServices.find(s => s.id === serviceId),
    [serviceId]
  ));

  // Extract static actions (never trigger re-renders)
  const updateService = useQuotationStore(state => state.updateService);
  const removeService = useQuotationStore(state => state.removeService);

  if (!item) return null;

  const handleServiceSelect = (val: string) => {
    const selected = availableServices.find(s => s.id === val);
    if (selected) {
      updateService(item.id, {
        serviceId: selected.id,
        name: selected.nameAr,
        sellingPrice: Number(selected.purchasePrice || 0),
        purchasePrice: Number(selected.purchasePrice || 0),
        currency: selected.currency || 'USD',
        quantity: 1
      }, 'itinerary');
    } else {
      updateService(item.id, {
        serviceId: "", name: "", sellingPrice: 0, purchasePrice: 0, currency: "USD"
      }, 'itinerary');
    }
  };

  const handleProviderSelect = (newProviderId: string) => {
    updateService(item.id, { providerId: newProviderId }, 'itinerary');

    // UI-orchestrated bulk updates should ideally live in the store, 
    // but this behaves acceptably if provider fills are sparse
    if (newProviderId) {
      const state = useQuotationStore.getState();
      state.itineraryServices.forEach(srv => {
        if (!srv.providerId) {
           updateService(srv.id, { providerId: newProviderId }, 'itinerary');
        }
      });
    }
  };

  return (
    <>
      <td className="px-4 py-2 border-b">
        <select
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 transition-all text-sm truncate"
          value={item.serviceId || ""}
          onChange={(e) => handleServiceSelect(e.target.value)}
        >
          <option value="">-- اختر الخدمة --</option>
          {availableServices.map(s => (
            <option key={s.id} value={s.id}>{s.nameAr}</option>
          ))}
        </select>
      </td>
      <td className="px-4 py-2 border-b">
        <select
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 transition-all text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
            value={item.providerId || ""}
            onChange={(e) => handleProviderSelect(e.target.value)}
            disabled={!item.serviceId}
        >
          <option value="">-- اختر المزود --</option>
          {providers.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </td>
      <td className="px-4 py-2 text-center border-b">
        <input
            type="number" min="1"
            className="w-full p-2 border border-gray-300 rounded-md text-center text-sm"
            value={item.quantity}
            onChange={(e) => updateService(item.id, { quantity: parseInt(e.target.value) || 1 }, 'itinerary')}
        />
      </td>
      <td className="px-4 py-2 text-center border-b">
        <input
            type="number" min="0" step="0.01"
            className="w-full p-2 border border-gray-300 rounded-md text-center text-sm"
            value={item.sellingPrice}
            onChange={(e) => updateService(item.id, { sellingPrice: parseFloat(e.target.value) || 0 }, 'itinerary')}
        />
      </td>
      <td className="px-4 py-2 text-center border-b">
        <span className="text-sm font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">{item.currency}</span>
      </td>
      <td className="px-4 py-2 text-center font-bold text-gray-800 border-b">
        {(item.sellingPrice * item.quantity).toLocaleString()}
      </td>
      <td className="px-4 py-2 text-center border-b">
        <button
            onClick={() => removeService(item.id, 'itinerary')}
            className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors"
        >
          <Trash2 size={18} />
        </button>
      </td>
    </>
  );
});

// ----------------------------------------------------------------------
// MEMOIZED DAY GROUP: Protects against Parent Header Renders
// ----------------------------------------------------------------------
const DaySection = memo(function DaySection({
  dayNumber,
  date,
  availableServices,
  providers,
}: {
  dayNumber: number;
  date: Date;
  availableServices: any[];
  providers: any[];
}) {
  // Extract list of IDs for this day ONLY
  // useShallow prevents infinite loop: .filter().map() creates a new array ref each render,
  // but useShallow compares contents instead of reference
  const serviceIds = useQuotationStore(useShallow(state =>
      state.itineraryServices
          .filter(s => s.dayNumber === dayNumber)
          .map(s => s.id)
  ));

  const addService = useQuotationStore(state => state.addService);

  const handleAdd = () => {
    addService({
      id: crypto.randomUUID(),
      dayNumber: dayNumber,
      date: date,
      serviceId: "",
      providerId: "",
      name: "",
      quantity: 1,
      purchasePrice: 0,
      sellingPrice: 0,
      currency: "USD",
    }, 'itinerary');
  };

  const rowCount = Math.max(1, serviceIds.length);

  return (
    <>
      {serviceIds.length > 0 ? (
        serviceIds.map((id, index) => (
          <tr key={index === 0 ? `head-${id}` : id} className="bg-white hover:bg-gray-50 transition-colors">
            {index === 0 && (
              <td rowSpan={rowCount} className="px-4 py-3 border-r border-gray-100 border-b align-top bg-white w-32">
                <div className="flex flex-col items-center gap-1">
                  <span className="font-bold text-gray-900">{format(date, 'dd/MM/yyyy')}</span>
                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full whitespace-nowrap">اليوم {dayNumber}</span>
                  <button 
                    onClick={handleAdd}
                    className="mt-2 text-xs flex items-center gap-1 text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 px-2 py-1 rounded transition-colors"
                  >
                    <Plus size={14} /> إضافة
                  </button>
                </div>
              </td>
            )}
            <ServiceTableRow 
               serviceId={id} 
               availableServices={availableServices} 
               providers={providers} 
            />
          </tr>
        ))
      ) : (
        <tr key={`empty-${dayNumber}`} className="bg-white border-b">
          <td className="px-4 py-3 border-r border-gray-100 align-top bg-white text-center w-32">
            <div className="flex flex-col items-center gap-1">
              <span className="font-bold text-gray-900">{format(date, 'dd/MM/yyyy')}</span>
              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full whitespace-nowrap">اليوم {dayNumber}</span>
            </div>
          </td>
          <td colSpan={7} className="px-4 py-4 text-center bg-gray-50/50">
            <button 
              onClick={handleAdd}
              className="text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center gap-2 mx-auto"
            >
              <Plus size={18} /> إضافة خدمة لهذا اليوم
            </button>
          </td>
        </tr>
      )}
    </>
  );
});

// ----------------------------------------------------------------------
// MAIN COMPONENT: Thin Container (Renders fast, isolates state updates)
// ----------------------------------------------------------------------
export default function StepServices() {
  // Subscribe strictly to what is needed
  const startDate = useQuotationStore(state => state.basicInfo.startDate);
  const nights = useQuotationStore(state => state.basicInfo.nights);
  const destinationCityIds = useQuotationStore(state => state.basicInfo.destinationCityIds);

  // Subscribe to total cost - will re-render this outer component, 
  // but React.memo secures the rows from re-rendering
  const totalServicesCost = useQuotationStore(state => 
      state.itineraryServices.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0)
  );

  const { data: availableServices = [] } = useQuery({ 
    queryKey: ['services'], queryFn: getServices, staleTime: Infinity 
  });
  
  const { data: providers = [] } = useQuery({ 
    queryKey: ['providers'], queryFn: getServiceProviders, staleTime: Infinity 
  });

  // Filter cleanly via useMemo instead of continuous re-evaluation
  const filteredAvailableServices = useMemo(() => {
     return availableServices.filter(s => destinationCityIds?.includes(s.cityId));
  }, [availableServices, destinationCityIds]);

  // Compute layout structure securely via useMemo
  const stayDays = useMemo(() => {
    const days = [];
    if (startDate && nights) {
      const start = new Date(startDate);
      for (let i = 0; i < nights; i++) {
        days.push({ dayNumber: i + 1, date: addDays(start, i) });
      }
    }
    return days;
  }, [startDate, nights]);

  // Execute missing days check functionally on mount/date change
  useEffect(() => {
    if (!startDate || !nights) return;
    const currentServices = useQuotationStore.getState().itineraryServices;
    const existingDays = new Set(currentServices.map(s => s.dayNumber));
    const start = new Date(startDate);
    const addService = useQuotationStore.getState().addService;

    for (let i = 0; i < nights; i++) {
      const dayNum = i + 1;
      if (!existingDays.has(dayNum)) {
        addService({
          id: crypto.randomUUID(),
          dayNumber: dayNum,
          date: addDays(start, i),
          serviceId: "", providerId: "", name: "",
          quantity: 1, purchasePrice: 0, sellingPrice: 0,
          currency: "USD",
        }, 'itinerary');
      }
    }
  }, [startDate, nights]);

  if (!startDate) {
      return <div className="text-center p-8 text-gray-500">يرجى تحديد تاريخ البداية في الخطوة الأولى أولاً.</div>;
  }

  return (
    <div className="space-y-6" dir="rtl">
        <div className="overflow-x-auto border rounded-lg shadow-sm">
            <table className="w-full text-sm text-right bg-white">
                <thead className="bg-gray-50 text-gray-700 font-bold uppercase">
                    <tr>
                        <th className="px-4 py-3 border-b text-center w-32">التاريخ</th>
                        <th className="px-4 py-3 border-b min-w-[200px]">الخدمة</th>
                        <th className="px-4 py-3 border-b min-w-[150px]">المزود</th>
                        <th className="px-4 py-3 border-b w-24 text-center">الأيام</th>
                        <th className="px-4 py-3 border-b w-32 text-center">السعر</th>
                        <th className="px-4 py-3 border-b w-24 text-center">العملة</th>
                        <th className="px-4 py-3 border-b w-32 text-center">الإجمالي</th>
                        <th className="px-4 py-3 border-b w-16 text-center">حذف</th>
                    </tr>
                </thead>
                <tbody>
                    {stayDays.map((day) => (
                        <DaySection 
                           key={`day-${day.dayNumber}`}
                           dayNumber={day.dayNumber}
                           date={day.date}
                           availableServices={filteredAvailableServices}
                           providers={providers}
                        />
                    ))}
                </tbody>
            </table>
        </div>

        <div className="bg-white border rounded-lg shadow-sm p-4 flex justify-between items-center sticky bottom-4 z-10 transition-colors">
            <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                    <Coins size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-gray-800">إجمالي الخدمات الإضافية</h3>
                    <p className="text-xs text-gray-500">مجموع أسعار الخدمات المختارة</p>
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

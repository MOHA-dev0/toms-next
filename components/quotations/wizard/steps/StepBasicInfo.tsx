"use client";

import { useQuotationStore } from "@/lib/store/quotationStore";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { DatePicker } from "@/components/ui/date-picker";

import { getQuotationReferenceData } from "@/app/actions/quotation-actions";

export default function StepBasicInfo() {
  const { basicInfo, setBasicInfo, addPassenger, removePassenger, updatePassenger, syncPassengersCount } = useQuotationStore();
  const [mounted, setMounted] = useState(false);
  const [referenceData, setReferenceData] = useState<{
    agents: { id: string; nameEn: string }[];
    companies: { id: string; nameEn: string }[];
    cities: { id: string; nameAr: string; nameTr: string | null }[];
    employees: { id: string; nameAr: string }[];
  }>({ agents: [], companies: [], cities: [], employees: [] });

  useEffect(() => {
    setMounted(true);
    // Fetch data
    getQuotationReferenceData().then(data => {
        setReferenceData({
            agents: data.agents,
            companies: data.companies,
            cities: data.cities,
            employees: data.employees
        });
        
        // Auto-select Sales Person if not set
        if (!basicInfo.salesPersonId && data.currentEmployeeId) {
            setBasicInfo({ salesPersonId: data.currentEmployeeId });
        }
    });
  }, []);

  // Ensure at least one destination input exists
  useEffect(() => {
    if (basicInfo.destinationCityIds.length === 0) {
        setBasicInfo({ destinationCityIds: [""] });
    }
  }, [basicInfo.destinationCityIds.length, setBasicInfo]);

  if (!mounted) return null;

  return (
    <div className="space-y-6" dir="rtl">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Channel */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">القناة (Channel)</label>
          <select
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-right"
            value={basicInfo.channel}
            onChange={(e) => setBasicInfo({ channel: e.target.value as 'b2b' | 'b2c' })}
          >
            <option value="b2c">B2C (عميل مباشر)</option>
            <option value="b2b">B2B (وكالة / شركة)</option>
          </select>
        </div>

        {/* Agency */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">الوكالة (Agency)</label>
          <select
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-right"
            value={basicInfo.agencyId || ''}
            onChange={(e) => setBasicInfo({ agencyId: e.target.value })}
            disabled={basicInfo.channel !== 'b2b'}
          >
            <option value="">اختر الوكالة...</option>
            {referenceData.agents.map(agent => (
                <option key={agent.id} value={agent.id}>{agent.nameEn}</option>
            ))}
          </select>
        </div>

        {/* Sales */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">المبيعات (Sales)</label>
          <select
            value={basicInfo.salesPersonId || ''}
            onChange={(e) => {}} 
            disabled
            className="w-full p-2 border border-blue-100 bg-blue-50 rounded-md focus:ring-2 focus:ring-blue-500 text-right cursor-not-allowed"
          >
            <option value="">اختر موظف المبيعات...</option>
            {referenceData.employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.nameAr}</option>
            ))}
          </select>
        </div>

        {/* REF (Auto-generated / Readonly) */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">المرجع (REF)</label>
          <input
            type="text"
            className="w-full p-2 border border-blue-100 bg-blue-50 rounded-md text-gray-500 text-right cursor-not-allowed"
            value="-- سيتم الإنشاء تلقائياً --"
            readOnly
          />
        </div>

        {/* Company */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">الشركة (Company)</label>
          <select
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-right"
            value={basicInfo.companyId || ''}
            onChange={(e) => setBasicInfo({ companyId: e.target.value })}
          >
            <option value="">اختر الشركة...</option>
            {referenceData.companies.map(comp => (
                <option key={comp.id} value={comp.id}>{comp.nameEn}</option>
            ))}
          </select>
        </div>

        {/* Destination (Multi-Select) */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">الوجهات (Destinations)</label>
          <div className="space-y-2">
            {basicInfo.destinationCityIds.map((cityId, index) => (
                <div key={index} className="flex gap-2">
                    <select
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-right bg-white"
                        value={cityId}
                        onChange={(e) => {
                            const newIds = [...basicInfo.destinationCityIds];
                            newIds[index] = e.target.value;
                            setBasicInfo({ destinationCityIds: newIds });
                        }}
                    >
                        <option value="">اختر الوجهة...</option>
                        {referenceData.cities.map(c => (
                            <option key={c.id} value={c.id}>{c.nameAr}</option>
                        ))}
                    </select>
                    <button
                        onClick={() => {
                            const newIds = basicInfo.destinationCityIds.filter((_, i) => i !== index);
                            setBasicInfo({ destinationCityIds: newIds });
                        }}
                        className="text-red-500 hover:bg-red-50 p-2 rounded transition-colors"
                        title="حذف الوجهة"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            ))}
            <button
                onClick={() => setBasicInfo({ destinationCityIds: [...basicInfo.destinationCityIds, ""] })}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
            >
                <Plus size={16} />
                إضافة وجهة أخرى
            </button>
          </div>
        </div>

        {/* Stay Details Group */}
        <div className="col-span-full grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
          {/* Start Date */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">تاريخ البداية (Start Date)</label>
            <DatePicker
              className="w-full border-gray-300 focus:ring-2 focus:ring-blue-500"
              date={basicInfo.startDate ? new Date(basicInfo.startDate) : undefined}
              setDate={(newDate) => {
                let newEndDate = basicInfo.endDate;
                
                if (newDate && basicInfo.nights) {
                   const result = new Date(newDate);
                   result.setDate(result.getDate() + basicInfo.nights);
                   newEndDate = result;
                }
                
                setBasicInfo({ startDate: newDate, endDate: newEndDate });
              }}
            />
          </div>

          {/* Nights */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">الليالي (Nights)</label>
            <input
              type="number"
              min="1"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-right"
              value={basicInfo.nights || ''}
              onChange={(e) => {
                const nights = parseInt(e.target.value) || 0;
                let newEndDate = basicInfo.endDate;

                if (basicInfo.startDate && nights > 0) {
                   const result = new Date(basicInfo.startDate);
                   result.setDate(result.getDate() + nights);
                   newEndDate = result;
                }

                setBasicInfo({ nights, endDate: newEndDate });
              }}
              placeholder="0"
            />
          </div>

          {/* End Date (Auto-calculated) */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">تاريخ النهاية (End Date)</label>
            <DatePicker
              className="w-full border-gray-200 bg-gray-100 text-gray-600 opacity-70"
              date={basicInfo.endDate ? new Date(basicInfo.endDate) : undefined}
              setDate={() => {}}
              disabled
            />
          </div>
        </div>

        {/* Adults (PAX Count) */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">عدد الأشخاص (Adults)</label>
          <input
            type="number"
            min="1"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-right"
            value={basicInfo.adults}
            onChange={(e) => {
              const count = parseInt(e.target.value) || 1;
              syncPassengersCount(count, basicInfo.children, basicInfo.infants);
            }}
          />
        </div>

        {/* Children (PAX Count) */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">عدد الأطفال (Children)</label>
          <input
            type="number"
            min="0"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-right"
            value={basicInfo.children}
            onChange={(e) => {
              const count = parseInt(e.target.value) || 0;
              syncPassengersCount(basicInfo.adults, count, basicInfo.infants);
            }}
          />
        </div>

        {/* Infants (PAX Count) */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">عدد الرضع (Infants)</label>
          <input
            type="number"
            min="0"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-right"
            value={basicInfo.infants}
            onChange={(e) => {
              const count = parseInt(e.target.value) || 0;
              syncPassengersCount(basicInfo.adults, basicInfo.children, count);
            }}
          />
        </div>
      </div>

      {/* Notes / Special Requests */}
      <div className="space-y-2 mt-6">
        <label className="block text-sm font-medium text-gray-700">ملاحظات إضافية (Additional Notes/Requests)</label>
        <textarea
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-right min-h-[100px]"
          value={basicInfo.notes || ""}
          onChange={(e) => setBasicInfo({ notes: e.target.value })}
          placeholder="أدخل أي ملاحظات إضافية أو طلبات خاصة هنا..."
        />
      </div>

      {/* Passenger Names (Dynamic List) */}
      <div className="space-y-4 border-t pt-4">
        <h3 className="text-lg font-semibold text-gray-800">أسماء المسافرين (Passenger Names)</h3>
        
        {basicInfo.passengers.map((passenger, index) => (
          <div key={passenger.id} className="flex gap-4 items-end">
            <div className="flex-1 space-y-1">
              <label className="text-xs text-gray-500">
                المسافر {index + 1} {index === 0 ? '(الرئيسي)' : ''}
              </label>
              <input
                type="text"
                className="w-full h-10 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-right"
                value={passenger.name}
                onChange={(e) => updatePassenger(passenger.id, { name: e.target.value })}
                placeholder={`اسم المسافر ${index + 1} ${index > 0 ? '(اختياري)' : ''}`}
              />
            </div>
            
            <div className="w-40 space-y-1">
               <label className="text-xs text-gray-500">النوع</label>
               <select
                 className="w-full h-10 p-2 border border-gray-300 rounded-md text-right bg-white"
                 value={passenger.type}
                 onChange={(e) => updatePassenger(passenger.id, { type: e.target.value as any })}
               >
                 <option value="adult">بالغ</option>
                 <option value="child">طفل</option>
                 <option value="infant">رضيع</option>
               </select>
            </div>

            <div className="w-10 flex justify-center pb-0.5">
                {index > 0 ? (
                  <button
                    onClick={() => removePassenger(passenger.id)}
                    className="h-10 w-10 flex items-center justify-center text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-md transition-all"
                    title="حذف المسافر"
                  >
                    <Trash2 size={18} />
                  </button>
                ) : (
                    <div className="h-10 w-10" /> /* Spacer for alignment */
                )}
            </div>
          </div>
        ))}

        <button
          onClick={addPassenger}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
        >
          <Plus size={18} />
          <span>إضافة مسافر آخر</span>
        </button>
      </div>

      <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-200 mt-6">
        <div className="text-sm text-gray-500">
             * سيتم إنشاء رقم المرجع تلقائياً عند حفظ المسودة.
        </div>
        
        {/* Save/Next handled by Wizard container usually, but shown here for layout check */}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useQuotationStore } from "@/lib/store/quotationStore";
import { getHotelsByCity, getQuotationReferenceData } from "@/app/actions/quotation-actions";
import { Plus, Trash2, Calendar, Hotel, Moon, Coins } from "lucide-react";
import { toast } from "sonner";
import { HotelSegment } from "@/lib/store/quotationStore";

export default function StepHotels() {
  const { basicInfo, hotelSegments, addHotelSegment, updateHotelSegment, removeHotelSegment } = useQuotationStore();
  const [cities, setCities] = useState<{ id: string; nameAr: string }[]>([]);
  // Cached hotels by City ID to avoid re-fetching
  const [hotelsByCity, setHotelsByCity] = useState<Record<string, any[]>>({});
  const [loadingCity, setLoadingCity] = useState<string | null>(null);

  useEffect(() => {
    // Load initial cities list
    getQuotationReferenceData().then((data) => {
      setCities(data.cities);
    });
  }, []);

  useEffect(() => {
    // Check LIVE state to avoid strict mode double-mount issues
    if (useQuotationStore.getState().hotelSegments.length === 0) {
      addHotelSegment({
        id: crypto.randomUUID(),
        checkIn: new Date(),
        checkOut: new Date(new Date().setDate(new Date().getDate() + 1)),
        cityId: "",
        hotelId: "",
        roomTypeId: "",
        boardType: "bb",
        roomsCount: 1,
        usage: "dbl",
        purchasePrice: 0,
        sellingPrice: 0,
        currency: "USD",
        isVoucherVisible: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCityChange = async (segmentId: string, cityId: string) => {
    updateHotelSegment(segmentId, { cityId, hotelId: "", roomTypeId: "" });
    if (cityId && !hotelsByCity[cityId]) {
      setLoadingCity(cityId);
      try {
        const hotels = await getHotelsByCity(cityId);
        setHotelsByCity((prev) => ({ ...prev, [cityId]: hotels }));
      } catch (err) {
        toast.error("فشل في تحميل الفنادق");
      } finally {
        setLoadingCity(null);
      }
    }
  };

  const handlePriceUpdate = (segmentId: string, updates: Partial<HotelSegment>, segment: HotelSegment) => {
    let newPrice = segment.sellingPrice;
    let newCurrency = segment.currency;

    // Helper to normalize date to YYYY-MM-DD for comparison
    const normalizeDate = (d: Date | string) => {
        const date = new Date(d);
        date.setHours(0, 0, 0, 0);
        return date;
    };

    if (updates.hotelId || updates.roomTypeId || updates.usage || updates.boardType || updates.checkIn || updates.checkOut) {
        const currentCityId = updates.cityId || segment.cityId;
        const currentHotelId = updates.hotelId || segment.hotelId;
        const currentRoomId = updates.roomTypeId || segment.roomTypeId;
        const currentUsage = updates.usage || segment.usage;
        const currentBoard = updates.boardType || segment.boardType;
        
        // Use updated check-in or fallback to existing
        const checkInRaw = updates.checkIn ? updates.checkIn : segment.checkIn;
        const checkInDate = normalizeDate(checkInRaw);
        
        const cityHotels = hotelsByCity[currentCityId] || [];
        const hotel = cityHotels.find(h => h.id === currentHotelId);
        const room = hotel?.roomTypes.find((r: any) => r.id === currentRoomId);
        
        // Find pricing match
        // DB dates are typically YYYY-MM-DD 00:00:00. 
        // We check if (validFrom <= CheckIn) AND (validTo >= CheckIn)
        const pricing = room?.roomPricing.find((p: any) => {
            const validFrom = normalizeDate(p.validFrom);
            const validTo = normalizeDate(p.validTo);
            return (
                p.usage === currentUsage && 
                p.board === currentBoard && 
                validFrom <= checkInDate && 
                validTo >= checkInDate
            );
        });

        if (pricing) {
            newPrice = Number(pricing.sellingPrice);
            newCurrency = pricing.currency;
        } else if (currentRoomId && room?.basePrice) {
            // Fallback to base price if no specific schedule found
            newPrice = Number(room.basePrice);
            newCurrency = room.currency || 'USD';
        } else if (currentRoomId) {
            // Reset only if absolutely no price info found
            newPrice = 0;
            newCurrency = 'USD'; // Reset to default currency
        }
    }

    updateHotelSegment(segmentId, { ...updates, sellingPrice: newPrice, currency: newCurrency });
  };

  const calculateNights = (inDate: Date, outDate: Date) => {
    const diff = new Date(outDate).getTime() - new Date(inDate).getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 3600 * 24)));
  };

  const totalHotelsCost = hotelSegments.reduce((sum, seg) => {
    const nights = calculateNights(seg.checkIn, seg.checkOut);
    return sum + (seg.sellingPrice * nights * seg.roomsCount);
  }, 0);

  return (
    <div className="space-y-8" dir="rtl">
      {hotelSegments.map((segment, index) => {
        const cityHotels = hotelsByCity[segment.cityId] || [];
        const selectedHotel = cityHotels.find(h => h.id === segment.hotelId);
        const roomTypes = selectedHotel?.roomTypes || [];
        const nights = calculateNights(segment.checkIn, segment.checkOut);
        const totalSegmentCost = segment.sellingPrice * nights * segment.roomsCount;

        return (
          <div key={segment.id} className="bg-gray-50 p-6 rounded-lg border border-gray-200 shadow-sm relative">
            <div className="absolute top-4 left-4 flex gap-2">
                <button
                    onClick={() => removeHotelSegment(segment.id)}
                    className="text-red-500 hover:bg-red-100 p-2 rounded-md transition-colors"
                    title="حذف الفندق"
                >
                    <Trash2 size={20} />
                </button>
            </div>

            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Hotel className="text-blue-600" />
                فندق {index + 1}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {/* 1. Dates */}
                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-600">تاريخ الدخول</label>
                    <input 
                        type="date"
                        className="w-full p-2 border rounded-md"
                        value={new Date(segment.checkIn).toISOString().split('T')[0]}
                        onChange={(e) => handlePriceUpdate(segment.id, { checkIn: new Date(e.target.value) }, segment)}
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-600">تاريخ الخروج</label>
                    <input 
                        type="date"
                        className="w-full p-2 border rounded-md"
                        value={new Date(segment.checkOut).toISOString().split('T')[0]}
                        onChange={(e) => handlePriceUpdate(segment.id, { checkOut: new Date(e.target.value) }, segment)}
                    />
                </div>
                
                {/* Calculated Nights */}
                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-600">عدد الليالي</label>
                    <div className="w-full p-2 bg-gray-200 rounded-md text-center font-bold text-gray-700">
                        {nights}
                    </div>
                </div>

                {/* 2. City */}
                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-600">المدينة</label>
                    <select
                        className="w-full p-2 border rounded-md bg-white"
                        value={segment.cityId}
                        onChange={(e) => handleCityChange(segment.id, e.target.value)}
                    >
                        <option value="">اختر المدينة...</option>
                        {cities.map(c => (
                            <option key={c.id} value={c.id}>{c.nameAr}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Hotel Details Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {/* 3. Hotel */}
                <div className="space-y-1 lg:col-span-2">
                    <label className="text-sm font-medium text-gray-600">الفندق</label>
                    <select
                        className="w-full p-2 border rounded-md bg-white"
                        value={segment.hotelId}
                        onChange={(e) => handlePriceUpdate(segment.id, { hotelId: e.target.value, roomTypeId: "" }, segment)}
                        disabled={!segment.cityId}
                    >
                        <option value="">{loadingCity === segment.cityId ? "جاري التحميل..." : "اختر الفندق..."}</option>
                        {cityHotels.map(h => (
                            <option key={h.id} value={h.id}>{h.nameAr}</option>
                        ))}
                    </select>
                </div>

                {/* 4. Room Type */}
                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-600">نوع الغرفة</label>
                    <select
                        className="w-full p-2 border rounded-md bg-white"
                        value={segment.roomTypeId}
                        onChange={(e) => handlePriceUpdate(segment.id, { roomTypeId: e.target.value }, segment)}
                        disabled={!segment.hotelId}
                    >
                        <option value="">اختر الغرفة...</option>
                        {roomTypes.map((r: any) => (
                            <option key={r.id} value={r.id}>{r.nameAr}</option>
                        ))}
                    </select>
                </div>

                {/* 5. Room Count */}
                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-600">عدد الغرف</label>
                    <input
                        type="number"
                        min="1"
                        className="w-full p-2 border rounded-md"
                        value={segment.roomsCount}
                        onChange={(e) => updateHotelSegment(segment.id, { roomsCount: parseInt(e.target.value) || 1 })}
                    />
                </div>
            </div>

            {/* Spec Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 bg-white p-3 rounded border">
                {/* Board */}
                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-600">نوع الإقامة</label>
                    <select
                        className="w-full p-2 border rounded-md bg-white"
                        value={segment.boardType}
                        onChange={(e) => handlePriceUpdate(segment.id, { boardType: e.target.value }, segment)}
                    >
                        <option value="ro">غرفة فقط (RO)</option>
                        <option value="bb">إفطار (BB)</option>
                        <option value="hb">نصف إقامة (HB)</option>
                        <option value="fb">إقامة كاملة (FB)</option>
                        <option value="ai">شامل كلياً (AI)</option>
                    </select>
                </div>

                {/* Usage - Internal */}
                <div className="space-y-1">
                    <label className="text-sm font-medium text-red-600 flex items-center gap-1">
                        استخدام الغرفة 
                        <span className="text-xs bg-red-100 px-1 rounded text-red-500">(داخلي)</span>
                    </label>
                    <select
                        className="w-full p-2 border border-red-100 bg-red-50 rounded-md"
                        value={segment.usage}
                        onChange={(e) => handlePriceUpdate(segment.id, { usage: e.target.value as any }, segment)}
                    >
                        <option value="sgl">مفرد (Single)</option>
                        <option value="dbl">مزدوج (Double)</option>
                        <option value="tpl">ثلاثي (Triple)</option>
                        <option value="quad">رباعي (Quad)</option>
                    </select>
                </div>

                {/* Price Display / Override */}
                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-600">السعر لليلة (Night Price)</label>
                    <div className="flex gap-2">
                        <input
                            type="number"
                            className="w-full p-2 border border-blue-200 rounded-md font-bold text-blue-800"
                            value={segment.sellingPrice}
                            onChange={(e) => updateHotelSegment(segment.id, { sellingPrice: parseFloat(e.target.value) || 0 })}
                        />
                        <div className="p-2 bg-gray-100 rounded-md font-mono min-w-[3rem] text-center">
                            {segment.currency}
                        </div>
                    </div>
                </div>
            </div>

            {/* Notes */}
            <div className="mb-4">
                <label className="text-sm font-medium text-gray-600 block mb-1">ملاحظات (Notes)</label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        className="w-full p-2 border rounded-md"
                        placeholder="أي ملاحظات خاصة بالفندق..."
                        value={segment.notes || ''}
                        onChange={(e) => updateHotelSegment(segment.id, { notes: e.target.value })}
                    />
                    <div className="flex items-center gap-2 min-w-fit px-3 bg-gray-100 rounded border border-gray-200" title="إظهار في العرض">
                        <input
                            type="checkbox"
                            className="w-4 h-4"
                            checked={segment.isVoucherVisible}
                            onChange={(e) => updateHotelSegment(segment.id, { isVoucherVisible: e.target.checked })}
                        />
                        <span className="text-xs text-gray-600">طباعة</span>
                    </div>
                </div>
            </div>

            {/* Segment Total */}
            <div className="flex justify-end items-center gap-2 text-lg font-bold text-gray-800 border-t pt-2 mt-2">
                <span>الإجمالي:</span>
                <span className="text-blue-600">{totalSegmentCost.toLocaleString()}</span>
                <span className="text-sm text-gray-500">{segment.currency}</span>
            </div>
          </div>
        );
      })}

      <button
        onClick={() => addHotelSegment({
            id: crypto.randomUUID(),
            checkIn: new Date(),
            checkOut: new Date(new Date().setDate(new Date().getDate() + 1)),
            cityId: "",
            hotelId: "",
            roomTypeId: "",
            boardType: "bb",
            roomsCount: 1,
            usage: "dbl",
            purchasePrice: 0,
            sellingPrice: 0,
            currency: "USD",
            isVoucherVisible: true,
        })}
        className="w-full py-3 bg-dashed border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 font-medium"
      >
        <Plus size={20} />
        إضافة فندق آخر
      </button>

      {/* Grand Total */}
      <div className="bg-blue-900 text-white p-4 rounded-lg flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-2 text-blue-200">
            <Coins size={24} />
            <span className="text-lg">مجموع تكلفة الفنادق (Estimated)</span>
        </div>
        <div className="text-2xl font-bold">
            {totalHotelsCost.toLocaleString()} 
            {/* Show primary currency or mixed? Simplification: assume primary currency USD or handle mix later */}
            <span className="text-sm font-normal text-blue-300 mr-2">USD (تقريبي)</span>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useQuotationStore } from "@/lib/store/quotationStore";
import { getHotelsByCity, getQuotationReferenceData } from "@/app/actions/quotation-actions";
import { Plus, Trash2, Hotel, Coins, RefreshCw, AlertTriangle, Info } from "lucide-react";
import { toast } from "sonner";
import { HotelSegment } from "@/lib/store/quotationStore";
import { DatePicker } from "@/components/ui/date-picker";

// ── Helper: fetch exchange rate from API ──────────────────────────────
async function fetchRate(from: string, to: string = 'USD'): Promise<{ rate: number; source: string } | null> {
  if (from === to) return { rate: 1, source: 'none' };
  try {
    const res = await fetch(`/api/currency/rate?from=${from}&to=${to}`);
    if (!res.ok) return null;
    const data = await res.json();
    return { rate: data.rate, source: data.source };
  } catch {
    return null;
  }
}

// ── Conversion Info Badge (read-only, shows audit trail) ──────────────
function ConversionInfoBadge({ segment }: { segment: HotelSegment }) {
  if (!segment.originalCurrency || segment.originalCurrency === 'USD' || !segment.originalPrice) {
    return null;
  }
  return (
    <div className="mt-2 flex items-center gap-2 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded px-3 py-1.5">
      <Info size={14} className="shrink-0" />
      <span>
        تم التحويل من <strong>{segment.originalPrice} {segment.originalCurrency}</strong>
        {' '}بسعر صرف <strong className="font-mono">{segment.exchangeRate?.toFixed(4)}</strong>
        {' '}→ <strong>{segment.sellingPrice} USD</strong>
      </span>
    </div>
  );
}

// ── Manual Rate Dialog (shown when API fails) ─────────────────────────
function ManualRateInput({ 
  originalPrice, 
  originalCurrency, 
  onSubmit, 
  onCancel 
}: { 
  originalPrice: number; 
  originalCurrency: string; 
  onSubmit: (rate: number) => void; 
  onCancel: () => void;
}) {
  const [rateInput, setRateInput] = useState('');

  return (
    <div className="mt-2 bg-amber-50 border border-amber-300 rounded-lg p-3 space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-amber-800">
        <AlertTriangle size={16} />
        <span>تعذر الحصول على سعر الصرف تلقائياً</span>
      </div>
      <p className="text-xs text-amber-700">
        السعر الأصلي: <strong>{originalPrice} {originalCurrency}</strong> — يرجى إدخال سعر الصرف يدوياً أو إدخال السعر بالدولار مباشرة
      </p>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-600 whitespace-nowrap">1 {originalCurrency} =</span>
        <input
          type="number"
          step="0.0001"
          value={rateInput}
          onChange={(e) => setRateInput(e.target.value)}
          className="w-28 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-amber-400"
          placeholder="e.g. 1.08"
          dir="ltr"
        />
        <span className="text-xs text-gray-600">USD</span>
        <button
          type="button"
          onClick={() => {
            const rate = parseFloat(rateInput);
            if (!rate || rate <= 0) {
              toast.error('يرجى إدخال سعر صرف صالح');
              return;
            }
            onSubmit(rate);
          }}
          className="text-xs px-3 py-1 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors font-medium"
        >
          تحويل
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs px-3 py-1 bg-gray-200 text-gray-600 rounded hover:bg-gray-300 transition-colors"
        >
          إلغاء
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// ── Main Component ──────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════
export default function StepHotels() {
  const { basicInfo, hotelSegments, addHotelSegment, updateHotelSegment, removeHotelSegment } = useQuotationStore();
  const [cities, setCities] = useState<{ id: string; nameAr: string }[]>([]);
  const [hotelsByCity, setHotelsByCity] = useState<Record<string, any[]>>({});
  const [loadingCity, setLoadingCity] = useState<string | null>(null);
  // Track segments needing manual rate entry (API failure fallback)
  const [manualRateNeeded, setManualRateNeeded] = useState<Record<string, { price: number; currency: string }>>({});
  const [convertingSegments, setConvertingSegments] = useState<Set<string>>(new Set());

  useEffect(() => {
    getQuotationReferenceData().then((data) => {
      setCities(data.cities);
    });
  }, []);

  // Pre-load hotels for existing segments
  const cityIdsString = hotelSegments.map(s => s.cityId).join(',');
  useEffect(() => {
    const uniqueCityIds = Array.from(new Set(cityIdsString.split(',').filter(Boolean)));
    uniqueCityIds.forEach(cityId => {
      setHotelsByCity(prev => {
        if (prev[cityId]) return prev;
        getHotelsByCity(cityId).then(hotels => {
          setHotelsByCity(current => ({ ...current, [cityId]: hotels }));
        }).catch(err => console.error("Failed to load hotels for city", cityId, err));
        return { ...prev, [cityId]: [] };
      });
    });
  }, [cityIdsString]);

  useEffect(() => {
    const liveState = useQuotationStore.getState();
    if (liveState.basicInfo.quotationId) return;
    if (liveState.hotelSegments.length === 0) {
      const { basicInfo } = liveState;
      const defaultCheckIn = basicInfo.startDate ? new Date(basicInfo.startDate) : undefined;
      const defaultCheckOut = basicInfo.endDate ? new Date(basicInfo.endDate) : undefined;
      if (!defaultCheckIn || !defaultCheckOut) return;
      addHotelSegment({
        id: crypto.randomUUID(),
        checkIn: defaultCheckIn,
        checkOut: defaultCheckOut,
        isDateManuallyEdited: false,
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

  // Sync unedited hotel dates with quotation dates
  useEffect(() => {
    if (!basicInfo.startDate || !basicInfo.endDate) return;
    const toDateKey = (d: Date | string) => {
      const date = new Date(d);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };
    const targetCheckInKey = toDateKey(basicInfo.startDate);
    const targetCheckOutKey = toDateKey(basicInfo.endDate);
    hotelSegments.forEach(segment => {
      if (segment.isDateManuallyEdited) return;
      const currentCheckInKey = toDateKey(segment.checkIn);
      const currentCheckOutKey = toDateKey(segment.checkOut);
      if (segment.isDateManuallyEdited === undefined) {
        if (currentCheckInKey !== targetCheckInKey || currentCheckOutKey !== targetCheckOutKey) {
          updateHotelSegment(segment.id, { isDateManuallyEdited: true });
          return;
        }
        return;
      }
      if (currentCheckInKey !== targetCheckInKey || currentCheckOutKey !== targetCheckOutKey) {
        updateHotelSegment(segment.id, {
          checkIn: new Date(basicInfo.startDate!),
          checkOut: new Date(basicInfo.endDate!)
        });
      }
    });
  }, [basicInfo.startDate, basicInfo.endDate, hotelSegments, updateHotelSegment]);

  const handleCityChange = async (segmentId: string, cityId: string) => {
    updateHotelSegment(segmentId, { cityId, hotelId: "", roomTypeId: "" });
    if (cityId && !hotelsByCity[cityId]) {
      setLoadingCity(cityId);
      try {
        const hotels = await getHotelsByCity(cityId);
        setHotelsByCity((prev) => ({ ...prev, [cityId]: hotels }));
      } catch {
        toast.error("فشل في تحميل الفنادق");
      } finally {
        setLoadingCity(null);
      }
    }
  };

  /**
   * Core logic: when a room is selected, find its price.
   * If the price is in a non-USD currency → convert to USD immediately.
   * The price field ALWAYS shows USD.
   */
  const handlePriceUpdate = async (segmentId: string, updates: Partial<HotelSegment>, segment: HotelSegment) => {
    let newPrice = segment.sellingPrice;
    let sourceCurrency = 'USD';

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
      const checkInRaw = updates.checkIn ? updates.checkIn : segment.checkIn;
      const checkInDate = normalizeDate(checkInRaw);

      const cityHotels = hotelsByCity[currentCityId] || [];
      const hotel = cityHotels.find(h => h.id === currentHotelId);
      const room = hotel?.roomTypes.find((r: any) => r.id === currentRoomId);

      const pricing = room?.roomPricing?.find((p: any) => {
        const validFrom = normalizeDate(p.validFrom);
        const validTo = normalizeDate(p.validTo);
        return validFrom <= checkInDate && validTo >= checkInDate;
      });

      if (pricing) {
        newPrice = Number(pricing.sellingPrice);
        sourceCurrency = pricing.currency;
      } else if (currentRoomId && room?.basePrice) {
        newPrice = Number(room.basePrice);
        sourceCurrency = room.currency || 'USD';
      } else if (currentRoomId) {
        newPrice = 0;
        sourceCurrency = 'USD';
      }
    }

    // ── If price is already in USD, just save directly ──
    if (sourceCurrency === 'USD' || newPrice === 0) {
      updateHotelSegment(segmentId, {
        ...updates,
        sellingPrice: newPrice,
        currency: 'USD',
        originalPrice: undefined,
        originalCurrency: undefined,
        exchangeRate: undefined,
        sellingPriceUsd: undefined,
      });
      // Clear any pending manual rate for this segment
      setManualRateNeeded(prev => {
        const next = { ...prev };
        delete next[segmentId];
        return next;
      });
      return;
    }

    // ── Non-USD price → Convert to USD now ──
    // First, apply the field updates immediately (hotel, room selection etc.)
    // but keep the old price visible until conversion completes
    updateHotelSegment(segmentId, { ...updates });

    // Mark as converting
    setConvertingSegments(prev => new Set(prev).add(segmentId));

    const rateResult = await fetchRate(sourceCurrency, 'USD');

    setConvertingSegments(prev => {
      const next = new Set(prev);
      next.delete(segmentId);
      return next;
    });

    if (rateResult && rateResult.rate > 0) {
      // ✅ Success: convert and set USD price
      const usdPrice = Math.round(newPrice * rateResult.rate * 100) / 100;

      updateHotelSegment(segmentId, {
        sellingPrice: usdPrice,
        currency: 'USD',
        originalPrice: newPrice,
        originalCurrency: sourceCurrency,
        exchangeRate: rateResult.rate,
        sellingPriceUsd: usdPrice,
      });

      toast.success(
        `تم التحويل: ${newPrice} ${sourceCurrency} → ${usdPrice} USD (سعر الصرف: ${rateResult.rate.toFixed(4)})`,
        { duration: 4000 }
      );

      // Clear manual rate needed
      setManualRateNeeded(prev => {
        const next = { ...prev };
        delete next[segmentId];
        return next;
      });
    } else {
      // ❌ API failed: show manual rate entry
      // Update fields but keep price as 0 until user provides rate
      updateHotelSegment(segmentId, {
        sellingPrice: 0,
        currency: 'USD',
      });

      setManualRateNeeded(prev => ({
        ...prev,
        [segmentId]: { price: newPrice, currency: sourceCurrency }
      }));

      toast.error(
        `تعذر الحصول على سعر الصرف لـ ${sourceCurrency}→USD. يرجى إدخال السعر يدوياً.`,
        { duration: 5000 }
      );
    }
  };

  /** Handle manual rate submission (fallback when API is down) */
  const handleManualRate = (segmentId: string, rate: number) => {
    const pending = manualRateNeeded[segmentId];
    if (!pending) return;

    const usdPrice = Math.round(pending.price * rate * 100) / 100;

    updateHotelSegment(segmentId, {
      sellingPrice: usdPrice,
      currency: 'USD',
      originalPrice: pending.price,
      originalCurrency: pending.currency,
      exchangeRate: rate,
      sellingPriceUsd: usdPrice,
    });

    setManualRateNeeded(prev => {
      const next = { ...prev };
      delete next[segmentId];
      return next;
    });

    toast.success(`تم التحويل يدوياً: ${pending.price} ${pending.currency} → ${usdPrice} USD`);
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
        const isConverting = convertingSegments.has(segment.id);

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
              {/* Dates */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-600">تاريخ الدخول</label>
                <DatePicker
                  date={segment.checkIn ? new Date(segment.checkIn) : undefined}
                  setDate={(newCheckIn) => {
                    if (!newCheckIn) return;
                    const updates: Partial<HotelSegment> = { checkIn: newCheckIn, isDateManuallyEdited: true };
                    const currentCheckOut = new Date(segment.checkOut);
                    if (newCheckIn >= currentCheckOut) {
                      const minCheckOut = new Date(newCheckIn);
                      minCheckOut.setDate(minCheckOut.getDate() + 1);
                      updates.checkOut = minCheckOut;
                      toast.info("تم تعديل تاريخ الخروج ليكون بعد تاريخ الدخول.");
                    }
                    handlePriceUpdate(segment.id, updates, segment);
                  }}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-600">تاريخ الخروج</label>
                <DatePicker
                  date={segment.checkOut ? new Date(segment.checkOut) : undefined}
                  setDate={(newCheckOut) => {
                    if (!newCheckOut) return;
                    const currentCheckIn = new Date(segment.checkIn);
                    if (newCheckOut <= currentCheckIn) {
                      toast.error("تاريخ الخروج يجب أن يكون بعد تاريخ الدخول.");
                      return;
                    }
                    handlePriceUpdate(segment.id, { checkOut: newCheckOut, isDateManuallyEdited: true }, segment);
                  }}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-600">عدد الليالي</label>
                <div className="w-full p-2 bg-gray-200 rounded-md text-center font-bold text-gray-700">
                  {nights}
                </div>
              </div>

              {/* City */}
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

            {/* Hotel Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
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

              {/* Price — ALWAYS USD */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-600">السعر لليلة (Night Price)</label>
                <div className="flex gap-2">
                  <div className="relative w-full">
                    <input
                      type="number"
                      className={`w-full p-2 border border-blue-200 rounded-md font-bold text-blue-800 ${isConverting ? 'opacity-50' : ''}`}
                      value={segment.sellingPrice}
                      onChange={(e) => updateHotelSegment(segment.id, { sellingPrice: parseFloat(e.target.value) || 0 })}
                      disabled={isConverting}
                    />
                    {isConverting && (
                      <div className="absolute inset-y-0 left-2 flex items-center">
                        <RefreshCw size={14} className="animate-spin text-blue-500" />
                      </div>
                    )}
                  </div>
                  <div className="p-2 bg-green-100 text-green-800 border border-green-300 rounded-md font-mono font-bold min-w-[3rem] text-center">
                    USD
                  </div>
                </div>
              </div>
            </div>

            {/* Conversion info badge — shows original currency & rate used */}
            <ConversionInfoBadge segment={segment} />

            {/* Manual rate fallback (when API fails) */}
            {manualRateNeeded[segment.id] && (
              <ManualRateInput
                originalPrice={manualRateNeeded[segment.id].price}
                originalCurrency={manualRateNeeded[segment.id].currency}
                onSubmit={(rate) => handleManualRate(segment.id, rate)}
                onCancel={() => {
                  setManualRateNeeded(prev => {
                    const next = { ...prev };
                    delete next[segment.id];
                    return next;
                  });
                }}
              />
            )}

            {/* Notes */}
            <div className="mb-4 mt-4">
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

            {/* Segment Total — always USD */}
            <div className="flex justify-end items-center gap-2 text-lg font-bold text-gray-800 border-t pt-2 mt-2">
              <span>الإجمالي:</span>
              <span className="text-blue-600">{totalSegmentCost.toLocaleString()}</span>
              <span className="text-sm text-gray-500">USD</span>
            </div>
          </div>
        );
      })}

      <button
        onClick={() => {
          const { basicInfo, hotelSegments: currentSegments } = useQuotationStore.getState();
          const quotationEnd = basicInfo.endDate ? new Date(basicInfo.endDate) : undefined;
          const quotationStart = basicInfo.startDate ? new Date(basicInfo.startDate) : undefined;

          if (!quotationStart || !quotationEnd) {
            toast.error("يرجى تحديد تاريخ البداية والنهاية أولاً.");
            return;
          }

          // Smart chaining: new hotel starts where the last hotel ends
          let newCheckIn: Date;
          if (currentSegments.length > 0) {
            const lastSegment = currentSegments[currentSegments.length - 1];
            newCheckIn = new Date(lastSegment.checkOut);
          } else {
            newCheckIn = new Date(quotationStart);
          }

          // Check-out is the quotation's end date (or at least 1 night after check-in)
          let newCheckOut = new Date(quotationEnd);
          if (newCheckOut <= newCheckIn) {
            newCheckOut = new Date(newCheckIn);
            newCheckOut.setDate(newCheckOut.getDate() + 1);
          }

          addHotelSegment({
            id: crypto.randomUUID(),
            checkIn: newCheckIn,
            checkOut: newCheckOut,
            isDateManuallyEdited: true,
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
        }}
        className="w-full py-3 bg-dashed border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 font-medium"
      >
        <Plus size={20} />
        إضافة فندق آخر
      </button>

      {/* Grand Total — always USD */}
      <div className="bg-blue-900 text-white p-4 rounded-lg flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-2 text-blue-200">
          <Coins size={24} />
          <span className="text-lg">مجموع تكلفة الفنادق</span>
        </div>
        <div className="text-2xl font-bold">
          {totalHotelsCost.toLocaleString()}
          <span className="text-sm font-normal text-blue-300 mr-2">USD</span>
        </div>
      </div>
    </div>
  );
}

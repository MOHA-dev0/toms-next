import React from 'react';
import { format, differenceInDays } from 'date-fns';

const BOARD: Record<string, string> = {
  ro: 'بدون وجبات',
  bb: 'إفطار مشمول',
  hb: 'نصف إقامة',
  fb: 'إقامة كاملة',
  ai: 'شامل كلياً',
};

export default function ItineraryView({ quotation }: { quotation: any }) {
  if (!quotation) return null;

  const hotels = [...(quotation.quotationHotels || [])].sort(
    (a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime()
  );
  const flights = quotation.quotationFlights || [];
  const cars = quotation.quotationCars || [];
  const itnServices = (quotation.quotationServices || []).filter((s: any) => s.serviceId);
  const otherServices = (quotation.quotationServices || []).filter((s: any) => !s.serviceId);

  const startDate = quotation.startDate ? new Date(quotation.startDate) : (hotels[0] ? new Date(hotels[0].checkIn) : null);
  const endDate = quotation.endDate ? new Date(quotation.endDate) : (hotels.length > 0 ? new Date(hotels[hotels.length - 1].checkOut) : null);
  const totalNights = (startDate && endDate) ? differenceInDays(endDate, startDate) : 0;

  const fmt = (d?: string | Date | null) => d ? format(new Date(d), 'dd/MM/yyyy') : '—';
  const dayOf = (d?: string | Date | null) => {
    if (!startDate || !d) return '—';
    return Math.max(1, differenceInDays(new Date(d), startDate) + 1);
  };

  const destinations = (() => {
    const names = hotels.map((h: any) => h.hotel?.city?.nameAr).filter(Boolean);
    const unique = [...new Set(names)];
    return unique.length > 0 ? unique.join(' & ') : (quotation.destinationCity?.nameAr || 'غير محددة');
  })();

  return (
    <div dir="rtl">
      {/* Print styles */}
      <style>{`
        @media print {
          #printable-itinerary, #printable-itinerary > *, #printable-itinerary .itn-body {
            display: block !important; overflow: visible !important; height: auto !important;
            max-height: none !important; position: static !important;
          }
          #printable-itinerary .no-break { page-break-inside: avoid !important; break-inside: avoid !important; }
          #printable-itinerary .section-head { page-break-after: avoid !important; break-after: avoid !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          #printable-itinerary .summary-grid { display: flex !important; flex-wrap: wrap !important; gap: 10px !important; }
          #printable-itinerary .summary-grid > * { flex: 1 1 30% !important; }
          #printable-itinerary .tours-grid { display: block !important; }
          #printable-itinerary .tours-grid > * { margin-bottom: 10px !important; }
        }
      `}</style>

      <div id="printable-itinerary" className="bg-white text-slate-800 max-w-[900px] mx-auto font-sans">

        {/* ═════ الترويسة — مدمجة وقصيرة ═════ */}
        <div className="no-break bg-gradient-to-l from-[#1e3a5f] to-blue-600 text-white rounded-b-2xl mb-6 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3">
            {/* يمين: العنوان */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-lg">✈</div>
              <div>
                <h1 className="text-lg font-black leading-tight">مسار الرحلة</h1>
                <p className="text-[11px] opacity-70 mt-0.5">{quotation.referenceNumber}</p>
              </div>
            </div>
            {/* وسط: التاريخ + اسم الوكالة */}
            <div className="text-center text-[11px] opacity-80">
              <p>{fmt(new Date())}</p>
              {quotation.agent?.nameEn && <p className="font-bold mt-0.5">{quotation.agent.nameEn}</p>}
            </div>
            {/* يسار: اللوغو */}
            {quotation.agent?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={quotation.agent.logoUrl} alt={quotation.agent?.nameEn || ''} className="h-10 object-contain bg-white rounded-md p-1" />
            ) : <div />}
          </div>
        </div>

        <div className="itn-body px-4">

          {/* ═════ ملخص الرحلة ═════ */}
          <div className="summary-grid no-break grid grid-cols-3 gap-3 mb-8">
            <SummaryCard icon="📍" label="الوجهة" val={destinations} sub={`${totalNights} ليالي`} bg="bg-blue-50" />
            <SummaryCard icon="🗓️" label="تاريخ السفر" val={fmt(startDate)} sub={`حتى ${fmt(endDate)}`} bg="bg-emerald-50" />
            <SummaryCard icon="👥" label="المسافرون" val={`${quotation.adults || 0} بالغين`} sub={quotation.children > 0 ? `${quotation.children} أطفال` : ''} bg="bg-violet-50" />
          </div>

          {/* ═════ الفنادق ═════ */}
          {hotels.length > 0 && (
            <div className="mb-8">
              <SectionTitle title="أماكن الإقامة والفنادق" icon="🏨" />
              {hotels.map((h: any, idx: number) => (
                <div key={idx} className="no-break border border-slate-200 rounded-xl overflow-hidden mb-3">
                  {/* شريط عنوان */}
                  <div className="bg-blue-800 text-white px-4 py-2.5 flex items-center justify-between text-sm">
                    <span className="font-extrabold">اليوم {dayOf(h.checkIn)} ← اليوم {dayOf(h.checkOut)}</span>
                    <div className="flex items-center gap-2.5">
                      <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-xs font-bold">🌙 {h.nights} {h.nights === 1 ? 'ليلة' : 'ليالي'}</span>
                      <span>{h.hotel?.city?.nameAr}</span>
                    </div>
                  </div>
                  {/* تفاصيل */}
                  <div className="p-4">
                    <table className="w-full border-collapse">
                      <tbody>
                        <tr>
                          <td className="align-top pl-3">
                            <CellLabel>الفندق</CellLabel>
                            <div className="flex items-center gap-1.5">
                              <strong className="text-[15px]">{h.hotel?.nameAr || h.hotel?.nameTr || 'غير محدد'}</strong>
                              {h.roomType?.imageUrl && (
                                <a href={h.roomType.imageUrl} target="_blank" rel="noopener noreferrer" title="التفاصيل"
                                  className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 no-underline text-sm shrink-0">🔗</a>
                              )}
                            </div>
                          </td>
                          <td className="align-top pl-3">
                            <CellLabel>الغرفة والوجبات</CellLabel>
                            <div className="text-sm">{h.roomType?.nameAr || 'غير محدد'} — <span className="text-blue-600 font-bold">{BOARD[h.board] || h.board}</span></div>
                          </td>
                          <td className="align-top text-left">
                            <CellLabel>التاريخ</CellLabel>
                            <div className="text-[13px]">وصول: {fmt(h.checkIn)}</div>
                            <div className="text-[13px]">مغادرة: {fmt(h.checkOut)}</div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ═════ الطيران ═════ */}
          {flights.length > 0 && (
            <div className="mb-8">
              <SectionTitle title="الطيران" icon="✈️" />
              {flights.map((f: any, idx: number) => (
                <div key={idx} className="no-break border border-slate-200 rounded-xl p-4 mb-3">
                  <table className="w-full border-collapse">
                    <tbody>
                      <tr>
                        <td className="align-top">
                          <CellLabel>الخط الجوي</CellLabel>
                          <strong className="text-base">{f.airlineAr || 'غير محدد'}</strong>
                          {f.flightNumber && <div className="text-xs text-slate-500">{f.flightNumber}</div>}
                        </td>
                        <td className="align-middle text-center text-xl">✈</td>
                        <td className="align-top text-left">
                          <CellLabel>تاريخ المغادرة</CellLabel>
                          <strong>{fmt(f.departureDate)}</strong>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}

          {/* ═════ التنقلات ═════ */}
          {cars.length > 0 && (
            <div className="mb-8">
              <SectionTitle title="التنقلات والمواصلات" icon="🚗" />
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                {cars.map((c: any, idx: number) => (
                  <div key={idx} className={`no-break flex gap-2.5 py-2 ${idx < cars.length - 1 ? 'border-b border-slate-200' : ''}`}>
                    <span className="text-indigo-500 text-lg shrink-0">✔</span>
                    <div>
                      <div className="font-bold text-[15px]">{c.carTypeAr} — {c.pickupLocation}{c.dropoffLocation ? ` إلى ${c.dropoffLocation}` : ''}</div>
                      <div className="text-[13px] text-slate-500">{fmt(c.pickupDate)}{c.dropoffDate ? ` ← ${fmt(c.dropoffDate)}` : ''}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═════ البرنامج السياحي — مرتب من اليوم الأول ═════ */}
          {itnServices.length > 0 && (() => {
            // تجميع حسب المدينة
            const grouped: Record<string, { cityName: string; services: any[] }> = {};
            for (const s of itnServices) {
              const cityId = s.service?.cityId || '_other';
              const cityName = s.service?.city?.nameAr || 'أخرى';
              if (!grouped[cityId]) grouped[cityId] = { cityName, services: [] };
              grouped[cityId].services.push(s);
            }
            // ترتيب الخدمات داخل كل مدينة حسب التاريخ
            Object.values(grouped).forEach(g =>
              g.services.sort((a: any, b: any) =>
                new Date(a.serviceDate || 0).getTime() - new Date(b.serviceDate || 0).getTime()
              )
            );
            // ترتيب المدن حسب أول يوم خدمة (الأقدم أولاً)
            const sortedGroups = Object.entries(grouped).sort(([, a], [, b]) => {
              const aDate = a.services[0]?.serviceDate ? new Date(a.services[0].serviceDate).getTime() : 0;
              const bDate = b.services[0]?.serviceDate ? new Date(b.services[0].serviceDate).getTime() : 0;
              return aDate - bDate;
            });

            return (
              <div className="mb-8">
                <SectionTitle title="البرنامج السياحي" icon="🗺️" />
                {sortedGroups.map(([cityId, { cityName, services }]) => (
                  <div key={cityId} className="no-break mb-4 border border-slate-200 rounded-xl overflow-hidden">
                    {/* شريط المدينة */}
                    <div className="bg-blue-600 text-white px-4 py-2 flex items-center gap-2">
                      <span className="text-base">📍</span>
                      <span className="font-extrabold text-sm">{cityName}</span>
                      <span className="text-[11px] opacity-70 mr-auto">({services.length} {services.length === 1 ? 'خدمة' : 'خدمات'})</span>
                    </div>
                    {/* جدول الخدمات */}
                    <table className="w-full" style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                      <colgroup>
                        <col style={{ width: '20%' }} />
                        <col style={{ width: '25%' }} />
                        <col style={{ width: '55%' }} />
                      </colgroup>
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 font-bold">
                          <th className="py-2 px-3 text-right border-l border-slate-200">اليوم</th>
                          <th className="py-2 px-3 text-right border-l border-slate-200">التاريخ</th>
                          <th className="py-2 px-3 text-right">الخدمة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {services.map((s: any, idx: number) => (
                          <tr key={idx} className="border-b border-slate-100 last:border-b-0">
                            <td className="py-3 px-3 text-blue-600 font-extrabold text-center text-base border-l border-slate-100">{dayOf(s.serviceDate)}</td>
                            <td className="py-3 px-3 text-slate-600 text-[13px] text-center border-l border-slate-100">{fmt(s.serviceDate)}</td>
                            <td className="py-3 px-3 text-sm">
                              <div className="font-bold text-slate-800">{s.nameAr || s.service?.nameAr}</div>
                              {s.descriptionAr && <div className="text-xs text-slate-400 mt-0.5">{s.descriptionAr}</div>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* ═════ خدمات إضافية ═════ */}
          {otherServices.length > 0 && (
            <div className="mb-8">
              <SectionTitle title="خدمات إضافية" icon="☕" />
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                {otherServices.map((s: any, idx: number) => (
                  <div key={idx} className="no-break flex gap-2.5 mb-2">
                    <span className="text-slate-400 mt-0.5">●</span>
                    <div>
                      <div className="font-bold">{s.nameAr}</div>
                      {s.descriptionAr && <div className="text-xs text-slate-500">{s.descriptionAr}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═════ السعر الإجمالي ═════ */}
          <div className="no-break bg-gradient-to-l from-[#1e3a5f] to-blue-700 rounded-2xl px-7 py-5 text-white flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-black m-0">إجمالي تكلفة العرض</h2>
              <p className="text-xs opacity-80 mt-1">شامل كافة الخدمات المذكورة أعلاه</p>
            </div>
            <div className="text-left">
              <div className="text-[32px] font-black leading-none">${Number(quotation.totalPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div className="text-xs opacity-80">دولار أمريكي</div>
            </div>
          </div>

          {/* ═════ ملاحظات ═════ */}
          <div className="no-break p-4 border border-amber-300 bg-amber-50 rounded-xl text-[13px] text-amber-900 leading-relaxed">
            <strong className="text-[15px] block mb-1.5">⚠️ ملاحظات هامة:</strong>
            <div className="whitespace-pre-wrap">
              {quotation.notes ||
                `• هذا العرض غير مؤكد حتى يتم دفع المبلغ بالكامل أو الدفعة المقدمة المطلوبة.\n• جميع الأسعار خاضعة للتغيير بناءً على التوافر وقت التأكيد الفعلي.\n• يرجى التحقق من تواريخ صلاحية جوازات السفر (يجب أن تكون صالحة لمدة 6 أشهر على الأقل).`}
            </div>
          </div>

        </div>{/* end itn-body */}
      </div>{/* end #printable-itinerary */}
    </div>
  );
}

/* ═══════════════════════════════════════ */
function SectionTitle({ title, icon }: { title: string; icon: string }) {
  return (
    <div className="section-head flex items-center gap-2.5 mb-4">
      <span className="text-xl">{icon}</span>
      <h2 className="m-0 text-lg font-black text-slate-800 border-b-2 border-blue-500 pb-1 flex-1">{title}</h2>
    </div>
  );
}

function SummaryCard({ icon, label, val, sub, bg }: { icon: string; label: string; val: string; sub: string; bg: string }) {
  return (
    <div className={`${bg} p-4 rounded-2xl flex items-center gap-3`}>
      <span className="text-xl bg-white w-10 h-10 flex items-center justify-center rounded-full shadow-sm shrink-0">{icon}</span>
      <div>
        <div className="text-[11px] text-slate-500 font-bold mb-0.5">{label}</div>
        <div className="font-black text-sm text-slate-800">{val}</div>
        {sub && <div className="text-xs text-slate-500">{sub}</div>}
      </div>
    </div>
  );
}

function CellLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] text-slate-500 font-bold mb-1">{children}</div>;
}
'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowRight, Printer, Building, Car, FileText, Copy, CheckCircle, Layers } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/bookings/${id}`);
       
        if (!res.ok) throw new Error();
        setBooking(await res.json());
      } catch {
        toast.error('فشل في جلب بيانات الحجز');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  useEffect(() => {
  if (!booking) return;

  const serviceVouchers = booking.vouchers?.filter((v:any) => v.voucherType === 'other') || [];
  serviceVouchers.forEach((v:any) => {
    console.log("🟢 Notes:", v.notesTr || v.notesAr);
    console.log("🟢 City:", v.cityTr || v.cityAr); // إذا موجود من الـ API
  });
}, [booking]);

  const fmt = (d?: string | null) => d ? format(new Date(d), 'dd-MM-yyyy') : '—';

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('تم نسخ رقم الفاوتشر');
  };

  const printVoucher = (voucherId: string) => {
    const v = booking?.vouchers?.find((vx: any) => vx.id === voucherId);
    if (!v) return;

    const q = booking.quotation;
    const createdAtDate = v.createdAt ? new Date(v.createdAt) : new Date(booking.createdAt);
    const printDate = format(createdAtDate, "d.M.yyyy");
    const printTime = format(createdAtDate, "HH:mm");

    const getTitle = (name: string, type: string) => {
      if (type === 'child') return 'CHD.';
      if (type === 'infant') return 'INF.';
      const lowerName = name.toLowerCase();
      if (lowerName.includes('mrs') || lowerName.includes('ms')) return 'Mrs.';
      if (lowerName.includes('mr')) return 'Mr.';
      const firstPart = lowerName.split(' ')[0];
      const femaleNames = ['weam', 'tasneem', 'sara', 'fatima', 'aisha', 'nour', 'maryam', 'huda', 'maha', 'nada', 'reem', 'layla', 'asma', 'zainab', 'khadija'];
      if (femaleNames.includes(firstPart) || firstPart.endsWith('a') || firstPart.endsWith('ah')) return 'Mrs.';
      return 'Mr.';
    };

    if (v.voucherType === 'hotel') {
      const adults = q?.adults || 0;
      const childrenCount = q?.children || 0;
      const infants = q?.infants || 0;
      const totalPax = adults + childrenCount + infants;
      const hotelName = v.hotel?.nameTr || v.hotel?.nameAr || 'HOTEL';
      const cIn = v.checkIn ? format(new Date(v.checkIn), "dd-MM-yyyy") : '';
      const cOut = v.checkOut ? format(new Date(v.checkOut), "dd-MM-yyyy") : '';
      
      let days = 0;
      if (v.checkIn && v.checkOut) {
        const diff = new Date(v.checkOut).getTime() - new Date(v.checkIn).getTime();
        days = Math.round(diff / (1000 * 3600 * 24));
      }

      const hInfo = q?.quotationHotels?.find((hx:any) => hx.hotelId === v.hotelId);
      const roomCount = hInfo?.roomsCount || 1;
      const usage = (hInfo?.usage || 'DBL').toUpperCase();

      let pax = q?.passengers && q.passengers.length > 0 ? [...q.passengers] : [{ name: (v.guestNameTr || v.guestNameAr || ''), type: 'adult' }];
      const mainGuestName = (v.guestNameTr || v.guestNameAr || '').toLowerCase();
      if (pax.length > 1 && mainGuestName) {
        pax.sort((a, b) => {
          if (a.name.toLowerCase() === mainGuestName) return -1;
          if (b.name.toLowerCase() === mainGuestName) return 1;
          return 0;
        });
      }

      const paxHtml = pax.map((p:any) => {
        let fullName = p.name.toUpperCase().replace(/^(MR\.?|MRS\.?|MS\.?|MISS|CHD\.?|INF\.?)\s+/i, '');
        const title = getTitle(p.name, p.type || 'adult');

        let subText = '';
        if (p.type === 'child') {
          subText = ` <span style="font-size: 10px; color: #555;"></span>`;
        }

        const ageCol = p.age != null ? String(p.age) : '';
        
        return `<tr><td style="padding: 3px 0;">${title} ${fullName}${subText}</td><td>${ageCol}</td><td></td><td></td><td></td><td></td></tr>`;
      }).join('');

      const html = `
      <html dir="ltr">
        <head>
          <meta charset="utf-8">
          <title>Voucher - ${v.voucherCode}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; font-family: Arial, Helvetica, sans-serif; }
            body { padding: 40px; color: #000; font-size: 13px; }
            .header-container { text-align: center; margin-bottom: 20px; position: relative; }
            .date-time { position: absolute; right: 0; top: 0; text-align: left; font-size: 11px; }
            .title-block { font-size: 17px; font-weight: bold; font-style: italic; line-height: 1.3; margin-top: 10px;}
            .title-block span { font-size: 17px; font-weight: bold; font-style: italic; text-transform: uppercase;}
            .v-info-row { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 20px; font-size: 14px; font-weight: bold; }
            .status-new { font-size: 24px; font-weight: bold; padding-right: 50px; }
            .cols { display: flex; justify-content: space-between; margin-top: 20px; font-size: 13px; }
            table.info-table { border: none; font-size: 13px; font-weight: bold; border-collapse: separate; border-spacing: 0 4px; }
            table.info-table td { border: none; text-align: left; }
            table.info-table td:first-child { text-align: right; padding-right: 5px; font-weight: normal; }
            .notes-block { margin-top: 25px; font-size: 13px; font-weight: bold; text-transform: uppercase; }
            .pax-table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 50px; text-align: left; }
            .pax-table th { font-weight: normal; padding-bottom: 10px; border: none; }
            .pax-table td { border: none; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="header-container">
            <div class="date-time">DATE : ${printDate}<br/>TIME : ${printTime}</div>
            <div class="title-block">TS SAHIL TURIZM<br/>HOTEL RESERVATION FORM<br/><span>${hotelName}</span></div>
          </div>
          <div class="v-info-row">
            <div>
              <div style="margin-bottom: 5px;">Voucher No: <span style="font-weight: normal; margin-left: 5px;">${v.voucherCode}</span></div>
              <div>Operator : </div>
            </div>
            <div class="status-new">NEW</div>
            <div style="width: 150px;"></div>
          </div>
          <div class="cols">
            <div>
              <table class="info-table">
                <tr><td style="width:20px;">1.</td><td>C/in Date :</td><td>${cIn}</td></tr>
                <tr><td></td><td>C/Out Date :</td><td>${cOut}</td></tr>
                <tr><td></td><td>Day :</td><td>${days}</td></tr>
              </table>
            </div>
            <div>
              <table class="info-table">
                <tr><td>Room Count :</td><td>${roomCount}</td></tr>
                <tr><td>Room :</td><td>${usage}</td></tr>
                <tr><td>Room Type :</td><td>${(v.roomTypeTr || v.roomTypeAr || '').toUpperCase()}</td></tr>
                <tr><td>Board :</td><td>${(v.boardTr || v.boardAr || '').toUpperCase()}</td></tr>
              </table>
            </div>
            <div>
              <table class="info-table">
                <tr><td>Adult :</td><td>${adults}</td></tr>
                <tr><td>Ext. Bed :</td><td></td></tr>
                <tr><td>Child :</td><td>${childrenCount || ''}</td></tr>
                <tr><td>Infant :</td><td>${infants || ''}</td></tr>
                <tr><td>Total Pax :</td><td>${totalPax}</td></tr>
              </table>
            </div>
          </div>
          <div class="notes-block">NOTE : <span style="font-weight: normal; margin-left: 10px; text-transform: none;">${v.notesTr || v.notesAr || ''}</span></div>
          <table class="pax-table">
            <thead><tr><th>SURNAME, NAME</th><th>AGE</th><th>ARRIV.POINT</th><th>TIME</th><th>DEPAR.POINT</th><th>SAAT</th></tr></thead>
            <tbody>${paxHtml}</tbody>
          </table>
          <div style="margin-top: 50px; font-weight: bold; font-size: 14px;">CEP: +905469514042</div>
        </body>
      </html>
      `;
      const w = window.open('', '_blank');
      if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 300); }
      return;
    }

    // High quality template for Transport & Other Services
    const titleText = v.voucherType === 'transportation' ? 'TRANSPORTATION VOUCHER' : 'TOURS & SERVICES VOUCHER';
    let guestPrefix = (v.guestNameTr || v.guestNameAr || '').toUpperCase().replace(/^(MR\.?|MRS\.?|MS\.?|MISS|CHD\.?|INF\.?)\s+/i, '');
    const titleUser = getTitle(v.guestNameTr || v.guestNameAr || '', 'adult');
    const formattedGuest = `${titleUser} ${guestPrefix}`;
    const cleanNotes = (v.notesTr || v.notesAr || '').replace(/الخدمات المشمولة:\n/g, '');

    let contentHtml = '';
    
    if (v.voucherType === 'other') {
      const parsedServices = cleanNotes.split('\n').filter((line: string) => line.trim().startsWith('•')).map((line: string) => {
        let date = '-'; let city = '-'; let name = line.replace(/^•\s*/, '').trim();
        const dateSplit = name.split(/\s+(?:—|-)\s+/);
        if (dateSplit.length > 1) { date = dateSplit.pop()?.trim() || '-'; name = dateSplit.join(' — ').trim(); }
        const cityMatch = name.match(/\s\(([^)]+)\)$/);
        if (cityMatch) { city = cityMatch[1].trim(); name = name.replace(/\s\(([^)]+)\)$/, '').trim(); }
        return { name, city, date };
      }).sort((a: any, b: any) => {
        if(a.date !== '-' && b.date !== '-') {
          return a.date.split('-').reverse().join('-').localeCompare(b.date.split('-').reverse().join('-'));
        }
        return 0;
      });

      contentHtml = `
         <div class="details-box" style="padding: 0; border: none; margin-top: 30px;">
           <div style="margin-bottom: 25px; font-size: 16px;">
             <strong>GUEST NAME:</strong> <span style="margin-left: 10px; font-weight: normal; border-bottom: 1px solid #000; padding: 0 10px; display: inline-block; min-width: 200px;">${formattedGuest}</span>
           </div>
           <strong style="font-size: 16px; display: block; margin-bottom: 15px; text-transform: uppercase;">Included Services:</strong>
           
           <table style="width: 100%; border-collapse: collapse; margin-top: 10px; text-align: left; font-size: 14px; border: 1px solid #000;">
             <thead>
               <tr style="background-color: #f8f9fa;">
                 <th style="border-bottom: 2px solid #000; border-right: 1px solid #000; padding: 12px 15px; width: 20%;">DATE</th>
                 <th style="border-bottom: 2px solid #000; border-right: 1px solid #000; padding: 12px 15px; width: 25%;">CITY</th>
                 <th style="border-bottom: 2px solid #000; padding: 12px 15px; width: 55%;">SERVICE DETAILS</th>
               </tr>
             </thead>
             <tbody>
               ${parsedServices.map((s: any) => `
                 <tr>
                   <td style="border-bottom: 1px solid #000; border-right: 1px solid #000; padding: 12px 15px; font-weight: bold;">${s.date}</td>
                   <td style="border-bottom: 1px solid #000; border-right: 1px solid #000; padding: 12px 15px; font-weight: bold; color: #4b5563;">${s.city}</td>
                   <td style="border-bottom: 1px solid #000; padding: 12px 15px;">${s.name}</td>
                 </tr>
               `).join('')}
             </tbody>
           </table>
        </div>
      `;
    } else {
      contentHtml = `
      <div class="details-box">
         <div style="margin-bottom: 25px; font-size: 16px;">
           <strong>GUEST NAME:</strong> <span style="margin-left: 10px; font-weight: normal; border-bottom: 1px solid #000; padding: 0 10px;">${formattedGuest}</span>
         </div>
         <strong>DETAILS:</strong><br/>
         <div style="white-space: pre-wrap; margin-top: 15px; padding-left: 10px; font-size: 15px; font-weight: normal;">${cleanNotes}</div>
      </div>`;
    }

    const html = `
    <html dir="ltr">
      <head>
        <meta charset="utf-8">
        <title>Voucher - ${v.voucherCode}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; font-family: Arial, Helvetica, sans-serif; }
          body { padding: 40px; color: #000; font-size: 13px; }
          .header-container { text-align: center; margin-bottom: 20px; position: relative; }
          .date-time { position: absolute; right: 0; top: 0; text-align: left; font-size: 11px; }
          .title-block { font-size: 17px; font-weight: bold; font-style: italic; line-height: 1.3; margin-top: 10px;}
          .v-info-row { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 20px; font-size: 14px; font-weight: bold; text-transform: uppercase; }
          .status-new { font-size: 24px; font-weight: bold; padding-right: 50px; }
          .details-box { border: 1px solid #000; padding: 25px; margin-top: 30px; font-size: 15px; line-height: 1.8; text-align: left; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header-container">
          <div class="date-time">DATE : ${printDate}<br/>TIME : ${printTime}</div>
          <div class="title-block">TS SAHIL TURIZM<br/>${titleText}</div>
        </div>
        <div class="v-info-row">
          <div>
            <div style="margin-bottom: 5px;">Voucher No: <span style="font-weight: normal; margin-left: 5px;">${v.voucherCode}</span></div>
            <div>Operator : </div>
          </div>
          <div class="status-new">NEW</div>
          <div style="width: 150px;"></div>
        </div>
        ${contentHtml}
        <div style="margin-top: 50px; font-weight: bold; font-size: 14px; text-align: left;">CEP: +905469514042</div>
      </body>
    </html>
    `;
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 300); }
  };

  const [regenerating, setRegenerating] = useState(false);

  const handleRegenerateInvoice = async () => {
    if (!confirm('هذا الإجراء سيقوم بحذف كافة فواتير الحجز الحالية وتوليد فواتير جديدة من مسودة عرض الأسعار. هل أنت متأكد؟')) return;
    
    setRegenerating(true);
    try {
      const res = await fetch(`/api/bookings/${id}/re-confirm`, { method: 'POST' });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'حدث خطأ غير معروف');
      }
      toast.success('تم تحديث الفواتير بناءً على الهيكلة الجديدة!');
      
      // Reload the data instead of hard reload
      const fetchRes = await fetch(`/api/bookings/${id}`);
      if (fetchRes.ok) {
        setBooking(await fetchRes.json());
      }
    } catch(err: any) {
      toast.error(err.message);
    } finally {
      setRegenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-muted-foreground">
        <p>الحجز غير موجود</p>
      </div>
    );
  }

  const q = booking.quotation;
  const hotelVouchers = booking.vouchers?.filter((v: any) => v.voucherType === 'hotel') || [];
  const transVouchers = booking.vouchers?.filter((v: any) => v.voucherType === 'transportation') || [];
  const serviceVouchers = booking.vouchers?.filter((v: any) => v.voucherType === 'other') || [];

  return (
    <div className="flex-1 p-6 space-y-6" dir="rtl">
      
      {/* Structural Modifications Detected Banner */}
      {booking.invoiceNeedsUpdate && (
        <div className="bg-rose-50 border-2 border-rose-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              <span className="text-xl">⚠️</span>
            </div>
            <div>
              <h2 className="text-rose-800 font-bold text-sm">تعديلات هيكلية جديدة</h2>
              <p className="text-rose-600 text-xs mt-1 max-w-lg">
                لقد تم إجراء تعديلات على عرض السعر المؤكد لهذا الحجز (كإضافة/حذف ليالي، تغيير فندق، أو إضافة خدمات). الفواتير والفاوتشرات الحالية قديمة ويجب إعادة توليدها لتعكس أحدث التغييرات.
              </p>
            </div>
          </div>
          <div>
            <button 
              onClick={handleRegenerateInvoice}
              disabled={regenerating}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors shadow-sm disabled:opacity-50 inline-flex items-center gap-2"
            >
              {regenerating ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Printer className="w-4 h-4" />}
              إعادة توليد الفواتير (Sync)
            </button>
          </div>
        </div>
      )}

      {/* Back + Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/dashboard/bookings')} className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowRight className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-black text-foreground">حجز {booking.referenceNumber}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            العرض: {q?.referenceNumber} • العميل: {q?.customer?.nameAr} • {fmt(booking.createdAt)}
          </p>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <InfoCard label="رقم الحجز" value={booking.referenceNumber} icon="📋" />
        <InfoCard label="فنادق" value={`${hotelVouchers.length}`} icon="🏨" />
        <InfoCard label="مواصلات" value={`${transVouchers.length}`} icon="🚗" />
        <InfoCard label="خدمات" value={`${serviceVouchers.length}`} icon="🗺️" />
      </div>

      {/* Hotel Vouchers */}
      {hotelVouchers.length > 0 && !booking.invoiceNeedsUpdate && (
        <div>
          <h2 className="text-lg font-black text-foreground mb-3 flex items-center gap-2">
            <Building className="w-5 h-5 text-blue-600" /> فاوتشرات الفنادق
          </h2>
          <div className="space-y-4">
            {hotelVouchers.map((v: any) => (
              <div key={v.id} className="bg-card rounded-2xl border border-border overflow-hidden">
                {/* Voucher header */}
                <div className="bg-blue-800 text-white px-5 py-3 flex items-center justify-between" dir="ltr">
                  <div className="text-left">
                    <p className="font-black text-base uppercase">{v.hotel?.nameTr || v.hotel?.nameAr || 'HOTEL'}</p>
                    <p className="text-xs opacity-70 mt-0.5">Voucher No: {v.voucherCode}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => copyCode(v.voucherCode)} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors" title="Copy Code">
                      <Copy className="w-4 h-4" />
                    </button>
                    <button onClick={() => printVoucher(v.id)} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors" title="Print">
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {/* Printable content view */}
                <div id={`voucher-${v.id}`} dir="ltr">
                  <div className="header" style={{ background: '#1e40af', color: 'white', padding: '16px 20px', textAlign: 'left' }}>
                    <h2 style={{ fontSize: 18, fontWeight: 900 }}>HOTEL RESERVATION FORM — {(v.hotel?.nameTr || v.hotel?.nameAr || '').toUpperCase()}</h2>
                    <p style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>Voucher No: {v.voucherCode} • Booking: {booking.referenceNumber}</p>
                  </div>
                  <div style={{ padding: 20, border: '1px solid #d1d5db', borderTop: 'none', textAlign: 'left' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <tbody>
                        <tr>
                          <th style={{ border: '1px solid #d1d5db', padding: '10px 14px', background: '#f1f5f9', textAlign: 'left', fontSize: 12, color: '#64748b', width: '30%' }}>Guest Name</th>
                          <td style={{ border: '1px solid #d1d5db', padding: '10px 14px', fontSize: 14 }}>{v.guestNameTr || v.guestNameAr}</td>
                        </tr>
                        <tr>
                          <th style={{ border: '1px solid #d1d5db', padding: '10px 14px', background: '#f1f5f9', textAlign: 'left', fontSize: 12, color: '#64748b' }}>C/In Date</th>
                          <td style={{ border: '1px solid #d1d5db', padding: '10px 14px', fontSize: 14 }}>{v.checkIn ? format(new Date(v.checkIn), "dd-MM-yyyy") : ''}</td>
                        </tr>
                        <tr>
                          <th style={{ border: '1px solid #d1d5db', padding: '10px 14px', background: '#f1f5f9', textAlign: 'left', fontSize: 12, color: '#64748b' }}>C/Out Date</th>
                          <td style={{ border: '1px solid #d1d5db', padding: '10px 14px', fontSize: 14 }}>{v.checkOut ? format(new Date(v.checkOut), "dd-MM-yyyy") : ''}</td>
                        </tr>
                        <tr>
                          <th style={{ border: '1px solid #d1d5db', padding: '10px 14px', background: '#f1f5f9', textAlign: 'left', fontSize: 12, color: '#64748b' }}>Room Type</th>
                          <td style={{ border: '1px solid #d1d5db', padding: '10px 14px', fontSize: 14 }}>{(v.roomTypeTr || v.roomTypeAr || '').toUpperCase()}</td>
                        </tr>
                        <tr>
                          <th style={{ border: '1px solid #d1d5db', padding: '10px 14px', background: '#f1f5f9', textAlign: 'left', fontSize: 12, color: '#64748b' }}>Board</th>
                          <td style={{ border: '1px solid #d1d5db', padding: '10px 14px', fontSize: 14 }}>{(v.boardTr || v.boardAr || '').toUpperCase()}</td>
                        </tr>
                      </tbody>
                    </table>
                    {(v.notesTr || v.notesAr) && (
                      <div style={{ marginTop: 16, padding: 12, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, fontSize: 13, color: '#92400e', textAlign: 'left' }}>
                        <strong>NOTE:</strong><br />
                        {v.notesTr || v.notesAr}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transport Vouchers */}
      {transVouchers.length > 0 && (
        <div>
          <h2 className="text-lg font-black text-foreground mb-3 flex items-center gap-2">
            <Car className="w-5 h-5 text-violet-600" /> فاوتشرات المواصلات
          </h2>
          <div className="space-y-4">
            {transVouchers.map((v: any) => (
              <div key={v.id} className="bg-card rounded-2xl border border-border overflow-hidden">
                <div className="bg-blue-800 text-white px-5 py-3 flex items-center justify-between" dir="ltr">
                  <div className="text-left">
                    <p className="font-black text-base uppercase">TRANSPORTATION VOUCHER</p>
                    <p className="text-xs opacity-70 mt-0.5">Voucher No: {v.voucherCode}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => copyCode(v.voucherCode)} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors" title="Copy Code">
                      <Copy className="w-4 h-4" />
                    </button>
                    <button onClick={() => printVoucher(v.id)} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors" title="Print">
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div id={`voucher-${v.id}`} dir="ltr">
                  <div className="header" style={{ background: '#1e40af', color: 'white', padding: '16px 20px', textAlign: 'left' }}>
                    <h2 style={{ fontSize: 18, fontWeight: 900 }}>TRANSPORTATION VOUCHER</h2>
                    <p style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>Voucher No: {v.voucherCode} • Booking: {booking.referenceNumber}</p>
                  </div>
                  <div style={{ padding: 20, border: '1px solid #d1d5db', borderTop: 'none', textAlign: 'left' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <tbody>
                        <tr>
                          <th style={{ border: '1px solid #d1d5db', padding: '10px 14px', background: '#f1f5f9', textAlign: 'left', fontSize: 12, color: '#64748b', width: '30%' }}>Guest Name</th>
                          <td style={{ border: '1px solid #d1d5db', padding: '10px 14px', fontSize: 14, textAlign: 'left' }}>{v.guestNameTr || v.guestNameAr}</td>
                        </tr>
                        <tr>
                          <th style={{ border: '1px solid #d1d5db', padding: '10px 14px', background: '#f1f5f9', textAlign: 'left', fontSize: 12, color: '#64748b' }}>Details</th>
                          <td style={{ border: '1px solid #d1d5db', padding: '10px 14px', fontSize: 14, whiteSpace: 'pre-wrap', textAlign: 'left' }}>{(v.notesTr || v.notesAr || '').replace(/الخدمات المشمولة:\n/g, '')}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Services Vouchers */}
      {serviceVouchers.length > 0 && (
        <div>
          <h2 className="text-lg font-black text-foreground mb-3 flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-600" /> فاوتشر الخدمات
          </h2>
          <div className="space-y-4">
            {serviceVouchers.map((v: any) => {
              const parsedServices = (v.notesTr || v.notesAr || '').replace(/الخدمات المشمولة:\n/g, '').split('\n').filter((line: string) => line.trim().startsWith('•')).map((line: string) => {
                let date = '-'; let city = '-'; let name = line.replace(/^•\s*/, '').trim();
                const dateSplit = name.split(/\s+(?:—|-)\s+/);
                if (dateSplit.length > 1) { date = dateSplit.pop()?.trim() || '-'; name = dateSplit.join(' — ').trim(); }
                const cityMatch = name.match(/\s\(([^)]+)\)$/);
                if (cityMatch) { city = cityMatch[1].trim(); name = name.replace(/\s\(([^)]+)\)$/, '').trim(); }
                return { name, city, date };
              }).sort((a: any, b: any) => {
                if(a.date !== '-' && b.date !== '-') {
                  return a.date.split('-').reverse().join('-').localeCompare(b.date.split('-').reverse().join('-'));
                }
                return 0;
              });

              return (
              <div key={v.id} className="bg-card rounded-2xl border border-border overflow-hidden">
                <div className="bg-blue-800 text-white px-5 py-3 flex items-center justify-between" dir="ltr">
                  <div className="text-left">
                    <p className="font-black text-base uppercase">TOURS & SERVICES VOUCHER</p>
                    <p className="text-xs opacity-70 mt-0.5">Voucher No: {v.voucherCode}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => copyCode(v.voucherCode)} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors" title="Copy Code">
                      <Copy className="w-4 h-4" />
                    </button>
                    <button onClick={() => printVoucher(v.id)} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors" title="Print">
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div id={`voucher-${v.id}`} dir="ltr">
                  <div className="header" style={{ background: '#1e40af', color: 'white', padding: '16px 20px', textAlign: 'left' }}>
                    <h2 style={{ fontSize: 18, fontWeight: 900 }}>TOURS & SERVICES VOUCHER</h2>
                    <p style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>Voucher No: {v.voucherCode} • Booking: {booking.referenceNumber}</p>
                  </div>
                  <div style={{ padding: 20, border: '1px solid #d1d5db', borderTop: 'none', textAlign: 'left' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <tbody>
                        <tr>
                          <th style={{ border: '1px solid #d1d5db', padding: '10px 14px', background: '#f1f5f9', textAlign: 'left', fontSize: 12, color: '#64748b', width: '30%' }}>Guest Name</th>
                          <td style={{ border: '1px solid #d1d5db', padding: '10px 14px', fontSize: 14, textAlign: 'left' }}>{v.guestNameTr || v.guestNameAr}</td>
                        </tr>
                        <tr>
                          <th style={{ border: '1px solid #d1d5db', padding: '10px 14px', background: '#f1f5f9', textAlign: 'left', fontSize: 12, color: '#64748b' }}>Included Services</th>
                          <td style={{ border: '1px solid #d1d5db', padding: '0', fontSize: 14, textAlign: 'left' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                              <thead>
                                <tr style={{ borderBottom: '1px solid #d1d5db', background: '#f8fafc' }}>
                                  <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: 12, color: '#64748b', borderRight: '1px solid #d1d5db', width: '20%' }}>Date</th>
                                  <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: 12, color: '#64748b', borderRight: '1px solid #d1d5db', width: '25%' }}>City</th>
                                  <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: 12, color: '#64748b', width: '55%' }}>Service</th>
                                </tr>
                              </thead>
                              <tbody>
                                {parsedServices.map((ps: any, i: number) => (
                                  <tr key={i} style={{ borderBottom: i < parsedServices.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
                                    <td style={{ padding: '10px 14px', borderRight: '1px solid #e2e8f0', fontWeight: 'bold' }}>{ps.date}</td>
                                    <td style={{ padding: '10px 14px', borderRight: '1px solid #e2e8f0', color: '#64748b' }}>{ps.city}</td>
                                    <td style={{ padding: '10px 14px' }}>{ps.name}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )})}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="text-[11px] text-muted-foreground font-bold">{label}</p>
        <p className="text-base font-black text-foreground">{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: 'قيد الانتظار', cls: 'bg-yellow-100 text-yellow-700' },
    confirmed: { label: 'مؤكد', cls: 'bg-emerald-100 text-emerald-700' },
    cancelled: { label: 'ملغي', cls: 'bg-red-100 text-red-700' },
    completed: { label: 'مكتمل', cls: 'bg-blue-100 text-blue-700' },
  };
  const s = map[status] || { label: status, cls: 'bg-gray-100 text-gray-700' };
  return <span className={`${s.cls} px-3 py-1 rounded-full text-sm font-bold`}>{s.label}</span>;
}

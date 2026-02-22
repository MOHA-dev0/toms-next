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

  const fmt = (d?: string | null) => d ? format(new Date(d), 'dd/MM/yyyy') : '—';

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('تم نسخ رقم الفاوتشر');
  };

  const printVoucher = (voucherId: string) => {
    const el = document.getElementById(`voucher-${voucherId}`);
    if (!el) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`
      <html dir="rtl"><head>
        <meta charset="utf-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; padding: 20px; direction: rtl; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #d1d5db; padding: 10px 14px; text-align: right; }
          th { background: #f1f5f9; font-size: 12px; color: #64748b; }
          td { font-size: 14px; }
          .header { background: #1e40af; color: white; padding: 16px 20px; border-radius: 12px 12px 0 0; }
          .header h2 { font-size: 18px; font-weight: 900; }
          .header p { font-size: 12px; opacity: 0.8; margin-top: 4px; }
          .body { border: 1px solid #d1d5db; border-top: none; padding: 20px; border-radius: 0 0 12px 12px; }
          .notes { margin-top: 16px; padding: 12px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; font-size: 13px; color: #92400e; }
          @media print { body { padding: 0; } }
        </style>
      </head><body>${el.innerHTML}</body></html>
    `);
    w.document.close();
    setTimeout(() => { w.print(); }, 300);
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
      {hotelVouchers.length > 0 && (
        <div>
          <h2 className="text-lg font-black text-foreground mb-3 flex items-center gap-2">
            <Building className="w-5 h-5 text-blue-600" /> فاوتشرات الفنادق
          </h2>
          <div className="space-y-4">
            {hotelVouchers.map((v: any) => (
              <div key={v.id} className="bg-card rounded-2xl border border-border overflow-hidden">
                {/* Voucher header */}
                <div className="bg-blue-800 text-white px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="font-black text-base">{v.hotel?.nameTr || v.hotel?.nameAr || 'فندق'}</p>
                    <p className="text-xs opacity-70 mt-0.5">{v.hotel?.city?.nameAr} • {v.voucherCode}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => copyCode(v.voucherCode)} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors" title="نسخ الرقم">
                      <Copy className="w-4 h-4" />
                    </button>
                    <button onClick={() => printVoucher(v.id)} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors" title="طباعة">
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {/* Printable content */}
                <div id={`voucher-${v.id}`}>
                  <div className="header" style={{ background: '#1e40af', color: 'white', padding: '16px 20px' }}>
                    <h2 style={{ fontSize: 18, fontWeight: 900 }}>Otel Voucher — {v.hotel?.nameTr || v.hotel?.nameAr}</h2>
                    <p style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>Voucher No: {v.voucherCode} • Booking: {booking.referenceNumber}</p>
                  </div>
                  <div style={{ padding: 20, border: '1px solid #d1d5db', borderTop: 'none' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <tbody>
                        <tr>
                          <th style={{ border: '1px solid #d1d5db', padding: '10px 14px', background: '#f1f5f9', textAlign: 'right', fontSize: 12, color: '#64748b' }}>Misafir Adı / اسم الضيف</th>
                          <td style={{ border: '1px solid #d1d5db', padding: '10px 14px', fontSize: 14 }}>{v.guestNameTr || v.guestNameAr}</td>
                        </tr>
                        <tr>
                          <th style={{ border: '1px solid #d1d5db', padding: '10px 14px', background: '#f1f5f9', textAlign: 'right', fontSize: 12, color: '#64748b' }}>Otel / الفندق</th>
                          <td style={{ border: '1px solid #d1d5db', padding: '10px 14px', fontSize: 14 }}>{v.hotel?.nameTr || v.hotel?.nameAr}</td>
                        </tr>
                        <tr>
                          <th style={{ border: '1px solid #d1d5db', padding: '10px 14px', background: '#f1f5f9', textAlign: 'right', fontSize: 12, color: '#64748b' }}>Giriş / تسجيل الوصول</th>
                          <td style={{ border: '1px solid #d1d5db', padding: '10px 14px', fontSize: 14 }}>{fmt(v.checkIn)}</td>
                        </tr>
                        <tr>
                          <th style={{ border: '1px solid #d1d5db', padding: '10px 14px', background: '#f1f5f9', textAlign: 'right', fontSize: 12, color: '#64748b' }}>Çıkış / تسجيل المغادرة</th>
                          <td style={{ border: '1px solid #d1d5db', padding: '10px 14px', fontSize: 14 }}>{fmt(v.checkOut)}</td>
                        </tr>
                        <tr>
                          <th style={{ border: '1px solid #d1d5db', padding: '10px 14px', background: '#f1f5f9', textAlign: 'right', fontSize: 12, color: '#64748b' }}>Oda Tipi / نوع الغرفة</th>
                          <td style={{ border: '1px solid #d1d5db', padding: '10px 14px', fontSize: 14 }}>{v.roomTypeTr || v.roomTypeAr}</td>
                        </tr>
                        <tr>
                          <th style={{ border: '1px solid #d1d5db', padding: '10px 14px', background: '#f1f5f9', textAlign: 'right', fontSize: 12, color: '#64748b' }}>Konaklama / الإقامة</th>
                          <td style={{ border: '1px solid #d1d5db', padding: '10px 14px', fontSize: 14 }}>{v.boardTr || v.boardAr}</td>
                        </tr>
                      </tbody>
                    </table>
                    {(v.notesTr || v.notesAr) && (
                      <div style={{ marginTop: 16, padding: 12, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, fontSize: 13, color: '#92400e' }}>
                        <strong>Notlar / ملاحظات:</strong><br />
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
                <div className="bg-violet-800 text-white px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="font-black text-base">فاوتشر مواصلات</p>
                    <p className="text-xs opacity-70 mt-0.5">{v.voucherCode}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => copyCode(v.voucherCode)} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                      <Copy className="w-4 h-4" />
                    </button>
                    <button onClick={() => printVoucher(v.id)} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div id={`voucher-${v.id}`}>
                  <div style={{ background: '#6d28d9', color: 'white', padding: '16px 20px' }}>
                    <h2 style={{ fontSize: 18, fontWeight: 900 }}>Transportation Voucher</h2>
                    <p style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>Voucher No: {v.voucherCode} • Booking: {booking.referenceNumber}</p>
                  </div>
                  <div style={{ padding: 20, border: '1px solid #d1d5db', borderTop: 'none' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <tbody>
                        <tr>
                          <th style={{ border: '1px solid #d1d5db', padding: '10px 14px', background: '#f1f5f9', textAlign: 'right', fontSize: 12, color: '#64748b', width: '30%' }}>اسم الراكب</th>
                          <td style={{ border: '1px solid #d1d5db', padding: '10px 14px', fontSize: 14 }}>{v.guestNameAr}</td>
                        </tr>
                        <tr>
                          <th style={{ border: '1px solid #d1d5db', padding: '10px 14px', background: '#f1f5f9', textAlign: 'right', fontSize: 12, color: '#64748b' }}>التفاصيل</th>
                          <td style={{ border: '1px solid #d1d5db', padding: '10px 14px', fontSize: 14, whiteSpace: 'pre-wrap' }}>{v.notesAr}</td>
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
            {serviceVouchers.map((v: any) => (
              <div key={v.id} className="bg-card rounded-2xl border border-border overflow-hidden">
                <div className="bg-emerald-700 text-white px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="font-black text-base">فاوتشر الخدمات والجولات</p>
                    <p className="text-xs opacity-70 mt-0.5">{v.voucherCode}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => copyCode(v.voucherCode)} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                      <Copy className="w-4 h-4" />
                    </button>
                    <button onClick={() => printVoucher(v.id)} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div id={`voucher-${v.id}`}>
                  <div style={{ background: '#047857', color: 'white', padding: '16px 20px' }}>
                    <h2 style={{ fontSize: 18, fontWeight: 900 }}>فاوتشر الخدمات والجولات</h2>
                    <p style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>Voucher No: {v.voucherCode} • Booking: {booking.referenceNumber}</p>
                  </div>
                  <div style={{ padding: 20, border: '1px solid #d1d5db', borderTop: 'none' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <tbody>
                        <tr>
                          <th style={{ border: '1px solid #d1d5db', padding: '10px 14px', background: '#f1f5f9', textAlign: 'right', fontSize: 12, color: '#64748b', width: '30%' }}>اسم الضيف</th>
                          <td style={{ border: '1px solid #d1d5db', padding: '10px 14px', fontSize: 14 }}>{v.guestNameAr}</td>
                        </tr>
                        <tr>
                          <th style={{ border: '1px solid #d1d5db', padding: '10px 14px', background: '#f1f5f9', textAlign: 'right', fontSize: 12, color: '#64748b' }}>الخدمات</th>
                          <td style={{ border: '1px solid #d1d5db', padding: '10px 14px', fontSize: 14, whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>{v.notesAr}</td>
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

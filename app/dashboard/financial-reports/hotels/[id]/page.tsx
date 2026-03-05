"use client"
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowRight, Building, CalendarDays, DollarSign, TrendingUp, TrendingDown, Hash, Download, Bed } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ChevronRight, ChevronLeft } from 'lucide-react';

// ── Types ──
interface HotelDetailBooking {
  quotationHotelId: string;
  quotationId: string;
  referenceNumber: string;
  channel: string;
  agency: string;
  sales: string;
  voucherNo: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  roomsCount: number;
  room: string;
  roomTypeSpecification: string;
  board: string;
  adults: number;
  child: number;
  totalPax: number;
  cost: number;
  totalCost: number;
  salePrice: number;
  totalSale: number;
  note: string;
  names: string;
  originalCurrency: string;
}

interface HotelDetailData {
  hotel: {
    id: string;
    nameAr: string;
    cityName: string;
    stars: number | null;
  };
  bookings: HotelDetailBooking[];
  summary: {
    totalBookings: number;
    totalNights: number;
    totalRooms: number;
    totalPurchase: number;
    totalSelling: number;
  };
  pagination: {
    totalRecords: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  };
}

type ViewMode = 'revenue' | 'cost_profit';

const usageLabels: Record<string, string> = { sgl: 'مفرد', dbl: 'مزدوج', tpl: 'ثلاثي', quad: 'رباعي' };
const boardLabels: Record<string, string> = { ro: 'بدون', bb: 'إفطار', hb: 'نصف إقامة', fb: 'إقامة كاملة', ai: 'شامل' };

export default function HotelDetailReportPage() {
  const router = useRouter();
  const params = useParams();
  const hotelId = params.id as string;

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('cost_profit');
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const { data, isLoading, isError, refetch } = useQuery<HotelDetailData>({
    queryKey: ['hotelDetailReport', hotelId, dateFrom, dateTo, page],
    queryFn: async () => {
      const fromParam = dateFrom ? `&from=${dateFrom}` : '';
      const toParam = dateTo ? `&to=${dateTo}` : '';
      const res = await fetch(`/api/financial-reports/hotels/${hotelId}?page=${page}&pageSize=${pageSize}${fromParam}${toParam}`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(amount);
  };

  const hotel = data?.hotel;
  const bookings = data?.bookings || [];
  const summary = data?.summary || { totalBookings: 0, totalNights: 0, totalRooms: 0, totalPurchase: 0, totalSelling: 0 };
  const pagination = data?.pagination || { totalRecords: 0, totalPages: 1, currentPage: 1, pageSize: 25 };

  const handleExportExcel = () => {
    if (!bookings.length) return;
    const fromParam = dateFrom ? `&from=${dateFrom}` : '';
    const toParam = dateTo ? `&to=${dateTo}` : '';
    window.location.href = `/api/financial-reports/hotels/${hotelId}?export=excel${fromParam}${toParam}`;
  };

  return (
    <div className="p-4 sm:p-8 w-full min-h-screen bg-[#f8f9fc] space-y-6 font-sans" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/dashboard/financial-reports')}
            className="gap-1.5 bg-white text-slate-600 border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:bg-slate-50 transition-all font-semibold"
          >
            <ArrowRight size={16} />
            رجوع
          </Button>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-800 flex items-center gap-2">
              <Building className="w-6 h-6 text-indigo-600" />
              {isLoading ? '...' : hotel?.nameAr || 'تقرير الفندق'}
            </h1>
            <p className="text-slate-500 text-sm font-medium mt-0.5">
              {hotel?.cityName} {hotel?.stars ? `· ${'★'.repeat(hotel.stars)}` : ''}
              {' '}— التقرير المالي التفصيلي
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            disabled={bookings.length === 0}
            className="gap-2 bg-white text-slate-600 border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:bg-slate-50 transition-all font-semibold disabled:opacity-40"
          >
            <Download size={14} /> تصدير Excel
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <Card className="bg-white border-0 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] rounded-2xl overflow-hidden transition-all hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)]">
          <CardContent className="p-4 flex flex-col items-center justify-center pt-5 pb-5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-full mb-2"><Hash size={18} /></div>
            <div className="text-2xl font-black text-slate-700">{summary.totalBookings}</div>
            <div className="text-xs font-bold text-slate-400">الحجوزات</div>
          </CardContent>
        </Card>
        <Card className="bg-white border-0 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] rounded-2xl overflow-hidden transition-all hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)]">
          <CardContent className="p-4 flex flex-col items-center justify-center pt-5 pb-5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-full mb-2"><CalendarDays size={18} /></div>
            <div className="text-2xl font-black text-slate-700">{summary.totalNights}</div>
            <div className="text-xs font-bold text-slate-400">الليالي</div>
          </CardContent>
        </Card>
        <Card className="bg-white border-0 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] rounded-2xl overflow-hidden transition-all hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)]">
          <CardContent className="p-4 flex flex-col items-center justify-center pt-5 pb-5">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-full mb-2"><Bed size={18} /></div>
            <div className="text-2xl font-black text-slate-700">{summary.totalRooms}</div>
            <div className="text-xs font-bold text-slate-400">الغرف</div>
          </CardContent>
        </Card>
        <Card className="bg-white border-0 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] rounded-2xl overflow-hidden transition-all hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)]">
          <CardContent className="p-4 flex flex-col items-center justify-center pt-5 pb-5">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-full mb-2"><TrendingDown size={18} /></div>
            <div className="text-xl font-black text-rose-600">{formatCurrency(summary.totalPurchase)}</div>
            <div className="text-xs font-bold text-rose-400">تكلفة الشراء</div>
          </CardContent>
        </Card>
        <Card className="bg-white border-0 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] rounded-2xl overflow-hidden transition-all hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)]">
          <CardContent className="p-4 flex flex-col items-center justify-center pt-5 pb-5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-full mb-2"><DollarSign size={18} /></div>
            <div className="text-xl font-black text-blue-600">{formatCurrency(summary.totalSelling)}</div>
            <div className="text-xs font-bold text-blue-400">إجمالي البيع</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & View Mode */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-3">
        {/* Date Range */}
        <div className="flex flex-wrap items-center gap-3 p-1 bg-white/60 backdrop-blur-md border border-slate-200/60 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] rounded-xl w-fit">
          <span className="text-xs font-bold text-slate-400 px-2 flex items-center gap-1.5"><CalendarDays size={13} /> الفترة</span>
          <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className="bg-white text-xs font-medium text-slate-700 rounded-lg px-2.5 py-1.5 border border-slate-200 outline-none focus:border-blue-300 transition-all w-[130px]" />
          <span className="text-slate-300 text-xs">—</span>
          <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className="bg-white text-xs font-medium text-slate-700 rounded-lg px-2.5 py-1.5 border border-slate-200 outline-none focus:border-blue-300 transition-all w-[130px]" />
          {(dateFrom || dateTo) && (
            <button onClick={() => { setDateFrom(''); setDateTo(''); setPage(1); }}
              className="text-xs text-rose-500 hover:text-rose-700 font-bold px-2 py-1 rounded-lg hover:bg-rose-50 transition-all">✕</button>
          )}
        </div>

        {/* View Mode Toggle */}
        <div className="flex p-1 bg-white/60 backdrop-blur-md border border-slate-200/60 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] rounded-xl gap-1">
          <button
            onClick={() => setViewMode('cost_profit')}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap",
              viewMode === 'cost_profit' ? "bg-white text-slate-900 shadow-sm ring-1 ring-black/5" : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
            )}>
            تكلفة / ربح
          </button>
          <button
            onClick={() => setViewMode('revenue')}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap",
              viewMode === 'revenue' ? "bg-white text-slate-900 shadow-sm ring-1 ring-black/5" : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
            )}>
            إيرادات فقط
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex flex-col p-4">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex items-center space-x-4 space-x-reverse animate-pulse">
                  <div className="h-12 bg-slate-100 rounded-lg w-full"></div>
                </div>
              ))}
            </div>
          </div>
        ) : isError ? (
          <div className="p-24 text-center flex flex-col items-center justify-center text-rose-400 flex-1">
            <p className="font-bold text-xl text-rose-600 mb-2">خطأ في التحميل</p>
            <p className="text-sm text-slate-400 font-medium mb-4">حدث خطأ أثناء تحميل التقرير.</p>
            <Button onClick={() => refetch()} variant="outline" className="gap-2">إعادة المحاولة</Button>
          </div>
        ) : bookings.length === 0 ? (
          <div className="p-24 text-center flex flex-col items-center justify-center text-slate-400 flex-1">
            <div className="bg-slate-50 p-6 rounded-full mb-4 ring-1 ring-slate-100 shadow-sm"><Building className="h-10 w-10 text-slate-300" strokeWidth={1.5} /></div>
            <p className="font-black text-xl text-slate-700 mb-2">لا توجد حجوزات لهذا الفندق</p>
            {(dateFrom || dateTo) && <p className="text-sm text-slate-400">جرّب تغيير نطاق التاريخ</p>}
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 border-b border-slate-100 hover:bg-slate-50">
                    <TableHead className="text-right text-slate-500 font-semibold max-w-[50px]">#</TableHead>
                    <TableHead className="text-right text-slate-500 font-semibold min-w-[110px]">المرجع</TableHead>
                    <TableHead className="text-right text-slate-500 font-semibold">العميل</TableHead>
                    <TableHead className="text-right text-slate-500 font-semibold">الدخول</TableHead>
                    <TableHead className="text-right text-slate-500 font-semibold">الخروج</TableHead>
                    <TableHead className="text-right text-slate-500 font-semibold">الليالي</TableHead>
                    <TableHead className="text-right text-slate-500 font-semibold">الغرف</TableHead>
                    <TableHead className="text-right text-slate-500 font-semibold">نوع الغرفة</TableHead>
                    <TableHead className="text-right text-slate-500 font-semibold">الاستخدام</TableHead>
                    <TableHead className="text-right text-slate-500 font-semibold">الإقامة</TableHead>
                    {viewMode === 'cost_profit' ? (
                      <>
                        <TableHead className="text-right text-slate-500 font-semibold">سعر الشراء</TableHead>
                        <TableHead className="text-right text-slate-500 font-semibold">سعر البيع</TableHead>
                      </>
                    ) : (
                      <TableHead className="text-right text-slate-500 font-semibold">الإيرادات</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((b, idx) => (
                    <TableRow key={b.quotationHotelId} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-medium text-slate-500">{idx + 1}</TableCell>
                      <TableCell className="font-bold text-[#25396f]">{b.referenceNumber}</TableCell>
                      <TableCell className="font-medium text-slate-700">{b.names?.substring(0,25) || '-'}</TableCell>
                      <TableCell className="text-slate-600 text-xs">{format(new Date(b.checkIn), 'dd/MM/yyyy')}</TableCell>
                      <TableCell className="text-slate-600 text-xs">{format(new Date(b.checkOut), 'dd/MM/yyyy')}</TableCell>
                      <TableCell className="font-bold text-slate-700">{b.nights}</TableCell>
                      <TableCell className="font-bold text-slate-700">{b.roomsCount}</TableCell>
                      <TableCell className="text-slate-600 text-sm">{b.room}</TableCell>
                      <TableCell className="text-slate-600 text-sm">{usageLabels[b.roomTypeSpecification] || b.roomTypeSpecification}</TableCell>
                      <TableCell className="text-slate-600 text-sm">{boardLabels[b.board] || b.board}</TableCell>
                      {viewMode === 'cost_profit' ? (
                        <>
                          <TableCell className="font-bold text-rose-600">
                            <div dir="ltr" className="text-right flex flex-col items-end">
                              {b.originalCurrency !== 'USD' ? (
                                <>
                                  <span className="text-rose-700">{Number(b.cost).toLocaleString(undefined, { maximumFractionDigits: 2 })} <span className="text-xs">{b.originalCurrency}</span></span>
                                  <span className="text-[10px] text-rose-400 font-medium">({formatCurrency(b.totalCost)})</span>
                                </>
                              ) : (
                                <span>{formatCurrency(b.totalCost)}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-bold text-blue-600">{formatCurrency(b.totalSale)}</TableCell>
                        </>
                      ) : (
                        <TableCell className="font-bold text-blue-600">{formatCurrency(b.totalSale)}</TableCell>
                      )}
                    </TableRow>
                  ))}

                  {/* Totals Row */}
                  <TableRow className="bg-slate-50 border-t-2 border-slate-200 hover:bg-slate-50 font-black">
                    <TableCell colSpan={5} className="text-right text-slate-800 font-black text-sm">المجموع</TableCell>
                    <TableCell className="font-black text-slate-800">{summary.totalNights}</TableCell>
                    <TableCell className="font-black text-slate-800">{summary.totalRooms}</TableCell>
                    <TableCell colSpan={3}></TableCell>
                    {viewMode === 'cost_profit' ? (
                      <>
                        <TableCell className="font-black text-rose-700">{formatCurrency(summary.totalPurchase)}</TableCell>
                        <TableCell className="font-black text-blue-700">{formatCurrency(summary.totalSelling)}</TableCell>
                      </>
                    ) : (
                      <TableCell className="font-black text-blue-700">{formatCurrency(summary.totalSelling)}</TableCell>
                    )}
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            
            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-slate-100">
                <div className="text-sm text-slate-500 font-medium">
                  إجمالي الحجوزات: <span className="font-bold text-slate-700">{pagination.totalRecords}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium text-slate-600 min-w-[3rem] text-center">
                    {page} / {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                    disabled={page === pagination.totalPages}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

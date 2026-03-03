"use client"
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, TrendingUp, TrendingDown, DollarSign, Building, Hash, Briefcase, Users, CalendarDays, Search } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

// ── Types ──

interface FinancialItem {
  id: string;
  referenceNumber: string;
  customerName: string;
  salesEmployeeName: string;
  status: string;
  date: string;
  totalPrice: number;
  paidAmount: number;
  remainingAmount: number;
  paymentMethod?: string;
}

interface FinancialData {
  data: FinancialItem[];
  summary: { totalAmount: number; totalPaid: number; totalRemaining: number; }
  meta: { totalCount: number; page: number; limit: number; pageCount: number; }
}

interface HotelFinancialItem {
  id: string;
  hotelName: string;
  cityName: string;
  bookingsCount: number;
  totalNights: number;
  totalPurchaseAmount: number;
  totalSellingAmount: number;
  totalProfit: number;
}

interface HotelFinancialData {
  data: HotelFinancialItem[];
  summary: { totalHotels: number; totalBookings: number; totalPurchaseAmount: number; totalSellingAmount: number; totalProfit: number; }
  meta: { totalCount: number; page: number; limit: number; pageCount: number; }
}

interface AgentFinancialItem {
  id: string;
  agentName: string;
  customersCount: number;
  quotationsCount: number;
  totalSellingAmount: number;
}

interface AgentFinancialData {
  data: AgentFinancialItem[];
  summary: { totalAgents: number; totalCustomers: number; totalQuotations: number; totalSellingAmount: number; }
  meta: { totalCount: number; page: number; limit: number; pageCount: number; }
}

type TabId = 'confirmed' | 'hotels' | 'agents';
type SourceFilter = 'all' | 'b2b' | 'b2c';

export default function FinancialReportsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<TabId>('confirmed');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [hotelDateFrom, setHotelDateFrom] = useState('');
  const [hotelDateTo, setHotelDateTo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hotelPage, setHotelPage] = useState(1);
  const [agentPage, setAgentPage] = useState(1);
  const limit = 10;

  // ── Quotation financial data ──
  const { data, isLoading, isError, refetch } = useQuery<FinancialData>({
    queryKey: ['financialReports', filter, page, sourceFilter, dateFrom, dateTo, searchQuery],
    queryFn: async () => {
      const sourceParam = sourceFilter !== 'all' ? `&source=${sourceFilter}` : '';
      const fromParam = dateFrom ? `&from=${dateFrom}` : '';
      const toParam = dateTo ? `&to=${dateTo}` : '';
      const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : '';
      const res = await fetch(`/api/financial-reports?filter=${filter}&page=${page}&limit=${limit}${sourceParam}${fromParam}${toParam}${searchParam}`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    enabled: filter === 'confirmed',
  });

  // ── Hotel financial data ──
  const { data: hotelData, isLoading: hotelLoading, isError: hotelError, refetch: hotelRefetch } = useQuery<HotelFinancialData>({
    queryKey: ['hotelFinancialReports', hotelPage, hotelDateFrom, hotelDateTo],
    queryFn: async () => {
      const fromParam = hotelDateFrom ? `&from=${hotelDateFrom}` : '';
      const toParam = hotelDateTo ? `&to=${hotelDateTo}` : '';
      const res = await fetch(`/api/financial-reports/hotels?page=${hotelPage}&limit=${limit}${fromParam}${toParam}`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    enabled: filter === 'hotels',
  });

  // ── Agent financial data ──
  const { data: agentData, isLoading: agentLoading, isError: agentError, refetch: agentRefetch } = useQuery<AgentFinancialData>({
    queryKey: ['agentFinancialReports', agentPage],
    queryFn: async () => {
      const res = await fetch(`/api/financial-reports/agents?page=${agentPage}&limit=${limit}`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    enabled: filter === 'agents',
  });

  const summary = data?.summary || { totalAmount: 0, totalPaid: 0, totalRemaining: 0 };
  const items = data?.data || [];
  const meta = data?.meta || { totalCount: 0, page: 1, limit: 10, pageCount: 1 };

  const hotelSummary = hotelData?.summary || { totalHotels: 0, totalBookings: 0, totalPurchaseAmount: 0, totalSellingAmount: 0, totalProfit: 0 };
  const hotelItems = hotelData?.data || [];
  const hotelMeta = hotelData?.meta || { totalCount: 0, page: 1, limit: 10, pageCount: 1 };

  const agentSummary = agentData?.summary || { totalAgents: 0, totalCustomers: 0, totalQuotations: 0, totalSellingAmount: 0 };
  const agentItems = agentData?.data || [];
  const agentMeta = agentData?.meta || { totalCount: 0, page: 1, limit: 10, pageCount: 1 };

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'confirmed', label: 'مؤكد (الحجوزات)', icon: null },
    { id: 'hotels', label: 'الفنادق', icon: <Building className="inline-block w-4 h-4 ml-1.5 -mt-0.5" /> },
    { id: 'agents', label: 'الوكلاء', icon: <Briefcase className="inline-block w-4 h-4 ml-1.5 -mt-0.5" /> },
  ];

  const sourceOptions: { id: SourceFilter; label: string }[] = [
    { id: 'all', label: 'الكل' },
    { id: 'b2c', label: 'أفراد (B2C)' },
    { id: 'b2b', label: 'شركات (B2B)' },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(amount);
  };

  // ── Shared pagination renderer ──
  const renderPagination = (
    currentMeta: { page: number; pageCount: number },
    setPageFn: (fn: (p: number) => number) => void,
    setPageDirect: (p: number) => void
  ) => {
    if (currentMeta.pageCount <= 1) return null;
    return (
      <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/30">
        <p className="text-sm font-medium text-slate-500">
          عرض صفحة <span className="font-bold text-slate-700">{currentMeta.page}</span> من <span className="font-bold text-slate-700">{currentMeta.pageCount}</span>
        </p>
        <div className="flex gap-1" dir="rtl">
          <Button variant="outline" size="sm" className="border-transparent text-slate-500 hover:text-slate-700 hover:bg-white hover:border-slate-200"
            onClick={() => setPageFn(p => Math.max(1, p - 1))} disabled={currentMeta.page === 1}>السابق</Button>
          {Array.from({ length: currentMeta.pageCount }).map((_, idx) => {
            const pageNum = idx + 1;
            if (currentMeta.pageCount > 5 && Math.abs(currentMeta.page - pageNum) > 1 && pageNum !== 1 && pageNum !== currentMeta.pageCount) {
              if (pageNum === 2 || pageNum === currentMeta.pageCount - 1) return <span key={pageNum} className="px-2 self-end text-slate-400">...</span>;
              return null;
            }
            return (
              <Button key={pageNum} variant={currentMeta.page === pageNum ? 'default' : 'outline'} size="sm"
                className={cn("h-8 min-w-8 font-bold border-transparent transition-all",
                  currentMeta.page === pageNum ? "bg-[#25396f] text-white shadow-sm" : "bg-transparent text-slate-500 hover:text-slate-700 hover:bg-white hover:border-slate-200"
                )} onClick={() => setPageDirect(pageNum)}>{pageNum}</Button>
            );
          })}
          <Button variant="outline" size="sm" className="border-transparent text-slate-500 hover:text-slate-700 hover:bg-white hover:border-slate-200"
            onClick={() => setPageFn(p => Math.min(currentMeta.pageCount, p + 1))} disabled={currentMeta.page === currentMeta.pageCount}>التالي</Button>
        </div>
      </div>
    );
  };

  // ── Shared skeleton/error/empty states ──
  const renderSkeleton = () => (
    <div className="flex-1 flex flex-col">
      <div className="overflow-x-auto flex-1 p-4">
        <div className="space-y-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex items-center space-x-4 space-x-reverse animate-pulse">
              <div className="h-12 bg-slate-100 rounded-lg w-full"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderError = (retryFn: () => void) => (
    <div className="p-24 text-center flex flex-col items-center justify-center text-rose-400 flex-1">
      <p className="font-bold text-xl text-rose-600 mb-2">خطأ في التحميل</p>
      <p className="text-sm text-slate-400 font-medium mb-4">حدث خطأ أثناء تحميل التقارير.</p>
      <Button onClick={retryFn} variant="outline" className="gap-2">إعادة المحاولة</Button>
    </div>
  );

  const renderEmpty = (icon: React.ReactNode, message: string) => (
    <div className="p-24 text-center flex flex-col items-center justify-center text-slate-400 flex-1">
      <div className="bg-slate-50 p-6 rounded-full mb-4 ring-1 ring-slate-100 shadow-sm">{icon}</div>
      <p className="font-black text-xl text-slate-700 mb-2">{message}</p>
    </div>
  );

  return (
    <div className="p-4 sm:p-8 w-full min-h-screen bg-[#f8f9fc] space-y-8 font-sans" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="text-right">
          <h1 className="text-3xl font-black tracking-tight text-slate-800 mb-1">التقارير المالية</h1>
          <p className="text-slate-500 text-sm font-medium">متابعة المبالغ المستحقة والواردة</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <Button variant="outline" className="flex-1 md:flex-none gap-2 bg-white text-slate-600 border-slate-200 h-10 rounded-xl shadow-sm hover:shadow-md hover:bg-slate-50 transition-all font-semibold justify-center">
            تصدير <Download size={16} />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {filter === 'confirmed' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <Card className="bg-white border-0 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] rounded-2xl overflow-hidden group transition-all hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)]">
            <CardContent className="p-6 flex flex-col items-center justify-center pt-8 pb-8">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-full mb-4"><DollarSign size={24} /></div>
              <div className="text-3xl font-black text-slate-700 mb-2">{formatCurrency(summary.totalAmount)}</div>
              <div className="text-sm font-bold text-slate-400">المجموع الكلي</div>
            </CardContent>
          </Card>
          <Card className="bg-white border-0 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] rounded-2xl overflow-hidden group transition-all hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)]">
            <CardContent className="p-6 flex flex-col items-center justify-center pt-8 pb-8">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full mb-4"><TrendingUp size={24} /></div>
              <div className="text-3xl font-black text-emerald-600 mb-2">{formatCurrency(summary.totalPaid)}</div>
              <div className="text-sm font-bold text-emerald-700/60">الوارد (المدفوع)</div>
            </CardContent>
          </Card>
          <Card className="bg-white border-0 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] rounded-2xl overflow-hidden group transition-all hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)]">
            <CardContent className="p-6 flex flex-col items-center justify-center pt-8 pb-8">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-full mb-4"><TrendingDown size={24} /></div>
              <div className="text-3xl font-black text-rose-600 mb-2">{formatCurrency(summary.totalRemaining)}</div>
              <div className="text-sm font-bold text-rose-700/60">النقص (المتبقي)</div>
            </CardContent>
          </Card>
        </div>
      )}

      {filter === 'hotels' && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 sm:gap-5">
          <Card className="bg-white border-0 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] rounded-2xl overflow-hidden group transition-all hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)]">
            <CardContent className="p-5 flex flex-col items-center justify-center pt-6 pb-6">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full mb-3"><Building size={22} /></div>
              <div className="text-2xl font-black text-slate-700 mb-1">{hotelSummary.totalHotels}</div>
              <div className="text-xs font-bold text-slate-400">الفنادق</div>
            </CardContent>
          </Card>
          <Card className="bg-white border-0 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] rounded-2xl overflow-hidden group transition-all hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)]">
            <CardContent className="p-5 flex flex-col items-center justify-center pt-6 pb-6">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-full mb-3"><Hash size={22} /></div>
              <div className="text-2xl font-black text-slate-700 mb-1">{hotelSummary.totalBookings}</div>
              <div className="text-xs font-bold text-slate-400">الحجوزات</div>
            </CardContent>
          </Card>
          <Card className="bg-white border-0 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] rounded-2xl overflow-hidden group transition-all hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)]">
            <CardContent className="p-5 flex flex-col items-center justify-center pt-6 pb-6">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-full mb-3"><TrendingDown size={22} /></div>
              <div className="text-2xl font-black text-rose-600 mb-1">{formatCurrency(hotelSummary.totalPurchaseAmount)}</div>
              <div className="text-xs font-bold text-rose-400">تكلفة الشراء</div>
            </CardContent>
          </Card>
          <Card className="bg-white border-0 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] rounded-2xl overflow-hidden group transition-all hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)]">
            <CardContent className="p-5 flex flex-col items-center justify-center pt-6 pb-6">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-full mb-3"><DollarSign size={22} /></div>
              <div className="text-2xl font-black text-blue-600 mb-1">{formatCurrency(hotelSummary.totalSellingAmount)}</div>
              <div className="text-xs font-bold text-blue-400">إجمالي البيع</div>
            </CardContent>
          </Card>
          <Card className="bg-white border-0 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] rounded-2xl overflow-hidden group transition-all hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)]">
            <CardContent className="p-5 flex flex-col items-center justify-center pt-6 pb-6">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full mb-3"><TrendingUp size={22} /></div>
              <div className="text-2xl font-black text-emerald-600 mb-1">{formatCurrency(hotelSummary.totalProfit)}</div>
              <div className="text-xs font-bold text-emerald-400">الربح</div>
            </CardContent>
          </Card>
        </div>
      )}

      {filter === 'agents' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card className="bg-white border-0 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] rounded-2xl overflow-hidden group transition-all hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)]">
            <CardContent className="p-6 flex flex-col items-center justify-center pt-8 pb-8">
              <div className="p-3 bg-violet-50 text-violet-600 rounded-full mb-4"><Briefcase size={24} /></div>
              <div className="text-3xl font-black text-slate-700 mb-2">{agentSummary.totalAgents}</div>
              <div className="text-sm font-bold text-slate-400">وكلاء نشطين</div>
            </CardContent>
          </Card>
          <Card className="bg-white border-0 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] rounded-2xl overflow-hidden group transition-all hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)]">
            <CardContent className="p-6 flex flex-col items-center justify-center pt-8 pb-8">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-full mb-4"><Users size={24} /></div>
              <div className="text-3xl font-black text-slate-700 mb-2">{agentSummary.totalCustomers}</div>
              <div className="text-sm font-bold text-slate-400">إجمالي العملاء</div>
            </CardContent>
          </Card>
          <Card className="bg-white border-0 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] rounded-2xl overflow-hidden group transition-all hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)]">
            <CardContent className="p-6 flex flex-col items-center justify-center pt-8 pb-8">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full mb-4"><Hash size={24} /></div>
              <div className="text-3xl font-black text-slate-700 mb-2">{agentSummary.totalQuotations}</div>
              <div className="text-sm font-bold text-slate-400">إجمالي الحجوزات</div>
            </CardContent>
          </Card>
          <Card className="bg-white border-0 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] rounded-2xl overflow-hidden group transition-all hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)]">
            <CardContent className="p-6 flex flex-col items-center justify-center pt-8 pb-8">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full mb-4"><DollarSign size={24} /></div>
              <div className="text-3xl font-black text-emerald-600 mb-2">{formatCurrency(agentSummary.totalSellingAmount)}</div>
              <div className="text-sm font-bold text-emerald-700/60">إجمالي المبالغ</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs + Source Filter */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex flex-wrap w-full md:w-auto p-1 bg-white/60 backdrop-blur-md border border-slate-200/60 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] rounded-xl gap-1">
          {tabs.map(tab => (
            <button key={tab.id}
              onClick={() => { setFilter(tab.id); setPage(1); setHotelPage(1); setAgentPage(1); }}
              className={cn(
                "px-5 py-2 rounded-lg text-sm font-bold transition-all flex-1 md:flex-none whitespace-nowrap",
                filter === tab.id ? "bg-white text-slate-900 shadow-sm ring-1 ring-black/5" : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
              )}>
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>

        {filter === 'confirmed' && (
          <div className="flex flex-wrap p-1 bg-white/60 backdrop-blur-md border border-slate-200/60 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] rounded-xl gap-1">
            {sourceOptions.map(opt => (
              <button key={opt.id}
                onClick={() => { setSourceFilter(opt.id); setPage(1); }}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap",
                  sourceFilter === opt.id ? "bg-white text-slate-900 shadow-sm ring-1 ring-black/5" : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
                )}>
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Date Range + Search — only on Confirmed tab */}
      {filter === 'confirmed' && (
        <div className="flex flex-wrap items-center justify-between gap-3">
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
          <div className="relative">
            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              placeholder="بحث بالمرجع، العميل، الموظف..."
              className="bg-white/60 backdrop-blur-md text-xs font-medium text-slate-700 border border-slate-200/60 rounded-xl pr-9 pl-3 py-1.5 outline-none focus:border-blue-300 transition-all w-[220px] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] placeholder:text-slate-400"
            />
          </div>
        </div>
      )}

      {/* Date Range — Hotels tab */}
      {filter === 'hotels' && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap items-center gap-3 p-1 bg-white/60 backdrop-blur-md border border-slate-200/60 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] rounded-xl w-fit">
            <span className="text-xs font-bold text-slate-400 px-2 flex items-center gap-1.5"><CalendarDays size={13} /> فترة الحجز</span>
            <input type="date" value={hotelDateFrom} onChange={(e) => { setHotelDateFrom(e.target.value); setHotelPage(1); }}
              className="bg-white text-xs font-medium text-slate-700 rounded-lg px-2.5 py-1.5 border border-slate-200 outline-none focus:border-blue-300 transition-all w-[130px]" />
            <span className="text-slate-300 text-xs">—</span>
            <input type="date" value={hotelDateTo} onChange={(e) => { setHotelDateTo(e.target.value); setHotelPage(1); }}
              className="bg-white text-xs font-medium text-slate-700 rounded-lg px-2.5 py-1.5 border border-slate-200 outline-none focus:border-blue-300 transition-all w-[130px]" />
            {(hotelDateFrom || hotelDateTo) && (
              <button onClick={() => { setHotelDateFrom(''); setHotelDateTo(''); setHotelPage(1); }}
                className="text-xs text-rose-500 hover:text-rose-700 font-bold px-2 py-1 rounded-lg hover:bg-rose-50 transition-all">✕</button>
            )}
          </div>
        </div>
      )}
      {/* ═══════════ CONFIRMED TAB ═══════════ */}
      {filter === 'confirmed' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col">
          {isLoading ? renderSkeleton() : isError ? renderError(() => refetch()) : items.length === 0
            ? renderEmpty(<FileText className="h-10 w-10 text-slate-300" strokeWidth={1.5} />, 'لا يوجد بيانات مالية')
            : (
            <div className="flex-1 flex flex-col">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 border-b border-slate-100 hover:bg-slate-50">
                      <TableHead className="text-right text-slate-500 font-semibold max-w-[50px]">#</TableHead>
                      <TableHead className="text-right text-slate-500 font-semibold min-w-[120px]">المرجع</TableHead>
                      <TableHead className="text-right text-slate-500 font-semibold">العميل</TableHead>
                      <TableHead className="text-right text-slate-500 font-semibold">موظف المبيعات</TableHead>
                      <TableHead className="text-right text-slate-500 font-semibold">تاريخ الإنشاء</TableHead>
                      <TableHead className="text-right text-slate-500 font-semibold">الحالة</TableHead>
                      <TableHead className="text-right text-slate-500 font-semibold">طريقة الدفع</TableHead>
                      <TableHead className="text-right text-slate-500 font-semibold">المجموع الكلي</TableHead>
                      <TableHead className="text-right text-slate-500 font-semibold">المدفوع</TableHead>
                      <TableHead className="text-right text-slate-500 font-semibold">النقص (المتبقي)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <TableCell className="font-medium text-slate-500">{(meta.page - 1) * meta.limit + index + 1}</TableCell>
                        <TableCell className="font-bold text-[#25396f]">{item.referenceNumber}</TableCell>
                        <TableCell className="font-medium text-slate-700">{item.customerName}</TableCell>
                        <TableCell className="text-slate-600">{item.salesEmployeeName}</TableCell>
                        <TableCell className="text-slate-600">{format(new Date(item.date), 'dd-MM-yyyy')}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("font-medium shadow-none",
                            item.status === 'confirmed' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                            item.status === 'draft' ? "bg-slate-50 text-slate-700 border-slate-200" :
                            "bg-orange-50 text-orange-700 border-orange-200")}>
                            {item.status === 'confirmed' ? 'مؤكد' : item.status === 'draft' ? 'مسودة' : item.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-600 font-medium">
                          <Badge variant="secondary" className="font-normal bg-slate-100 text-slate-700 hover:bg-slate-100 border-none">
                            {item.paymentMethod || 'غير متوفر'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-bold text-slate-700">{formatCurrency(item.totalPrice)}</TableCell>
                        <TableCell className="font-bold text-emerald-600">{formatCurrency(item.paidAmount)}</TableCell>
                        <TableCell className="font-bold text-rose-600">
                          {item.remainingAmount > 0 ? formatCurrency(item.remainingAmount) : <span className="text-slate-400 font-normal">0</span>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {renderPagination(meta, setPage, setPage)}
            </div>
          )}
        </div>
      )}

      {/* ═══════════ HOTELS TAB ═══════════ */}
      {filter === 'hotels' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col">
          {hotelLoading ? renderSkeleton() : hotelError ? renderError(() => hotelRefetch()) : hotelItems.length === 0
            ? renderEmpty(<Building className="h-10 w-10 text-slate-300" strokeWidth={1.5} />, 'لا توجد بيانات فنادق')
            : (
            <div className="flex-1 flex flex-col">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 border-b border-slate-100 hover:bg-slate-50">
                      <TableHead className="text-right text-slate-500 font-semibold max-w-[50px]">#</TableHead>
                      <TableHead className="text-right text-slate-500 font-semibold">اسم الفندق</TableHead>
                      <TableHead className="text-right text-slate-500 font-semibold">المدينة</TableHead>
                      <TableHead className="text-right text-slate-500 font-semibold">عدد الحجوزات</TableHead>
                      <TableHead className="text-right text-slate-500 font-semibold">إجمالي الليالي</TableHead>
                      <TableHead className="text-right text-slate-500 font-semibold">تكلفة الشراء</TableHead>
                      <TableHead className="text-right text-slate-500 font-semibold">إجمالي البيع</TableHead>
                      <TableHead className="text-right text-slate-500 font-semibold">الربح</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hotelItems.map((hotel, index) => (
                      <TableRow key={hotel.id} className="hover:bg-slate-50/50 transition-colors">
                        <TableCell className="font-medium text-slate-500">{(hotelMeta.page - 1) * hotelMeta.limit + index + 1}</TableCell>
                        <TableCell>
                          <button
                            onClick={() => router.push(`/dashboard/financial-reports/hotels/${hotel.id}`)}
                            className="font-bold text-[#25396f] hover:text-blue-700 hover:underline transition-colors cursor-pointer text-right"
                          >
                            {hotel.hotelName}
                          </button>
                        </TableCell>
                        <TableCell className="font-medium text-slate-700">{hotel.cityName}</TableCell>
                        <TableCell className="font-bold text-slate-700">{hotel.bookingsCount}</TableCell>
                        <TableCell className="text-slate-600">{hotel.totalNights}</TableCell>
                        <TableCell className="font-bold text-rose-600">{formatCurrency(hotel.totalPurchaseAmount)}</TableCell>
                        <TableCell className="font-bold text-blue-600">{formatCurrency(hotel.totalSellingAmount)}</TableCell>
                        <TableCell className={cn("font-bold", hotel.totalProfit >= 0 ? "text-emerald-600" : "text-rose-600")}>
                          {formatCurrency(hotel.totalProfit)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {renderPagination(hotelMeta, setHotelPage, setHotelPage)}
            </div>
          )}
        </div>
      )}

      {/* ═══════════ AGENTS TAB ═══════════ */}
      {filter === 'agents' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col">
          {agentLoading ? renderSkeleton() : agentError ? renderError(() => agentRefetch()) : agentItems.length === 0
            ? renderEmpty(<Briefcase className="h-10 w-10 text-slate-300" strokeWidth={1.5} />, 'لا توجد بيانات وكلاء')
            : (
            <div className="flex-1 flex flex-col">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 border-b border-slate-100 hover:bg-slate-50">
                      <TableHead className="text-right text-slate-500 font-semibold max-w-[50px]">#</TableHead>
                      <TableHead className="text-right text-slate-500 font-semibold">اسم الوكيل</TableHead>
                      <TableHead className="text-right text-slate-500 font-semibold">عدد العملاء</TableHead>
                      <TableHead className="text-right text-slate-500 font-semibold">عدد الحجوزات</TableHead>
                      <TableHead className="text-right text-slate-500 font-semibold">المجموع الكلي</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agentItems.map((agent, index) => (
                      <TableRow key={agent.id} className="hover:bg-slate-50/50 transition-colors">
                        <TableCell className="font-medium text-slate-500">{(agentMeta.page - 1) * agentMeta.limit + index + 1}</TableCell>
                        <TableCell className="font-bold text-[#25396f]">{agent.agentName}</TableCell>
                        <TableCell className="font-bold text-slate-700">{agent.customersCount}</TableCell>
                        <TableCell className="font-bold text-slate-700">{agent.quotationsCount}</TableCell>
                        <TableCell className="font-bold text-slate-700">{formatCurrency(agent.totalSellingAmount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {renderPagination(agentMeta, setAgentPage, setAgentPage)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

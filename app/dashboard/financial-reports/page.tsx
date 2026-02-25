"use client"
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

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
  summary: {
    totalAmount: number;
    totalPaid: number;
    totalRemaining: number;
  }
  meta: {
    totalCount: number;
    page: number;
    limit: number;
    pageCount: number;
  }
}

export default function FinancialReportsPage() {
  const [filter, setFilter] = useState('confirmed');
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading, isError, refetch } = useQuery<FinancialData>({
    queryKey: ['financialReports', filter, page],
    queryFn: async () => {
      const res = await fetch(`/api/financial-reports?filter=${filter}&page=${page}&limit=${limit}`);
      if (!res.ok) {
        throw new Error('Failed to fetch financial reports');
      }
      return res.json();
    }
  });

  const summary = data?.summary || { totalAmount: 0, totalPaid: 0, totalRemaining: 0 };
  const items = data?.data || [];
  const meta = data?.meta || {
    totalCount: 0,
    page: 1,
    limit: 10,
    pageCount: 1,
  };

  const tabs = [
    { id: 'confirmed', label: 'مؤكد (الحجوزات)' },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

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
            تصدير
            <Download size={16} />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <Card className="bg-white border-0 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] rounded-2xl overflow-hidden relative group transition-all hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)]">
          <CardContent className="p-6 flex flex-col items-center justify-center pt-8 pb-8">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-full mb-4">
              <DollarSign size={24} />
            </div>
            <div className="text-3xl font-black text-slate-700 mb-2">{formatCurrency(summary.totalAmount)}</div>
            <div className="text-sm font-bold text-slate-400">المجموع الكلي</div>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] rounded-2xl overflow-hidden relative group transition-all hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)]">
          <CardContent className="p-6 flex flex-col items-center justify-center pt-8 pb-8">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full mb-4">
              <TrendingUp size={24} />
            </div>
            <div className="text-3xl font-black text-emerald-600 mb-2">{formatCurrency(summary.totalPaid)}</div>
            <div className="text-sm font-bold text-emerald-700/60">الوارد (المدفوع)</div>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] rounded-2xl overflow-hidden relative group transition-all hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)]">
          <CardContent className="p-6 flex flex-col items-center justify-center pt-8 pb-8">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-full mb-4">
              <TrendingDown size={24} />
            </div>
            <div className="text-3xl font-black text-rose-600 mb-2">{formatCurrency(summary.totalRemaining)}</div>
            <div className="text-sm font-bold text-rose-700/60">النقص (المتبقي)</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Tabs */}
        <div className="flex flex-wrap w-full md:w-auto p-1 bg-white/60 backdrop-blur-md border border-slate-200/60 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] rounded-xl gap-1">
          {tabs.map(tab => (
            <button 
              key={tab.id}
              onClick={() => {
                setFilter(tab.id);
                setPage(1); // Reset page on filter change
              }}
              className={cn(
                "px-5 py-2 rounded-lg text-sm font-bold transition-all flex-1 md:flex-none whitespace-nowrap",
                filter === tab.id 
                  ? "bg-white text-slate-900 shadow-sm ring-1 ring-black/5"
                  : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table Area */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.04)] overflow-hidden min-h-[400px] flex flex-col">
        {isLoading ? (
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
        ) : isError ? (
          <div className="p-24 text-center flex flex-col items-center justify-center text-rose-400 flex-1">
            <p className="font-bold text-xl text-rose-600 mb-2">خطأ في التحميل</p>
            <p className="text-sm text-slate-400 font-medium mb-4">حدث خطأ أثناء تحميل التقارير المالية.</p>
            <Button onClick={() => refetch()} variant="outline" className="gap-2">إعادة المحاولة</Button>
          </div>
        ) : items.length === 0 ? (
          <div className="p-24 text-center flex flex-col items-center justify-center text-slate-400 flex-1">
            <div className="bg-slate-50 p-6 rounded-full mb-4 ring-1 ring-slate-100 shadow-sm">
              <FileText className="h-10 w-10 text-slate-300" strokeWidth={1.5} />
            </div>
            <p className="font-black text-xl text-slate-700 mb-2">لا يوجد بيانات مالية مطابقة للبحث</p>
          </div>
        ) : (
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
                      <TableCell className="text-slate-600">{format(new Date(item.date), 'yyyy-MM-dd')}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(
                          "font-medium shadow-none",
                          item.status === 'confirmed' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                          item.status === 'draft' ? "bg-slate-50 text-slate-700 border-slate-200" :
                          "bg-orange-50 text-orange-700 border-orange-200"
                        )}>
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
                        {item.remainingAmount > 0 ? (
                          formatCurrency(item.remainingAmount)
                        ) : (
                          <span className="text-slate-400 font-normal">0</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {/* Pagination */}
            {meta.pageCount > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/30">
                <p className="text-sm font-medium text-slate-500">
                  عرض صفحة <span className="font-bold text-slate-700">{meta.page}</span> من <span className="font-bold text-slate-700">{meta.pageCount}</span>
                </p>
                <div className="flex gap-1" dir="rtl">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-transparent text-slate-500 hover:text-slate-700 hover:bg-white hover:border-slate-200"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={meta.page === 1}
                  >
                    السابق
                  </Button>
                  
                  {Array.from({ length: meta.pageCount }).map((_, idx) => {
                    const pageNum = idx + 1;
                    if (meta.pageCount > 5 && Math.abs(meta.page - pageNum) > 1 && pageNum !== 1 && pageNum !== meta.pageCount) {
                      if (pageNum === 2 || pageNum === meta.pageCount - 1) return <span key={pageNum} className="px-2 self-end text-slate-400">...</span>;
                      return null;
                    }

                    return (
                      <Button 
                        key={pageNum}
                        variant={meta.page === pageNum ? 'default' : 'outline'}
                        size="sm"
                        className={cn(
                          "h-8 min-w-8 font-bold border-transparent transition-all",
                          meta.page === pageNum 
                            ? "bg-[#25396f] text-white shadow-sm" 
                            : "bg-transparent text-slate-500 hover:text-slate-700 hover:bg-white hover:border-slate-200"
                        )}
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}

                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-transparent text-slate-500 hover:text-slate-700 hover:bg-white hover:border-slate-200"
                    onClick={() => setPage(p => Math.min(meta.pageCount, p + 1))}
                    disabled={meta.page === meta.pageCount}
                  >
                    التالي
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

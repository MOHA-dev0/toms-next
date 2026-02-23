"use client"
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Plus, Search, Download, ChevronRight, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useQuotations } from '@/hooks/useQuotations';
import PaymentModal from './PaymentModal';
import { QuotationTable, Quotation } from '@/components/quotations/QuotationTable';
import { useRouter } from 'next/navigation';

interface Meta {
  totalCount: number;
  draftCount: number;
  unconfirmedCount: number;
  confirmedCount: number;
  filteredCount: number;
  pageCount: number;
}

export default function QuotationsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isPrinting, setIsPrinting] = useState<string | null>(null);
  const limit = 10;

  useEffect(() => {
    // Reset to page 1 on filter or search change
    setPage(1);
  }, [filter, debouncedSearch]);

  const { data, isLoading, isError, refetch } = useQuotations({
    page,
    limit,
    search: debouncedSearch,
    status: filter,
  });

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/quotations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update status');
      }
      
      toast.success('تم تحديث الحالة بنجاح');
      refetch();
      
      if (newStatus === 'confirmed') {
        router.push(`/dashboard/quotations/${id}`);
      }
    } catch (e: any) {
      toast.error(e.message || 'حدث خطأ أثناء تحديث الحالة');
    }
  };



  const quotations = data?.data || [];
  const meta = data?.meta || {
    totalCount: 0,
    draftCount: 0,
    unconfirmedCount: 0,
    confirmedCount: 0,
    filteredCount: 0,
    pageCount: 1,
  };


  const tabs = [
    { id: 'all', label: 'الكل' },
    { id: 'confirmed', label: 'مؤكد' },
    { id: 'unconfirmed', label: 'غير مؤكد' },
    { id: 'draft', label: 'مسودة' },
    { id: 'cancelled', label: 'ملغي' },
  ];

  return (
<div
  className="p-4 sm:p-8 w-full min-h-screen bg-[#f8f9fc] space-y-8 font-sans"
  dir="rtl"
>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="text-right">
          <h1 className="text-3xl font-black tracking-tight text-slate-800 mb-1">عروض الأسعار</h1>
          <p className="text-slate-500 text-sm font-medium">{meta.totalCount} عرض سعر إجمالي</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <Button variant="outline" className="flex-1 md:flex-none gap-2 bg-white text-slate-600 border-slate-200 h-10 rounded-xl shadow-sm hover:shadow-md hover:bg-slate-50 transition-all font-semibold justify-center">
            تصدير
            <Download size={16} />
          </Button>
          <Link href="/dashboard/quotations/create" className="flex-1 md:flex-none">
            <Button className="w-full gap-2 bg-[#25396f] hover:bg-[#1a2850] text-white px-6 h-10 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all justify-center">
              <Plus size={16} strokeWidth={2.5} />
              عرض سعر جديد
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="bg-white border-0 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] rounded-2xl overflow-hidden relative group transition-all hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)]">
          <CardContent className="p-6 flex flex-col items-center justify-center pt-8 pb-8">
            <div className="text-3xl font-black text-slate-700 mb-2">{meta.totalCount}</div>
            <div className="text-sm font-bold text-slate-400">الكل</div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50/50 border-0 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] rounded-2xl overflow-hidden relative group transition-all hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)]">
          <CardContent className="p-6 flex flex-col items-center justify-center pt-8 pb-8">
            <div className="text-3xl font-black text-emerald-600 mb-2">{meta.confirmedCount}</div>
            <div className="text-sm font-bold text-emerald-700/60">مؤكد</div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50/50 border-0 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] rounded-2xl overflow-hidden relative group transition-all hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)]">
          <CardContent className="p-6 flex flex-col items-center justify-center pt-8 pb-8">
            <div className="text-3xl font-black text-orange-500 mb-2">{meta.unconfirmedCount}</div>
            <div className="text-sm font-bold text-orange-600/60">غير مؤكد</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-50/80 border-0 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] rounded-2xl overflow-hidden relative group transition-all hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)]">
          <CardContent className="p-6 flex flex-col items-center justify-center pt-8 pb-8">
            <div className="text-3xl font-black text-slate-500 mb-2">{meta.draftCount}</div>
            <div className="text-sm font-bold text-slate-400">مسودة</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        
        {/* Tabs */}
        <div className="flex flex-wrap w-full md:w-auto p-1 bg-white/60 backdrop-blur-md border border-slate-200/60 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] rounded-xl gap-1">
          {tabs.map(tab => (
            <button 
              key={tab.id}
              onClick={() => setFilter(tab.id)}
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

        {/* Search */}
        <div className="relative w-full md:w-80 group">
          <Search className="absolute right-3.5 top-3 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <Input
            placeholder="بحث بالمرجع أو اسم العميل..."
            className="pl-4 pr-10 bg-white border-0 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] ring-1 ring-slate-200/60 h-10 rounded-xl text-sm w-full focus-visible:ring-2 focus-visible:ring-blue-500/50 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
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
            <p className="text-sm text-slate-400 font-medium mb-4">حدث خطأ أثناء تحميل عروض الأسعار.</p>
            <Button onClick={() => refetch()} variant="outline" className="gap-2">إعادة المحاولة</Button>
          </div>
        ) : quotations.length === 0 ? (
          <div className="p-24 text-center flex flex-col items-center justify-center text-slate-400 flex-1">
            <div className="bg-slate-50 p-6 rounded-full mb-4 ring-1 ring-slate-100 shadow-sm">
              <FileText className="h-10 w-10 text-slate-300" strokeWidth={1.5} />
            </div>
            <p className="font-black text-xl text-slate-700 mb-2">لا يوجد عروض أسعار{filter !== 'all' || debouncedSearch ? ' مطابقة للبحث' : ''}</p>
            <p className="text-sm text-slate-400 font-medium">جرب تغيير عوامل التصفية أو إنشاء عرض جديد.</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            <QuotationTable 
              quotations={quotations}
              onUpdateStatus={handleUpdateStatus}
              onAddPayment={(quotation: Quotation) => {
                setSelectedQuotation(quotation);
                setIsPaymentModalOpen(true);
              }}
            />
            
            {/* Pagination */}
            {meta.pageCount > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/30">
                <p className="text-sm font-medium text-slate-500">
                  عرض صفحة <span className="font-bold text-slate-700">{page}</span> من <span className="font-bold text-slate-700">{meta.pageCount}</span>
                </p>
                <div className="flex gap-1" dir="rtl">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8 border-transparent text-slate-500 hover:text-slate-700 hover:bg-white hover:border-slate-200"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronRight size={16} />
                  </Button>
                  
                  {Array.from({ length: meta.pageCount }).map((_, idx) => {
                    const pageNum = idx + 1;
                    // Simplify pagination view if many pages
                    if (meta.pageCount > 5 && Math.abs(page - pageNum) > 1 && pageNum !== 1 && pageNum !== meta.pageCount) {
                      if (pageNum === 2 || pageNum === meta.pageCount - 1) return <span key={pageNum} className="px-2 self-end text-slate-400">...</span>;
                      return null;
                    }

                    return (
                      <Button 
                        key={pageNum}
                        variant={page === pageNum ? 'default' : 'outline'}
                        size="sm"
                        className={cn(
                          "h-8 min-w-8 font-bold border-transparent transition-all",
                          page === pageNum 
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
                    size="icon" 
                    className="h-8 w-8 border-transparent text-slate-500 hover:text-slate-700 hover:bg-white hover:border-slate-200"
                    onClick={() => setPage(p => Math.min(meta.pageCount, p + 1))}
                    disabled={page === meta.pageCount}
                  >
                    <ChevronLeft size={16} />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <PaymentModal 
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setSelectedQuotation(null);
        }}
        quotation={selectedQuotation!}
        onPaymentSuccess={() => {
          refetch();
          setIsPaymentModalOpen(false);
          setSelectedQuotation(null);
        }}
      />
    </div>
  );
}

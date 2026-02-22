"use client"
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { FileText, Plus, Search, Eye, Download, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useQuotations } from '@/hooks/useQuotations';
import PaymentModal from './PaymentModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Copy, FileEdit, Trash2, CreditCard, Printer, CheckCircle } from "lucide-react";

interface Quotation {
  id: string;
  referenceNumber: string;
  customerName: string;
  agentName: string;
  destination: string;
  paxCount: number;
  totalPrice: number;
  paidAmount: number;
  createdAt: Date;
  status: string;
}

interface Meta {
  totalCount: number;
  draftCount: number;
  unconfirmedCount: number;
  confirmedCount: number;
  filteredCount: number;
  pageCount: number;
}

export default function QuotationsPage() {
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
      if (!res.ok) throw new Error('Failed to update status');
      toast.success('تم تحديث الحالة بنجاح');
      refetch();
    } catch (e) {
      toast.error('حدث خطأ أثناء تحديث الحالة');
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

  const getStatusBadge = (status: string, quotation?: Quotation) => {
    // Check payment status first
    if (quotation) {
      const isFullyPaid = quotation.totalPrice > 0 && quotation.paidAmount >= quotation.totalPrice;
      const isPartiallyPaid = quotation.totalPrice > 0 && quotation.paidAmount > 0 && quotation.paidAmount < quotation.totalPrice;
      
      if (isFullyPaid) {
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-green-50 text-green-600 border border-green-100">مدفوع بالكامل</span>;
      } else if (isPartiallyPaid || status === 'confirmed') {
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">مؤكد</span>;
      }
    }

    if (status === 'cancelled') {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-100">ملغي</span>;
    }

    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-50 text-orange-600 border border-orange-100">غير مؤكد</span>;
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
            <div className="overflow-x-auto flex-1">
              <Table>
                <TableHeader className="bg-slate-50/80 sticky top-0 z-10 backdrop-blur-sm">
                  <TableRow className="hover:bg-transparent border-b-slate-100">
                    <TableHead className="text-right font-bold text-slate-500 py-3.5 px-6 w-32 whitespace-nowrap">رقم المرجع</TableHead>
                    <TableHead className="text-right font-bold text-slate-500 py-3.5 px-6 whitespace-nowrap">العميل</TableHead>
                    <TableHead className="text-right font-bold text-slate-500 py-3.5 px-6 whitespace-nowrap">الوكيل</TableHead>
                    <TableHead className="text-right font-bold text-slate-500 py-3.5 px-6 whitespace-nowrap">الوجهة</TableHead>
                    <TableHead className="text-center font-bold text-slate-500 py-3.5 px-6 whitespace-nowrap">تاريخ الدخول</TableHead>
                    <TableHead className="text-center font-bold text-slate-500 py-3.5 px-6 whitespace-nowrap">عدد الأشخاص</TableHead>
                    <TableHead className="text-center font-bold text-slate-500 py-3.5 px-6 whitespace-nowrap">الإجمالي</TableHead>
                    <TableHead className="text-center font-bold text-slate-500 py-3.5 px-6 whitespace-nowrap">المدفوع</TableHead>
                    <TableHead className="text-center font-bold text-slate-500 py-3.5 px-6 whitespace-nowrap">المتبقي</TableHead>
                    <TableHead className="text-center font-bold text-slate-500 py-3.5 px-6 w-32 whitespace-nowrap">الحالة</TableHead>
                    <TableHead className="text-center font-bold text-slate-500 py-3.5 px-6 w-24">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotations.map((quotation) => (
                    <TableRow key={quotation.id} className="hover:bg-slate-50/50 border-b border-slate-50/80 transition-colors group">
                      <TableCell className="font-bold text-slate-700 px-6 py-4">
                        {quotation.referenceNumber}
                      </TableCell>
                      <TableCell className="font-bold text-slate-700 px-6 py-4">
                        {quotation.customerName}
                      </TableCell>
                      <TableCell className="font-medium text-slate-400 px-6 py-4">
                        {quotation.agentName || <span className="opacity-50">-</span>}
                      </TableCell>
                      <TableCell className="font-medium text-slate-500 px-6 py-4">
                        {quotation.destination || <span className="opacity-50">-</span>}
                      </TableCell>
                      <TableCell className="text-center font-medium text-slate-500 px-6 py-4 whitespace-nowrap">
                        {new Date(quotation.createdAt).toLocaleDateString('en-GB')}
                      </TableCell>
                      <TableCell className="text-center font-bold text-slate-500 px-6 py-4">
                        {quotation.paxCount}
                      </TableCell>
                      <TableCell className="text-center px-6 py-4 whitespace-nowrap">
                        <span className="font-black text-slate-800">
                          ${quotation.totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </TableCell>
                      <TableCell className="text-center px-6 py-4 whitespace-nowrap">
                        <span className="font-bold text-emerald-600">
                          ${(quotation.paidAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </TableCell>
                      <TableCell className="text-center px-6 py-4 whitespace-nowrap">
                        <span className="font-bold text-rose-600">
                          ${Math.max(0, quotation.totalPrice - (quotation.paidAmount || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </TableCell>
                      <TableCell className="text-center px-6 py-4">
                        {getStatusBadge(quotation.status, quotation)}
                      </TableCell>
                      <TableCell className="text-center px-6 py-4">
                        <DropdownMenu dir="rtl">
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">فتح القائمة</span>
                              <MoreVertical className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 text-right bg-white rounded-xl shadow-lg border border-slate-100 p-2">
                            <Link href={`/dashboard/quotations/edit/${quotation.id}`} passHref>
                              <DropdownMenuItem 
                                className="focus:bg-slate-100 focus:text-slate-800 text-slate-700 cursor-pointer rounded-lg py-2.5 px-3 flex items-center justify-end gap-2 font-medium transition-colors"
                              >
                                <span className="flex-1 text-right">تعديل العرض</span>
                                <FileEdit className="h-4 w-4 ml-1 opacity-70" />
                              </DropdownMenuItem>
                            </Link>
                            <DropdownMenuItem 
                              className="focus:bg-emerald-50 focus:text-emerald-700 text-slate-700 cursor-pointer rounded-lg py-2.5 px-3 flex items-center justify-end gap-2 font-medium transition-colors"
                              onClick={() => {
                                setSelectedQuotation(quotation);
                                setIsPaymentModalOpen(true);
                              }}
                            >
                              <span className="flex-1 text-right">إضافة دفعة</span>
                              <CreditCard className="h-4 w-4 ml-1 opacity-70" />
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="focus:bg-blue-50 focus:text-blue-700 text-slate-700 cursor-pointer rounded-lg py-2.5 px-3 flex items-center justify-end gap-2 font-medium transition-colors"
                              onClick={() => handleUpdateStatus(quotation.id, 'confirmed')}
                              disabled={quotation.status === 'confirmed'}
                            >
                              <span className="flex-1 text-right">تأكيد العرض</span>
                              <CheckCircle className="h-4 w-4 ml-1 opacity-70" />
                            </DropdownMenuItem>
                            <Link href={`/dashboard/quotations/${quotation.id}`} passHref>
                              <DropdownMenuItem 
                                className="focus:bg-slate-100 focus:text-slate-800 text-slate-700 cursor-pointer rounded-lg py-2.5 px-3 flex items-center justify-end gap-2 font-medium transition-colors"
                              >
                                <span className="flex-1 text-right">عرض و طباعة (View & Print)</span>
                                <Eye className="h-4 w-4 ml-1 opacity-70" />
                              </DropdownMenuItem>
                            </Link>
                          </DropdownMenuContent>
                        </DropdownMenu>
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

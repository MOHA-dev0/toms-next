"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Search,
  Ticket,
  CheckCircle,
  Package,
  Eye,
  MoreVertical,
  FileText,
  Printer,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Tab = "confirmed" | "bookings";

export default function BookingsClientView({
  initialData,
  total,
  currentPage,
  currentTab,
  currentSearch,
  totalPages,
}: {
  initialData: any[];
  total: number;
  currentPage: number;
  currentTab: Tab;
  currentSearch: string;
  totalPages: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [search, setSearch] = useState(currentSearch);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleUpdate = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    if (key !== "page") params.set("page", "1");

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleConfirmBooking = async (quotationId: string) => {
    if (!confirm("هل تريد إنشاء الفاتورة لهذا العرض؟")) return;
    setConfirmingId(quotationId);
    try {
      const res = await fetch(`/api/bookings/${quotationId}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const err = await res.json();
        if (err.bookingId) {
          toast.info("يوجد حجز بالفعل، سيتم التوجيه...");
          router.push(`/dashboard/bookings/${err.bookingId}`);
          return;
        }
        throw new Error(err.error || "فشل");
      }
      const booking = await res.json();
      toast.success(`تم إنشاء الفواتير بنجاح!`);
      router.push(`/dashboard/bookings/${booking.id}`);
    } catch (e: any) {
      toast.error(e.message || "فشل في إنشاء الفواتير");
    } finally {
      setConfirmingId(null);
    }
  };

  const goToBooking = (q: any) => {
    const bk = q.bookings?.[0];
    if (bk) router.push(`/dashboard/bookings/${bk.id}`);
  };

  const fmt = (d?: string | null) =>
    d ? format(new Date(d), "dd-MM-yyyy") : "—";

  return (
    <div
      className={`flex-1 p-6 space-y-6 transition-opacity ${
        isPending ? "opacity-60 pointer-events-none" : "opacity-100"
      }`}
      dir="rtl"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground">الحجوزات والعمليات</h1>
          <p className="text-sm text-muted-foreground mt-1">
            إدارة الحجوزات وتوليد الفاوتشرات
          </p>
        </div>
      </div>

      {/* Tabs + Search */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex bg-muted rounded-xl p-1">
          <button
            onClick={() => handleUpdate("tab", "confirmed")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              currentTab === "confirmed"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <CheckCircle className="w-4 h-4 inline ml-1.5" />
            العروض المؤكدة (بالانتظار)
          </button>
          <button
            onClick={() => handleUpdate("tab", "bookings")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              currentTab === "bookings"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Ticket className="w-4 h-4 inline ml-1.5" />
            الحجوزات (المفوترة)
          </button>
        </div>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleUpdate("search", search);
            }}
            placeholder="بحث برقم العرض أو اسم العميل أو رقم الفاوتشر... (اضغط انتر)"
            className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* Content */}
      {initialData.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-lg font-bold">
            {currentTab === "confirmed" ? "لا توجد عروض مؤكدة" : "لا توجد حجوزات"}
          </p>
        </div>
      ) : currentTab === "confirmed" ? (
        /* ── Confirmed Quotations Table ── */
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50 text-xs text-muted-foreground font-bold border-b border-border">
                <th className="py-3 px-4 text-right">رقم المرجع</th>
                <th className="py-3 px-4 text-right">العميل</th>
                <th className="py-3 px-4 text-right">منشئ العرض</th>
                <th className="py-3 px-4 text-center">الفنادق</th>
                <th className="py-3 px-4 text-center">السيارات</th>
                <th className="py-3 px-4 text-right">التاريخ</th>
                <th className="py-3 px-4 text-center">الحالة</th>
                <th className="py-3 px-4 text-center w-14"></th>
              </tr>
            </thead>
            <tbody>
              {initialData.map((q: any) => {
                const hasBooking =
                  Array.isArray(q.bookings) && q.bookings.length > 0;
                
                // Count falls back on relation counts if present, otherwise length
                const hotelsCount = q._count?.quotationHotels ?? (q.quotationHotels?.length || 0);
                const carsCount = q._count?.quotationCars ?? (q.quotationCars?.length || 0);

                return (
                  <tr
                    key={q.id}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono text-primary font-bold text-sm">
                      {q.referenceNumber}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium">
                      {q.customer?.nameAr || "—"}
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {q.salesEmployee?.nameAr || "—"}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-bold">
                        {hotelsCount}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full text-xs font-bold">
                        {carsCount}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {fmt(q.startDate)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {hasBooking ? (
                        <StatusBadge status={q.bookings[0].status} />
                      ) : confirmingId === q.id ? (
                        <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full mx-auto" />
                      ) : (
                        <span className="bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded-full text-xs font-bold shadow-sm">
                          ⏳ بانتظار الإصدار
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center relative">
                      <DropdownMenu dir="rtl">
                        <DropdownMenuTrigger asChild>
                          <button className="p-1.5 rounded-lg hover:bg-muted transition-colors outline-none focus:ring-2 focus:ring-primary/50">
                            <span className="sr-only">فتح القائمة</span>
                            <MoreVertical className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-48 text-right bg-white rounded-xl shadow-lg border border-slate-100 p-2 z-[999]"
                        >
                          {!hasBooking ? (
                            <DropdownMenuItem
                              onClick={() => handleConfirmBooking(q.id)}
                              className="focus:bg-emerald-50 focus:text-emerald-700 text-slate-700 cursor-pointer rounded-lg py-2.5 px-3 flex items-center justify-end gap-2 font-medium transition-colors w-full"
                            >
                              <span className="flex-1 text-right">
                                إصدار الفواتير
                              </span>
                              <FileText className="w-4 h-4 ml-1 opacity-70 text-emerald-600" />
                            </DropdownMenuItem>
                          ) : q.bookings[0].status === "pending" ? (
                            <>
                              <DropdownMenuItem
                                onClick={() => handleConfirmBooking(q.id)}
                                className="focus:bg-emerald-50 focus:text-emerald-700 text-slate-700 cursor-pointer rounded-lg py-2.5 px-3 flex items-center justify-end gap-2 font-medium transition-colors w-full"
                              >
                                <span className="flex-1 text-right">
                                  إصدار الفواتير
                                </span>
                                <FileText className="w-4 h-4 ml-1 opacity-70 text-emerald-600" />
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => goToBooking(q)}
                                className="focus:bg-blue-50 focus:text-blue-700 text-slate-700 cursor-pointer rounded-lg py-2.5 px-3 flex items-center justify-end gap-2 font-medium transition-colors w-full"
                              >
                                <span className="flex-1 text-right">عرض الحجز</span>
                                <Eye className="w-4 h-4 ml-1 opacity-70 text-primary" />
                              </DropdownMenuItem>
                            </>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => goToBooking(q)}
                              className="focus:bg-blue-50 focus:text-blue-700 text-slate-700 cursor-pointer rounded-lg py-2.5 px-3 flex items-center justify-end gap-2 font-medium transition-colors w-full"
                            >
                              <span className="flex-1 text-right">
                                عرض الفاتورة
                              </span>
                              <Eye className="w-4 h-4 ml-1 opacity-70 text-primary" />
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(`/dashboard/quotations/${q.id}`)
                            }
                            className="focus:bg-slate-100 focus:text-slate-800 text-slate-700 cursor-pointer rounded-lg py-2.5 px-3 flex items-center justify-end gap-2 font-medium transition-colors w-full"
                          >
                            <span className="flex-1 text-right">عرض المسار</span>
                            <Printer className="w-4 h-4 ml-1 opacity-70 text-muted-foreground" />
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* ── Bookings Table ── */
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50 text-xs text-muted-foreground font-bold border-b border-border">
                <th className="py-3 px-4 text-right">رقم الحجز</th>
                <th className="py-3 px-4 text-right">رقم العرض</th>
                <th className="py-3 px-4 text-right">العميل</th>
                <th className="py-3 px-4 text-center">الفاوتشرات</th>
                <th className="py-3 px-4 text-center">الحالة</th>
                <th className="py-3 px-4 text-right">التاريخ</th>
                <th className="py-3 px-4 text-center">عرض</th>
              </tr>
            </thead>
            <tbody>
              {initialData.map((b: any) => {
                const voucherCount = b._count?.vouchers ?? (b.vouchers?.length || 0);
                return (
                  <tr
                    key={b.id}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono text-primary font-bold text-sm">
                      {b.referenceNumber}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-muted-foreground">
                      {b.quotation?.referenceNumber || "—"}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium">
                      {b.quotation?.customer?.nameAr || "—"}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs font-bold">
                        {voucherCount}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex flex-col gap-1 items-center">
                        <StatusBadge status={b.status} />
                        {b.invoiceNeedsUpdate && (
                          <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded shadow-sm border border-rose-200">
                            بحاجة لتحديث الفواتير
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {fmt(b.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => router.push(`/dashboard/bookings/${b.id}`)}
                        className="bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        التفاصيل
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => handleUpdate("page", Math.max(1, currentPage - 1).toString())}
            disabled={currentPage === 1}
            className="px-3 py-1.5 rounded-lg border border-border bg-card text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
          >
            السابق
          </button>
          <span className="text-sm font-medium text-muted-foreground px-2">
            صفحة {currentPage} من {totalPages}
          </span>
          <button
            onClick={() => handleUpdate("page", Math.min(totalPages, currentPage + 1).toString())}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 rounded-lg border border-border bg-card text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
          >
            التالي
          </button>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: "قيد الانتظار", cls: "bg-yellow-100 text-yellow-700" },
    confirmed: { label: "مؤكد", cls: "bg-emerald-100 text-emerald-700" },
    cancelled: { label: "ملغي", cls: "bg-red-100 text-red-700" },
    completed: { label: "مكتمل", cls: "bg-blue-100 text-blue-700" },
  };
  const s = map[status] || { label: status, cls: "bg-gray-100 text-gray-700" };
  return (
    <span className={`${s.cls} px-2.5 py-0.5 rounded-full text-xs font-bold`}>
      {s.label}
    </span>
  );
}

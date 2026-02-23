'use client'

import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  FileText, 
  Calendar, 
  Ticket, 
  Plus, 
  UserPlus, 
} from 'lucide-react'
import { useQuotations } from '@/hooks/useQuotations'
import { useState } from 'react'
import { toast } from 'sonner'
import PaymentModal from './quotations/PaymentModal'
import { QuotationTable, Quotation } from '@/components/quotations/QuotationTable'

export default function Dashboard() {
  const { user, employee } = useAuth()
  const router = useRouter()
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Fetch only the latest 3 quotations
  const { data, isLoading, isError, refetch } = useQuotations({
    page: 1,
    limit: 3,
    search: '',
    status: 'all',
  });

  const quotations = data?.data || [];

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



  return (
    <div className="min-h-screen bg-gray-50/50 p-8 space-y-8" dir="rtl">
      {/* Action Button */}
      <div className="flex justify-end">
        <Link href="/dashboard/quotations/create">
          <Button className="gap-2 bg-blue-900 hover:bg-blue-800 text-white px-6">
            <Plus className="h-4 w-4" />
            عرض سعر جديد
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Quotations Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">{data?.meta ? data.meta.totalCount : 0}</h3>
            <p className="text-sm text-gray-500">عروض الأسعار</p>
          </div>
          <div className="h-12 w-12 bg-blue-900 rounded-xl flex items-center justify-center text-white shadow-blue-900/20 shadow-lg">
            <FileText className="h-6 w-6" />
          </div>
        </div>

        {/* Bookings Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">0</h3>
            <p className="text-sm text-gray-500">الحجوزات</p>
          </div>
          <div className="h-12 w-12 bg-teal-500 rounded-xl flex items-center justify-center text-white shadow-teal-500/20 shadow-lg">
            <Calendar className="h-6 w-6" />
          </div>
        </div>

        {/* Vouchers Card - Only for Admin and Booking */}
        {user?.role !== 'sales' && (
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-1">0</h3>
              <p className="text-sm text-gray-500">القسائم</p>
            </div>
            <div className="h-12 w-12 bg-green-500 rounded-xl flex items-center justify-center text-white shadow-green-500/20 shadow-lg">
              <Ticket className="h-6 w-6" />
            </div>
          </div>
        )}

        {/* Customers Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">0</h3>
            <p className="text-sm text-gray-500">العملاء</p>
          </div>
          <div className="h-12 w-12 bg-amber-400 rounded-xl flex items-center justify-center text-white shadow-amber-400/20 shadow-lg">
            <UserPlus className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Latest Quotations Section */}
      <div className="bg-white rounded-2xl border shadow-[0_4px_24px_-8px_rgba(0,0,0,0.04)] flex flex-col min-h-[400px]">
        <div className="p-6 border-b flex justify-between items-center bg-slate-50/80 rounded-t-2xl">
          <h2 className="font-semibold text-lg text-slate-800">آخر عروض الأسعار</h2>
          <Link href="/dashboard/quotations">
            <Button variant="ghost" size="sm" className="gap-2 text-slate-500 hover:text-slate-800">
              عرض الكل
              <span className="text-xs">←</span>
            </Button>
          </Link>
        </div>
        
        {isLoading ? (
          <div className="flex-1 flex flex-col p-4">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-4 space-x-reverse animate-pulse">
                  <div className="h-12 bg-slate-100 rounded-lg w-full"></div>
                </div>
              ))}
            </div>
          </div>
        ) : isError ? (
          <div className="flex-1 flex flex-col items-center justify-center text-rose-400 p-8">
            <p className="font-bold text-xl text-rose-600 mb-2">خطأ في التحميل</p>
            <Button onClick={() => refetch()} variant="outline" className="gap-2">إعادة المحاولة</Button>
          </div>
        ) : quotations.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
            <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 ring-1 ring-slate-100 shadow-sm">
              <FileText className="h-8 w-8 text-slate-300" strokeWidth={1.5} />
            </div>
            <p className="font-black text-xl text-slate-700 mb-2">لا توجد عروض أسعار حتى الآن</p>
            <Link href="/dashboard/quotations/create">
              <Button variant="link" className="text-blue-900 px-0">
                إنشاء عرض سعر جديد
              </Button>
            </Link>
          </div>
        ) : (
          <QuotationTable 
            quotations={quotations}
            onUpdateStatus={handleUpdateStatus}
            onAddPayment={(quotation: Quotation) => {
              setSelectedQuotation(quotation);
              setIsPaymentModalOpen(true);
            }}
          />
        )}
      </div>

      {isPaymentModalOpen && selectedQuotation && (
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
      )}
    </div>
  )
}


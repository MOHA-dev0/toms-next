'use client'

import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'
import { 
  FileText, 
  Calendar, 
  Ticket, 
  Plus, 
  Search, 
  UserPlus, 
  Bell 
} from 'lucide-react'

export default function Dashboard() {
  const { user, employee } = useAuth()
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50/50 p-8 space-y-8">
      {/* Action Button */}
      <div className="flex justify-end">
        <Button className="gap-2 bg-blue-900 hover:bg-blue-800 text-white px-6">
          <Plus className="h-4 w-4" />
          عرض سعر جديد
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Quotations Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">0</h3>
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

        {/* Vouchers Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">0</h3>
            <p className="text-sm text-gray-500">القسائم</p>
          </div>
          <div className="h-12 w-12 bg-green-500 rounded-xl flex items-center justify-center text-white shadow-green-500/20 shadow-lg">
            <Ticket className="h-6 w-6" />
          </div>
        </div>

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
      <div className="bg-card rounded-xl border shadow-sm flex flex-col min-h-[400px]">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="font-semibold text-lg">آخر عروض الأسعار</h2>
          <Button variant="ghost" size="sm" className="gap-2">
            عرض الكل
            <span className="text-xs">←</span>
          </Button>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
          <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <FileText className="h-8 w-8 opacity-50" />
          </div>
          <p>لا توجد عروض أسعار حتى الآن</p>
          <Button variant="link" className="text-blue-900">
            إنشاء عرض سعر جديد
          </Button>
        </div>
      </div>
    </div>
  )
}


'use client'

import { useState, useEffect } from 'react'
import { Plus, UserPlus, Mail, Phone, Shield, Search, Loader2, CheckCircle2, Clock, Trash2, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import api from '@/lib/api-client'
import { DataCard } from '@/components/ui/data-card'
import { Badge } from '@/components/ui/badge'
import { ROLE_NAMES } from '@/lib/constants'

interface Employee {
  id: string
  nameAr: string
  email: string
  phone?: string
  initial: string
  isActive: boolean
  user: {
    userRoles: { role: string }[]
  }
}

interface Invitation {
  id: string
  email: string
  nameAr: string
  role: string
  status: 'pending' | 'accepted' | 'expired'
  expiresAt: string
  createdAt: string
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  const [formData, setFormData] = useState({
    email: '',
    nameAr: '',
    phone: '',
    initial: '',
    role: 'sales',
  })

  const { toast } = useToast()

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [empData, invData] = await Promise.all([
        api.get('/api/employees'),
        api.get('/api/employees/invitations')
      ])
      setEmployees(empData)
      setInvitations(invData)
    } catch (error) {
      console.error('Failed to fetch data', error)
      toast({ 
        title: 'خطأ',
        description: 'فشل تحميل البيانات',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await api.post('/api/employees/invite', formData)
      toast({ 
        title: 'تم إرسال الدعوة',
        description: `تم إرسال دعوة بنجاح إلى ${formData.email}`
      })
      setIsInviteModalOpen(false)
      setFormData({
        email: '',
        nameAr: '',
        phone: '',
        initial: '',
        role: 'sales',
      })
      fetchData()
    } catch (error: any) {
      toast({ 
        title: 'فشل إرسال الدعوة',
        description: error.message || 'حدث خطأ ما',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredEmployees = employees.filter(emp => 
    emp.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const pendingInvitations = invitations.filter(inv => inv.status === 'pending')

  return (
    <div className="p-8 space-y-8 animate-in fade-in-50 duration-500 ">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
        <div className="relative w-full md:w-96">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
          <Input 
            placeholder="بحث في الموظفين، البريد الإلكتروني..." 
            className="pr-12 bg-gray-50 border-transparent focus:bg-white focus:border-blue-100 focus:ring-4 focus:ring-blue-100/50 h-12 rounded-xl text-right transition-all duration-300 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Button 
          onClick={() => setIsInviteModalOpen(true)} 
          className="bg-blue-900 hover:bg-blue-800 h-12 px-6 rounded-xl gap-2 shadow-lg shadow-blue-900/10 w-full md:w-auto shrink-0"
        >
          <Plus className="w-5 h-5" />
          دعوة موظف جديد
        </Button>
      </div>

      <Tabs defaultValue="employees" className="w-full space-y-6" dir="rtl">
        <div className="flex flex-col sm:flex-row justify-start items-center gap-4">
          <TabsList className="bg-white border border-gray-100 p-1 rounded-xl h-12 w-full sm:w-auto overflow-x-auto overflow-y-hidden">
            <TabsTrigger value="employees" className="rounded-lg px-6 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 font-medium whitespace-nowrap">
              الموظفين النشطين ({employees.length})
            </TabsTrigger>
            <TabsTrigger value="invitations" className="rounded-lg px-6 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 font-medium whitespace-nowrap">
              دعوات معلقة ({pendingInvitations.length})
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="employees" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              Array(6).fill(0).map((_, i) => (
                <div key={i} className="h-48 bg-gray-50 rounded-2xl animate-pulse border border-gray-100" />
              ))
            ) : filteredEmployees.length === 0 ? (
              <div className="col-span-full bg-white rounded-3xl p-12 text-center border-2 border-dashed border-gray-100">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">لا يوجد موظفين</h3>
                <p className="text-gray-500 max-w-sm mx-auto mt-1">ابدأ بدعوة موظف جديد للانضمام إلى فريقك.</p>
              </div>
            ) : (
              filteredEmployees.map((emp) => (
                <DataCard
                  key={emp.id}
                  title={emp.nameAr}
                  subtitle={emp.email}
                  icon={Shield}
                  footerLabel="بدور:"
                  footerValue={ROLE_NAMES[emp.user.userRoles[0]?.role as keyof typeof ROLE_NAMES] || emp.user.userRoles[0]?.role}
                  className="hover:scale-[1.02] transform transition-all duration-300"
                  metadata={
                    <div className="space-y-3 mt-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="w-4 h-4 text-blue-500 shrink-0" />
                        <span dir="ltr" className="text-right inline-block">{emp.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-4 h-4 text-blue-500 shrink-0" />
                        <span dir="ltr" className="text-right inline-block">{emp.phone || 'لا يوجد هاتف'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <div className="w-4 h-4 rounded-full bg-blue-50 flex items-center justify-center text-[10px] font-bold text-blue-600 shrink-0">
                          {emp.initial}
                        </div>
                        <span>مرجع: <span dir="ltr" className="inline-block font-semibold">{emp.initial}</span></span>
                      </div>
                    </div>
                  }
                />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="invitations" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-48 bg-gray-50 rounded-2xl animate-pulse border border-gray-100" />
              ))
            ) : pendingInvitations.length === 0 ? (
              <div className="col-span-full bg-white rounded-3xl p-12 text-center border-2 border-dashed border-gray-100">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">لا توجد دعوات معلقة</h3>
              </div>
            ) : (
              pendingInvitations.map((inv) => (
                <DataCard
                  key={inv.id}
                  title={inv.nameAr}
                  subtitle={inv.email}
                  icon={Mail}
                  footerLabel="تنتهي في:"
                  footerValue={new Date(inv.expiresAt).toLocaleDateString('ar-EG')}
                  className="border-dashed border-blue-200 bg-blue-50/10"
                  metadata={
                    <div className="space-y-3 mt-4">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="w-4 h-4 text-orange-500" />
                            <span>مرسلة بتاريخ: <span dir="ltr" className="inline-block">{new Date(inv.createdAt).toLocaleDateString('ar-EG')}</span></span>
                         </div>
                         <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-100">معلقة</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Shield className="w-4 h-4 text-blue-500" />
                        <span>بدور: {ROLE_NAMES[inv.role as keyof typeof ROLE_NAMES] || inv.role}</span>
                      </div>
                    </div>
                  }
                />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Invite Modal */}
      <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-600" />
              دعوة موظف جديد
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleInvite} className="space-y-5">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني *</Label>
                <Input
                  id="email"
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-gray-50 border-gray-100 h-11 rounded-xl text-left"
                  dir="ltr"
                  placeholder="name@company.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nameAr">اسم الموظف (بالعربي) *</Label>
                <Input
                  id="nameAr"
                  required
                  value={formData.nameAr}
                  onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                  className="bg-gray-50 border-gray-100 h-11 rounded-xl text-right"
                  placeholder="محمد علي"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="initial">الحرف المرجعي *</Label>
                  <Input
                    id="initial"
                    required
                    value={formData.initial}
                    onChange={(e) => setFormData({ ...formData, initial: e.target.value.toUpperCase().slice(0, 2) })}
                    className="bg-gray-50 border-gray-100 h-11 rounded-xl text-center font-bold"
                    placeholder="MA"
                    maxLength={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">الدور في النظام *</Label>
                  <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })} dir="rtl">
                    <SelectTrigger className="bg-gray-50 border-gray-100 h-11 rounded-xl text-right">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent dir="rtl">
                      <SelectItem value="admin">مدير نظام</SelectItem>
                      <SelectItem value="sales">موظف مبيعات</SelectItem>
                      <SelectItem value="booking">موظف حجوزات</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">رقم الهاتف (اختياري)</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="bg-gray-50 border-gray-100 h-11 rounded-xl text-left"
                  dir="ltr"
                  placeholder="+90 XXX XXX XXXX"
                />
              </div>
            </div>

            <DialogFooter className="gap-3 sm:justify-start">
              <Button 
                type="submit" 
                disabled={isSubmitting} 
                className="bg-blue-900 hover:bg-blue-800 h-12 flex-1 rounded-xl"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin ml-2" />
                    جاري إرسال الدعوة...
                  </>
                ) : 'إرسال رابط التفعيل'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsInviteModalOpen(false)}
                className="h-12 px-6 rounded-xl"
              >
                إلغاء
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

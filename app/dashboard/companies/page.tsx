
'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog'
import { useToast } from '@/hooks/use-toast'
import api from '@/lib/api-client'

interface Company {
  id: string
  nameEn: string
  isActive: boolean
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null)
  const [deleteCompany, setDeleteCompany] = useState<Company | null>(null)
  
  // Form State
  const [formData, setFormData] = useState({
    nameEn: ''
  })

  const { toast } = useToast()

  const fetchCompanies = async () => {
    try {
      const data = await api.get('/api/companies')
      setCompanies(data)
    } catch (error) {
      console.error('Failed to fetch companies', error)
      toast({ 
        title: 'خطأ',
        description: 'فشل تحميل قائمة الشركات',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCompanies()
  }, [])

  const handleOpenModal = (company?: Company) => {
    if (company) {
      setCurrentCompany(company)
      setFormData({
        nameEn: company.nameEn
      })
    } else {
      setCurrentCompany(null)
      setFormData({
        nameEn: ''
      })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (currentCompany) {
        await api.put(`/api/companies/${currentCompany.id}`, {
          name_en: formData.nameEn
        })
        toast({ title: 'تم التحديث بنجاح' })
      } else {
        await api.post('/api/companies', {
          name_en: formData.nameEn
        })
        toast({ title: 'تم الإضافة بنجاح' })
      }
      setIsModalOpen(false)
      fetchCompanies()
    } catch (error) {
      console.error(error)
      toast({ 
        title: 'خطأ',
        description: 'حدث خطأ أثناء الحفظ',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteCompany) return

    try {
      await api.delete(`/api/companies/${deleteCompany.id}`)
      toast({ title: 'تم الحذف بنجاح' })
      fetchCompanies()
    } catch (error) {
      console.error(error)
      toast({ 
        title: 'فشل الحذف',
        description: 'لا يمكن حذف هذه الشركة لأنها مرتبطة بسجلات أخرى.',
        variant: 'destructive'
      })
    } finally {
      setDeleteCompany(null)
    }
  }

  return (
    <div className="p-8 space-y-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-gray-900">الشركات</h2>
            <div className="p-1.5 bg-blue-50 rounded-md">
              <Building2 className="h-4 w-4 text-blue-700" />
            </div>
          </div>

          <Button onClick={() => handleOpenModal()} size="sm" className="gap-2 bg-blue-900 hover:bg-blue-800 shadow-sm transition-all hover:shadow-md h-8 text-xs px-3">
            <Plus className="h-3.5 w-3.5" />
            <span>إضافة شركة</span>
          </Button>
        </div> 

        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="text-right font-medium text-gray-500 py-4">اسم الشركة (إنجليزي)</TableHead>
              <TableHead className="text-center w-[120px] font-medium text-gray-500 py-4">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center py-12 text-muted-foreground">
                  جاري التحميل...
                </TableCell>
              </TableRow>
            ) : companies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center py-12 text-muted-foreground">
                  لا توجد شركات مضافة
                </TableCell>
              </TableRow>
            ) : (
              companies.map((company) => (
                <TableRow key={company.id} className="hover:bg-gray-50 border-b border-gray-50 transition-colors">
                  <TableCell className="font-semibold text-gray-900 whitespace-nowrap py-4 text-right" dir="ltr">{company.nameEn}</TableCell>
                  <TableCell className="py-4">
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-gray-400 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-colors"
                        onClick={() => handleOpenModal(company)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-gray-400 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
                        onClick={() => setDeleteCompany(company)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentCompany ? 'تعديل شركة' : 'إضافة شركة'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>اسم الشركة (إنجليزي) *</Label>
              <Input
                required
                value={formData.nameEn}
                onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                className="text-left"
                dir="ltr"
                placeholder="Company Name"
              />
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-blue-900 hover:bg-blue-800">
                {isSubmitting ? 'جاري الحفظ...' : 'حفظ'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmationDialog
        open={!!deleteCompany}
        onOpenChange={(open) => !open && setDeleteCompany(null)}
        onConfirm={confirmDelete}
        itemName={deleteCompany?.nameEn}
      />
    </div>
  )
}

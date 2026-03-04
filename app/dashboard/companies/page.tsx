
'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
}

export default function CompaniesPage() {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null)
  const [deleteCompany, setDeleteCompany] = useState<Company | null>(null)
  const [formData, setFormData] = useState({ nameEn: '' })
  const { toast } = useToast()

  // 1. DATA FETCHING: CACHE-FIRST
  const { data: companies = [], isLoading, isPlaceholderData } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const data = await api.get('/api/companies')
      return Array.isArray(data) ? data : []
    },
    staleTime: Infinity, // Reference data: stays in RAM instantly!
    placeholderData: (prev) => prev
  })

  // 2. MUTATIONS: CREATE & UPDATE
  const saveMutation = useMutation({
    mutationFn: async ({ id, payload }: { id?: string, payload: any }) => {
      if (id) {
        return api.put(`/api/companies/${id}`, payload)
      } else {
        return api.post('/api/companies', payload)
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      toast({ title: variables.id ? 'تم التحديث بنجاح' : 'تم الإضافة بنجاح' })
      setIsModalOpen(false)
      setFormData({ nameEn: '' })
      setCurrentCompany(null)
    },
    onError: (error) => {
      console.error(error)
      toast({ 
        title: 'خطأ',
        description: 'حدث خطأ أثناء الحفظ',
        variant: 'destructive'
      })
    }
  })

  // 3. MUTATIONS: DELETE WITH OPTIMISTIC UPDATES
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/companies/${id}`)
    },
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: ['companies'] })
      const previous = queryClient.getQueryData<Company[]>(['companies'])
      
      if (previous) {
        queryClient.setQueryData<Company[]>(
          ['companies'], 
          previous.filter(c => c.id !== deletedId)
        )
      }
      return { previous }
    },
    onError: (err, deletedId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['companies'], context.previous)
      }
      console.error(err)
      toast({ 
        title: 'فشل الحذف',
        description: 'لا يمكن حذف هذه الشركة لأنها مرتبطة بسجلات أخرى.',
        variant: 'destructive'
      })
    },
    onSuccess: () => {
      toast({ title: 'تم الحذف بنجاح' })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      setDeleteCompany(null)
    }
  })

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    saveMutation.mutate({ 
      id: currentCompany?.id, 
      payload: { name_en: formData.nameEn } 
    })
  }

  const confirmDelete = () => {
    if (!deleteCompany) return
    deleteMutation.mutate(deleteCompany.id)
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

        <div className={`transition-opacity duration-300 ${isPlaceholderData ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
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
              <Button type="submit" disabled={saveMutation.isPending} className="bg-blue-900 hover:bg-blue-800">
                {saveMutation.isPending ? 'جاري الحفظ...' : 'حفظ'}
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

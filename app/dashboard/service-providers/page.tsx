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

interface ServiceProvider {
  id: string
  name: string
  isActive: boolean
}

export default function ServiceProvidersPage() {
  const [providers, setProviders] = useState<ServiceProvider[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentProvider, setCurrentProvider] = useState<ServiceProvider | null>(null)
  const [deleteProvider, setDeleteProvider] = useState<ServiceProvider | null>(null)
  
  // Form State
  const [formData, setFormData] = useState({
    name: ''
  })

  const { toast } = useToast()

  const fetchProviders = async () => {
    try {
      const data = await api.get('/api/service-providers')
      setProviders(data)
    } catch (error) {
      console.error('Failed to fetch service providers', error)
      toast({ 
        title: 'خطأ',
        description: 'فشل تحميل قائمة مزودي الخدمات',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProviders()
  }, [])

  const handleOpenModal = (provider?: ServiceProvider) => {
    if (provider) {
      setCurrentProvider(provider)
      setFormData({
        name: provider.name
      })
    } else {
      setCurrentProvider(null)
      setFormData({
        name: ''
      })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (currentProvider) {
        await api.put(`/api/service-providers/${currentProvider.id}`, {
          name: formData.name
        })
        toast({ title: 'تم التحديث بنجاح' })
      } else {
        await api.post('/api/service-providers', {
          name: formData.name
        })
        toast({ title: 'تم الإضافة بنجاح' })
      }
      setIsModalOpen(false)
      fetchProviders()
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
    if (!deleteProvider) return

    try {
      await api.delete(`/api/service-providers/${deleteProvider.id}`)
      toast({ title: 'تم الحذف بنجاح' })
      fetchProviders()
    } catch (error) {
      console.error(error)
      toast({ 
        title: 'فشل الحذف',
        description: 'لا يمكن حذف مزود الخدمة لأنه مرتبط بسجلات أخرى.',
        variant: 'destructive'
      })
    } finally {
      setDeleteProvider(null)
    }
  }

  return (
    <div className="p-8 space-y-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-gray-900">مزودي الخدمات</h2>
            <div className="p-1.5 bg-blue-50 rounded-md">
              <Building2 className="h-4 w-4 text-blue-700" />
            </div>
          </div>

          <Button onClick={() => handleOpenModal()} size="sm" className="gap-2 bg-blue-900 hover:bg-blue-800 shadow-sm transition-all hover:shadow-md h-8 text-xs px-3">
            <Plus className="h-3.5 w-3.5" />
            <span>إضافة مزود</span>
          </Button>
        </div> 

        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="text-right font-medium text-gray-500 py-4">اسم المزود</TableHead>
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
            ) : providers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center py-12 text-muted-foreground">
                  لا يوجد مزودي خدمات مضافين
                </TableCell>
              </TableRow>
            ) : (
              providers.map((provider) => (
                <TableRow key={provider.id} className="hover:bg-gray-50 border-b border-gray-50 transition-colors">
                  <TableCell className="font-semibold text-gray-900 whitespace-nowrap py-4 text-right">{provider.name}</TableCell>
                  <TableCell className="py-4">
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-gray-400 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-colors"
                        onClick={() => handleOpenModal(provider)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-gray-400 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
                        onClick={() => setDeleteProvider(provider)}
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
              {currentProvider ? 'تعديل المزود' : 'إضافة مزود'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>اسم المزود *</Label>
              <Input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="أدخل اسم المزود"
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
        open={!!deleteProvider}
        onOpenChange={(open) => !open && setDeleteProvider(null)}
        onConfirm={confirmDelete}
        itemName={deleteProvider?.name}
      />
    </div>
  )
}

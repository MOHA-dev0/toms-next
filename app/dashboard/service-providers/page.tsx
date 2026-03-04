'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Building2, Search } from 'lucide-react'
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
}

export default function ServiceProvidersPage() {
  const queryClient = useQueryClient()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentProvider, setCurrentProvider] = useState<ServiceProvider | null>(null)
  const [deleteProvider, setDeleteProvider] = useState<ServiceProvider | null>(null)
  const [formData, setFormData] = useState({ name: '' })
  const { toast } = useToast()

  // Search State
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // 1. DATA FETCHING: CACHE-FIRST
  const { data: providers = [], isLoading, isPlaceholderData } = useQuery({
    queryKey: ['service-providers', debouncedSearch],
    queryFn: async () => {
      const data = await api.get(`/api/service-providers?search=${encodeURIComponent(debouncedSearch)}`)
      return Array.isArray(data) ? data : []
    },
    staleTime: Infinity, // Reference data
    placeholderData: (prev) => prev
  })

  // 2. MUTATIONS: CREATE & UPDATE
  const saveMutation = useMutation({
    mutationFn: async ({ id, payload }: { id?: string, payload: any }) => {
      if (id) {
        return api.put(`/api/service-providers/${id}`, payload)
      } else {
        return api.post('/api/service-providers', payload)
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['service-providers'] })
      toast({ title: variables.id ? 'تم التحديث بنجاح' : 'تم الإضافة بنجاح' })
      setIsModalOpen(false)
      setFormData({ name: '' })
      setCurrentProvider(null)
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
      await api.delete(`/api/service-providers/${id}`)
    },
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: ['service-providers'] })
      const previous = queryClient.getQueryData<ServiceProvider[]>(['service-providers', debouncedSearch])
      
      if (previous) {
        queryClient.setQueryData<ServiceProvider[]>(
          ['service-providers', debouncedSearch], 
          previous.filter(p => p.id !== deletedId)
        )
      }
      return { previous }
    },
    onError: (err, deletedId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['service-providers', debouncedSearch], context.previous)
      }
      console.error(err)
      toast({ 
        title: 'فشل الحذف',
        description: 'لا يمكن حذف مزود الخدمة لأنه مرتبط بسجلات أخرى.',
        variant: 'destructive'
      })
    },
    onSuccess: () => {
      toast({ title: 'تم الحذف بنجاح' })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['service-providers'] })
      setDeleteProvider(null)
    }
  })

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    saveMutation.mutate({ 
      id: currentProvider?.id, 
      payload: { name: formData.name } 
    })
  }

  const confirmDelete = () => {
    if (!deleteProvider) return
    deleteMutation.mutate(deleteProvider.id)
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

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                className="pr-10 text-right w-full"
                placeholder="بحث بالاسم..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Button onClick={() => handleOpenModal()} size="sm" className="gap-2 bg-blue-900 hover:bg-blue-800 shadow-sm transition-all hover:shadow-md h-9 text-xs px-4 w-full sm:w-auto">
              <Plus className="h-3.5 w-3.5" />
              <span>إضافة مزود</span>
            </Button>
          </div>
        </div> 

        <div className={`transition-opacity duration-300 ${isPlaceholderData ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
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
              <Button type="submit" disabled={saveMutation.isPending} className="bg-blue-900 hover:bg-blue-800">
                {saveMutation.isPending ? 'جاري الحفظ...' : 'حفظ'}
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

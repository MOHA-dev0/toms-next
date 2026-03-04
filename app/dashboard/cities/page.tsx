'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, MapPin } from 'lucide-react'
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

interface City {
  id: string
  nameAr: string
  nameTr: string | null
  countryAr: string
  isActive: boolean
}

export default function CitiesPage() {
  const queryClient = useQueryClient()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentCity, setCurrentCity] = useState<City | null>(null)
  const [deleteCity, setDeleteCity] = useState<City | null>(null)
  
  // Form State
  const [formData, setFormData] = useState({
    nameAr: '',
    nameTr: '',
    countryAr: 'تركيا'
  })

  const { toast } = useToast()

  // 1. DATA FETCHING: CACHE-FIRST
  // cities rarely change, so staleTime is Infinity
  const { data: cities = [], isLoading } = useQuery({
    queryKey: ['cities'],
    queryFn: async () => {
      const data = await api.get('/api/cities')
      return data
    },
    staleTime: Infinity,
  })

  // 2. MUTATIONS: CREATE & UPDATE
  const saveMutation = useMutation({
    mutationFn: async ({ id, payload }: { id?: string, payload: any }) => {
      if (id) {
        return api.put(`/api/cities/${id}`, payload)
      } else {
        return api.post('/api/cities', payload)
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cities'] })
      toast({ title: variables.id ? 'تم التحديث بنجاح' : 'تم الإضافة بنجاح' })
      setIsModalOpen(false)
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
      await api.delete(`/api/cities/${id}`)
    },
    onMutate: async (deletedId) => {
      // Optimistic Update: cancel outgoing queries and remove item from cache locally
      await queryClient.cancelQueries({ queryKey: ['cities'] })
      const previousCities = queryClient.getQueryData<City[]>(['cities'])
      
      if (previousCities) {
        queryClient.setQueryData<City[]>(
          ['cities'], 
          previousCities.filter(c => c.id !== deletedId)
        )
      }
      return { previousCities }
    },
    onError: (err, deletedId, context) => {
      // Revert if API fails
      if (context?.previousCities) {
        queryClient.setQueryData(['cities'], context.previousCities)
      }
      console.error(err)
      toast({ 
        title: 'فشل الحذف',
        description: 'لا يمكن حذف هذه المدينة لأنها مرتبطة بسجلات أخرى.',
        variant: 'destructive'
      })
    },
    onSuccess: () => {
      toast({ title: 'تم الحذف بنجاح' })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cities'] })
      setDeleteCity(null)
    }
  })

  const handleOpenModal = (city?: City) => {
    if (city) {
      setCurrentCity(city)
      setFormData({
        nameAr: city.nameAr,
        nameTr: city.nameTr || '',
        countryAr: city.countryAr
      })
    } else {
      setCurrentCity(null)
      setFormData({
        nameAr: '',
        nameTr: '',
        countryAr: 'تركيا'
      })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Capitalize first letter of Turkish name if it exists
    const formattedNameTr = formData.nameTr 
      ? formData.nameTr.charAt(0).toUpperCase() + formData.nameTr.slice(1) 
      : formData.nameTr

    const payload = {
      name_ar: formData.nameAr,
      name_tr: formattedNameTr,
      country_ar: formData.countryAr
    }

    saveMutation.mutate({ id: currentCity?.id, payload })
  }

  const confirmDelete = () => {
    if (!deleteCity) return
    deleteMutation.mutate(deleteCity.id)
  }

  return (
    <div className="p-8 space-y-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-gray-900">المدن</h2>
            <div className="p-1.5 bg-blue-50 rounded-md">
              <MapPin className="h-4 w-4 text-blue-700" />
            </div>
          </div>

          <Button onClick={() => handleOpenModal()} size="sm" className="gap-2 bg-blue-900 hover:bg-blue-800 shadow-sm transition-all hover:shadow-md h-8 text-xs px-3">
            <Plus className="h-3.5 w-3.5" />
            <span>إضافة مدينة</span>
          </Button>
        </div> 

        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="text-right font-medium text-gray-500 py-4">الاسم (عربي)</TableHead>
              <TableHead className="text-right font-medium text-gray-500 py-4">الاسم (تركي)</TableHead>
              <TableHead className="text-right font-medium text-gray-500 py-4">الدولة</TableHead>
              <TableHead className="text-center w-[120px] font-medium text-gray-500 py-4">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                  جاري التحميل...
                </TableCell>
              </TableRow>
            ) : cities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                  لا توجد مدن مضافة
                </TableCell>
              </TableRow>
            ) : (
              cities.map((city: City) => (
                <TableRow key={city.id} className="hover:bg-gray-50 border-b border-gray-50 transition-colors">
                  <TableCell className="font-semibold text-gray-900 whitespace-nowrap py-4">{city.nameAr}</TableCell>
                  <TableCell className="text-gray-600 whitespace-nowrap py-4">{city.nameTr || '-'}</TableCell>
                  <TableCell className="text-gray-600 whitespace-nowrap py-4">{city.countryAr}</TableCell>
                  <TableCell className="py-4">
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-gray-400 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-colors"
                        onClick={() => handleOpenModal(city)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-gray-400 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
                        onClick={() => setDeleteCity(city)}
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
              {currentCity ? 'تعديل مدينة' : 'إضافة مدينة'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>الاسم (عربي) *</Label>
              <Input
                required
                value={formData.nameAr}
                onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                className="text-right"
              />
            </div>
            <div className="space-y-2">
              <Label>الاسم (تركي)</Label>
              <Input
                value={formData.nameTr}
                onChange={(e) => setFormData({ ...formData, nameTr: e.target.value })}
                className="text-right"
              />
            </div>
            <div className="space-y-2">
              <Label>الدولة</Label>
              <Input
                value={formData.countryAr}
                onChange={(e) => setFormData({ ...formData, countryAr: e.target.value })}
                className="text-right"
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
        open={!!deleteCity}
        onOpenChange={(open) => !open && setDeleteCity(null)}
        onConfirm={confirmDelete}
        itemName={deleteCity?.nameAr}
      />
    </div>
  )
}

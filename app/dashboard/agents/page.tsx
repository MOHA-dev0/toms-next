
'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Briefcase, Search } from 'lucide-react'
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
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog'
import { useToast } from '@/hooks/use-toast'
import api from '@/lib/api-client'

import { DataCard } from '@/components/ui/data-card'
import Image from 'next/image'

interface Agent {
  id: string
  nameEn: string
  logoUrl?: string
}

export default function AgentsPage() {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null)
  const [deleteAgent, setDeleteAgent] = useState<Agent | null>(null)
  const [formData, setFormData] = useState({ nameEn: '', logoUrl: '' })
  const [searchQuery, setSearchQuery] = useState('')
  const { toast } = useToast()

  // 1. DATA FETCHING: CACHE-FIRST
  const { data: agents = [], isLoading, isPlaceholderData } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const data = await api.get('/api/agents')
      return Array.isArray(data) ? data : []
    },
    staleTime: Infinity, // Reference data: stays in RAM instantly!
    placeholderData: (prev) => prev
  })

  // 2. MUTATIONS: CREATE & UPDATE
  const saveMutation = useMutation({
    mutationFn: async ({ id, payload }: { id?: string, payload: any }) => {
      if (id) {
        return api.put(`/api/agents/${id}`, payload)
      } else {
        return api.post('/api/agents', payload)
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['agents'] })
      toast({ title: variables.id ? 'تم التحديث بنجاح' : 'تم الإضافة بنجاح' })
      setIsModalOpen(false)
      setFormData({ nameEn: '', logoUrl: '' })
      setCurrentAgent(null)
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
      await api.delete(`/api/agents/${id}`)
    },
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: ['agents'] })
      const previous = queryClient.getQueryData<Agent[]>(['agents'])
      
      if (previous) {
        queryClient.setQueryData<Agent[]>(
          ['agents'], 
          previous.filter(a => a.id !== deletedId)
        )
      }
      return { previous }
    },
    onError: (err, deletedId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['agents'], context.previous)
      }
      console.error(err)
      toast({ 
        title: 'فشل الحذف',
        description: 'لا يمكن حذف هذا الوكيل لأنه مرتبط بسجلات أخرى.',
        variant: 'destructive'
      })
    },
    onSuccess: () => {
      toast({ title: 'تم الحذف بنجاح' })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] })
      setDeleteAgent(null)
    }
  })

  const handleOpenModal = (agent?: Agent) => {
    if (agent) {
      setCurrentAgent(agent)
      setFormData({
        nameEn: agent.nameEn,
        logoUrl: agent.logoUrl || '',
      })
    } else {
      setCurrentAgent(null)
      setFormData({
        nameEn: '',
        logoUrl: '',
      })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    saveMutation.mutate({ 
      id: currentAgent?.id, 
      payload: formData 
    })
  }

  const confirmDelete = () => {
    if (!deleteAgent) return
    deleteMutation.mutate(deleteAgent.id)
  }

  const filteredAgents = agents.filter(agent => 
    agent.nameEn.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
 <div className="p-8 space-y-6 animate-in fade-in-50 duration-500">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">


        {/* Left Side: Search & Actions */}
        <div className="flex flex-col md:flex-row items-center gap-3 w-full">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input 
              placeholder="بحث عن وكيل..." 
              className="pr-10 text-right"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={() => handleOpenModal()} className="gap-2 bg-blue-900 hover:bg-blue-800 shadow-sm w-full md:w-auto">
            <Plus className="h-4 w-4" />
            <span>إضافة وكيل</span>
          </Button>
        </div>
      </div>

      {/* Agents Grid */}
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-opacity duration-300 ${isPlaceholderData ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
        {isLoading ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">جاري التحميل...</div>
        ) : filteredAgents.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">لا يوجد وكلاء</div>
        ) : (
          filteredAgents.map((agent) => (
            <DataCard
              key={agent.id}
              title={agent.nameEn}
              icon={Briefcase}
              actions={
                <>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-blue-700 hover:bg-blue-50" onClick={() => handleOpenModal(agent)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-700 hover:bg-red-50" onClick={() => setDeleteAgent(agent)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              }
              metadata={
                agent.logoUrl ? (
                  <div className="flex justify-center my-4">
                    <div className="h-24 w-24 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden shrink-0 shadow-sm p-4">
                      <img src={agent.logoUrl} alt={agent.nameEn} className="w-full h-full object-contain" />
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-center my-4">
                     <div className="h-24 w-24 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden shrink-0 shadow-sm p-4">
                        <Briefcase className="h-10 w-10 text-gray-300" />
                     </div>
                  </div>
                )
              }
            />
          ))
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {currentAgent ? 'تعديل وكيل' : 'إضافة وكيل'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Agency Name (English) *</Label>
                <Input
                  required
                  value={formData.nameEn}
                  onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                  className="text-left"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>رابط الشعار (Logo URL)</Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.logoUrl}
                    onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                    className="text-left"
                    dir="ltr"
                    placeholder="https://..."
                  />
                  {formData.logoUrl && (
                    <div className="h-10 w-10 border rounded bg-gray-50 shrink-0 overflow-hidden">
                      <img src={formData.logoUrl} alt="Preview" className="h-full w-full object-contain" />
                    </div>
                  )}
                </div>
              </div>
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
        open={!!deleteAgent}
        onOpenChange={(open) => !open && setDeleteAgent(null)}
        onConfirm={confirmDelete}
        itemName={deleteAgent?.nameEn}
      />
    </div>
  )
}

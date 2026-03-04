
'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api-client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Edit, Trash2, Layers } from 'lucide-react';
import { OtherServiceForm } from '@/components/services/OtherServiceForm';
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';
import { DataCard } from '@/components/ui/data-card';
import { toast } from 'sonner';

interface OtherService {
  id: string;
  nameAr: string;
  nameEn?: string | null;
  descriptionAr?: string | null;
  purchasePrice: number;
  sellingPrice: number;
  currency: string;
}

export default function OtherServicesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<OtherService | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const queryClient = useQueryClient();

  // Fetch Other Services (Fetch ONCE, Keep indefinitely in RAM)
  const { data: services = [], isLoading } = useQuery({
    queryKey: ['other-services'],
    queryFn: async () => {
      const res = await api.get('/api/other-services');
      return Array.isArray(res) ? res : [];
    },
    staleTime: Infinity
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/api/other-services/${id}`);
    },
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: ['other-services'] });
      const previousServices = queryClient.getQueryData<OtherService[]>(['other-services']);
      
      if (previousServices) {
        queryClient.setQueryData<OtherService[]>(
          ['other-services'],
          previousServices.filter(s => s.id !== deletedId)
        );
      }
      return { previousServices };
    },
    onError: (err, deletedId, context) => {
      if (context?.previousServices) {
        queryClient.setQueryData(['other-services'], context.previousServices);
      }
      toast.error('حدث خطأ أثناء الحذف.');
    },
    onSuccess: () => {
      toast.success('تم حذف الخدمة بنجاح');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['other-services'] });
      setDeleteId(null);
    }
  });

  const handleEdit = (service: OtherService) => {
    setEditingService(service);
    setIsFormOpen(true);
  };

  const handleCloseForm = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) setEditingService(null);
  };

  // Client-Side Filtering (Instant rendering, 0ms delay)
  const filteredServices = services.filter((service: OtherService) =>
    service.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (service.nameEn && service.nameEn.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-8 space-y-6 animate-in fade-in-50 duration-500">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        {/* Left Side: Search & Actions */}
        <div className="flex flex-col md:flex-row items-center gap-3 w-full">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input 
              placeholder="بحث عن خدمة..." 
              className="pr-10 text-right w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <OtherServiceForm 
            open={isFormOpen} 
            onOpenChange={handleCloseForm}
            initialData={editingService ? {
              ...editingService,
              nameEn: editingService.nameEn || '',
              descriptionAr: editingService.descriptionAr || '',
              purchasePrice: String(editingService.purchasePrice || '0') as any,
              sellingPrice: String(editingService.sellingPrice || '0') as any,
            } : undefined}
          />
        </div>
      </div>

      {/* Services Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
           {[1, 2, 3].map(i => (
             <div key={i} className="h-40 bg-gray-100 rounded-xl" />
           ))}
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed text-muted-foreground">
          لا توجد خدمات تطابق بحثك
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" dir="rtl">
           {filteredServices.map((service: OtherService) => (
             <DataCard
               key={service.id}
               title={service.nameAr}
               subtitle={service.nameEn || undefined}
               icon={Layers}
               actions={
                 <>
                   <Button 
                     variant="ghost" 
                     size="icon" 
                     className="h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full"
                     onClick={() => handleEdit(service)}
                   >
                     <Edit className="w-4 h-4" />
                   </Button>
                   <Button 
                     variant="ghost" 
                     size="icon" 
                     className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full"
                     onClick={() => setDeleteId(service.id)}
                   >
                     <Trash2 className="w-4 h-4" />
                   </Button>
                 </>
               }
               metadata={
                 service.descriptionAr && (
                   <div className="text-xs text-muted-foreground mt-1">
                     {service.descriptionAr}
                   </div>
                 )
               }
               footerLabel="التكلفة:"
               footerValue={service.purchasePrice}
               footerValueSub={service.currency}
             />
           ))}
        </div>
      )}

      <DeleteConfirmationDialog 
        open={!!deleteId} 
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        itemName="هذه الخدمة"
      />
    </div>
  );
}

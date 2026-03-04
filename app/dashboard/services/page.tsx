
'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api-client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MapPin, Edit, Trash2, Map } from 'lucide-react';
import { ServiceForm } from '@/components/services/ServiceForm';
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';
import { DataCard } from '@/components/ui/data-card';
import { toast } from 'sonner';

interface Service {
  id: string;
  nameAr: string;
  nameEn?: string | null;
  cityId: string;
  purchasePrice: number;
  currency: string;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  city?: { nameAr: string } | null;
}

export default function ServicesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const queryClient = useQueryClient();

  // Fetch Cities (Reference Data - Infinity Cache)
  const { data: cities = [] } = useQuery({
    queryKey: ['cities'],
    queryFn: async () => {
      const res = await api.get('/api/cities');
      return Array.isArray(res) ? res : [];
    },
    staleTime: Infinity
  });

  // Fetch Services (Fetch ONCE, Client-Side Filtered, ZERO-LATENCY)
  const { data: services = [], isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const res = await api.get('/api/services');
      return Array.isArray(res) ? res : [];
    },
    staleTime: Infinity // Keep in memory permanently
  });

  // Client-Side Filtering (Instant rendering, 0ms delay)
  const filteredServices = services.filter((service: Service) =>
    service.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (service.nameEn && service.nameEn.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/api/services/${id}`);
    },
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: ['services'] });
      const previousServices = queryClient.getQueryData<Service[]>(['services']);
      
      if (previousServices) {
        queryClient.setQueryData<Service[]>(
          ['services'],
          previousServices.filter(s => s.id !== deletedId)
        );
      }
      return { previousServices };
    },
    onError: (err, deletedId, context) => {
      if (context?.previousServices) {
        queryClient.setQueryData(['services'], context.previousServices);
      }
      toast.error('حدث خطأ أثناء الحذف، قد تكون الخدمة مرتبطة بعروض سابقة.');
    },
    onSuccess: () => {
      toast.success('تم حذف الخدمة بنجاح');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setDeleteId(null);
    }
  });

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setIsFormOpen(true);
  };

  const handleCloseForm = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) setEditingService(null);
  };
  // No need for client filtering because it's now handled server-side!

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
          <ServiceForm 
            cities={cities} 
            open={isFormOpen} 
            onOpenChange={handleCloseForm}
            initialData={editingService ? {
              ...editingService,
              nameEn: editingService.nameEn || '',
              descriptionAr: editingService.descriptionAr || '',
              descriptionEn: editingService.descriptionEn || '',
              purchasePrice: String(editingService.purchasePrice || '0'),
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
           {filteredServices.map((service: Service) => (
             <DataCard
               key={service.id}
               title={service.nameAr}
               subtitle={service.nameEn || undefined}
               icon={Map}
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
                 <div className="flex items-center gap-1 text-xs text-muted-foreground justify-end">
                   <span>{service.city?.nameAr}</span>
                   <MapPin className="w-3 h-3" />
                 </div>
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

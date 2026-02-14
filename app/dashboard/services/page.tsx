
'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api-client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MapPin, Edit, Trash2, Map } from 'lucide-react';
import { ServiceForm } from '@/components/services/ServiceForm';
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';
import { toast } from 'sonner';

export default function ServicesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const queryClient = useQueryClient();

  // Fetch Cities
  const { data: cities = [] } = useQuery({
    queryKey: ['cities'],
    queryFn: async () => {
      const res = await api.get('/api/cities');
      return Array.isArray(res) ? res : [];
    }
  });

  // Fetch Services
  const { data: services = [], isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const res = await api.get('/api/services');
      return Array.isArray(res) ? res : [];
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/api/services/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('تم حذف الخدمة بنجاح');
      setDeleteId(null);
    },
    onError: () => {
      toast.error('حدث خطأ أثناء الحذف');
    }
  });

  const handleEdit = (service: any) => {
    setEditingService(service);
    setIsFormOpen(true);
  };

  const handleCloseForm = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) setEditingService(null);
  };

  const filteredServices = services.filter((service: any) =>
    service.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (service.nameEn && service.nameEn.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-8 space-y-6 animate-in fade-in-50 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 order-2 md:order-1 w-full md:w-auto">
          <ServiceForm 
            cities={cities} 
            open={isFormOpen} 
            onOpenChange={handleCloseForm}
            initialData={editingService}
          />
        </div>
        
        <div className="flex items-center gap-2 order-1 md:order-2 w-full md:w-auto justify-end">
          <div className="text-right">
            <h2 className="text-2xl font-bold text-gray-900">الخدمات</h2>
            <p className="text-sm text-gray-500">إدارة الخدمات</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="relative">
           <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
           <Input 
             placeholder="بحث عن خدمة..." 
             className="pr-10 text-right"
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
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
           {filteredServices.map((service: any) => (
             <div key={service.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100 p-5 group relative overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                   <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full"
                        onClick={() => setDeleteId(service.id)}
                      >
                         <Trash2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full"
                        onClick={() => handleEdit(service)}
                      >
                         <Edit className="w-4 h-4" />
                      </Button>
                   </div>
                   
                   <div className="text-right">
                      <div className="flex items-center justify-end gap-2 mb-1">
                         <h3 className="font-bold text-gray-900 text-lg">{service.nameAr}</h3>
                         <div className="bg-slate-100 p-1.5 rounded-lg text-slate-600">
                            <Map className="w-4 h-4" />
                         </div>
                      </div>
                      <div className="text-sm text-gray-500 font-medium mb-1" dir="ltr">{service.nameEn}</div>
                      
                      <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                         <span>{service.city?.nameAr}</span>
                         <MapPin className="w-3 h-3" />
                      </div>
                   </div>
                </div>
                
                <div className="pt-4 border-t border-gray-50 flex justify-between items-center text-sm">
                   <div className="font-bold text-gray-900" dir="ltr">
                      {service.purchasePrice} <span className="text-xs text-gray-500 font-medium">{service.currency}</span>
                   </div>
                   <div className="text-gray-500 font-medium">التكلفة:</div>
                </div>
             </div>
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

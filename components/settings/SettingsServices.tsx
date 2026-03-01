import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { Plus, Edit, Trash2, Search, Map, MapPin, FileText } from 'lucide-react';
import api from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';

interface City {
  id: string;
  nameAr: string;
}

interface Service {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  cityId: string;
  purchasePrice: number;
  currency: string;
  city?: City;
}

interface ServiceFormValues {
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  cityId: string;
  purchasePrice: number;
  currency: string;
}

export function SettingsServices() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: cities = [] } = useQuery({
    queryKey: ['cities'],
    queryFn: async () => {
      const res = await api.get('/cities');
      return res.data;
    }
  });

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const res = await api.get('/services');
      return res.data;
    }
  });

  const filteredServices = services.filter((service: Service) => 
    service.nameAr.includes(searchQuery) || 
    (service.nameEn && service.nameEn.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (service.descriptionAr && service.descriptionAr.includes(searchQuery))
  );

  const { register, control, handleSubmit, reset, formState: { errors } } = useForm<ServiceFormValues>({
    defaultValues: {
      nameAr: '',
      nameEn: '',
      descriptionAr: '',
      descriptionEn: '',
      cityId: '',
      purchasePrice: 0,
      currency: 'USD'
    }
  });

  const openEditDialog = (service: Service) => {
    setEditingService(service);
    reset({
      nameAr: service.nameAr,
      nameEn: service.nameEn || '',
      descriptionAr: service.descriptionAr || '',
      descriptionEn: service.descriptionEn || '',
      cityId: service.cityId,
      purchasePrice: service.purchasePrice,
      currency: service.currency || 'USD'
    });
    setIsDialogOpen(true);
  };

  const handleOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingService(null);
      reset({
        nameAr: '',
        nameEn: '',
        descriptionAr: '',
        descriptionEn: '',
        cityId: '',
        purchasePrice: 0,
        currency: 'USD'
      });
    }
  };

  const mutation = useMutation({
    mutationFn: async (data: ServiceFormValues) => {
      if (editingService) {
        await api.put(`/services/${editingService.id}`, data);
      } else {
        await api.post('/services', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast({ title: editingService ? 'تم التحديث' : 'تم الإضافة', description: 'تم حفظ الخدمة بنجاح' });
      handleOpenChange(false);
    },
    onError: () => {
      toast({ title: 'خطأ', description: 'حدث خطأ أثناء حفظ الخدمة', variant: 'destructive' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/services/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast({ title: 'تم الحذف', description: 'تم حذف الخدمة بنجاح' });
      setDeleteId(null);
    },
    onError: () => {
      toast({ title: 'خطأ', description: 'فشل في حذف الخدمة', variant: 'destructive' });
    }
  });

  const onSubmit = (data: ServiceFormValues) => {
    mutation.mutate(data);
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-muted/20 p-4 rounded-lg">
        <div className="relative w-full md:w-1/3">
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث عن خدمة..."
            className="pr-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          إضافة خدمة
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
        <DialogContent dir="rtl" className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingService ? 'تعديل الخدمة' : 'إضافة خدمة جديدة'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Service Name (Arabic - internal only) */}
            <div className="space-y-2">
              <Label>
                اسم الخدمة (عربي) <span className="text-red-500">*</span>
                <span className="text-xs text-gray-400 mr-2">(للاستخدام الداخلي فقط)</span>
              </Label>
              <Input {...register('nameAr', { required: 'الاسم بالعربي مطلوب' })} placeholder="مثال: جولة البسفور" />
              {errors.nameAr && <span className="text-red-500 text-sm">{errors.nameAr.message}</span>}
            </div>

            {/* City, Price, Currency */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>المدينة <span className="text-red-500">*</span></Label>
                <Controller
                  name="cityId"
                  control={control}
                  rules={{ required: 'المدينة مطلوبة' }}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <SelectTrigger dir="rtl">
                        <SelectValue placeholder="اختر المدينة" />
                      </SelectTrigger>
                      <SelectContent dir="rtl">
                        {cities.map((city: City) => (
                          <SelectItem key={city.id} value={city.id}>
                            {city.nameAr}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.cityId && <span className="text-red-500 text-sm">{errors.cityId.message}</span>}
              </div>
              <div className="space-y-2">
                <Label>سعر التكلفة</Label>
                <Input type="number" step="0.01" {...register('purchasePrice')} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label>العملة</Label>
                <Controller
                  name="currency"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <SelectTrigger dir="rtl">
                        <SelectValue placeholder="العملة" />
                      </SelectTrigger>
                      <SelectContent dir="rtl">
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="TRY">TRY</SelectItem>
                        <SelectItem value="SAR">SAR</SelectItem>
                        <SelectItem value="AED">AED</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            {/* Descriptions Section */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                📝 وصف الخدمة
                <span className="text-xs font-normal text-gray-400">(يظهر في عروض الأسعار والفواتير)</span>
              </h4>
            </div>

            {/* Description Arabic */}
            <div className="space-y-2">
              <Label>
                الوصف بالعربي
                <span className="text-xs text-amber-600 mr-2">(يظهر للعملاء في العروض العربية)</span>
              </Label>
              <textarea
                {...register('descriptionAr')}
                placeholder="بعد تناول الافطار في الفندق ننطلق في رحلتنا ونبدأ بزيارة..."
                className="w-full min-h-[120px] p-3 border rounded-md text-right resize-y text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                dir="rtl"
              />
            </div>

            {/* Description English */}
            <div className="space-y-2">
              <Label>
                الوصف بالإنجليزي
                <span className="text-xs text-amber-600 mr-2">(يظهر للعملاء في العروض الإنجليزية)</span>
              </Label>
              <textarea
                {...register('descriptionEn')}
                placeholder="After breakfast at the hotel, we start our trip by visiting..."
                className="w-full min-h-[120px] p-3 border rounded-md text-left resize-y text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                dir="ltr"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>إلغاء</Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'جاري الحفظ...' : 'حفظ'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Service Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map((service: Service) => (
          <div key={service.id} className="card-elevated p-6 bg-card text-card-foreground">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-lg text-primary">
                  <Map className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{service.nameAr}</h3>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => openEditDialog(service)}>
                  <Edit className="w-4 h-4 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setDeleteId(service.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <MapPin className="w-4 h-4" />
              <span>{service.city?.nameAr || 'غير محدد'}</span>
            </div>

            {/* Description preview */}
            {service.descriptionAr && (
              <div className="mb-3 p-2 bg-gray-50 rounded border border-gray-100">
                <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                  <FileText className="w-3 h-3" />
                  <span>الوصف</span>
                </div>
                <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                  {service.descriptionAr}
                </p>
              </div>
            )}

            {/* Description EN indicator */}
            {service.descriptionEn && (
              <div className="mb-3 flex items-center gap-1 text-xs text-green-600">
                <span>✓</span>
                <span>يوجد وصف إنجليزي</span>
              </div>
            )}

            <div className="flex justify-between items-center text-sm pt-4 border-t">
              <span className="text-muted-foreground">التكلفة:</span>
              <span className="font-mono font-medium" dir="ltr">
                {service.purchasePrice} {service.currency}
              </span>
            </div>
          </div>
        ))}
        {filteredServices.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            <Map className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p>{searchQuery ? 'لا توجد خدمات تطابق بحثك' : 'لا توجد خدمات مضافة بعد'}</p>
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">هل أنت متأكد من الحذف؟</AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              سيتم حذف الخدمة نهائياً. لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 sm:justify-end">
            <AlertDialogCancel className="mt-0">إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

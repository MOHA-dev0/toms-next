
import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import api from '@/lib/api-client';
import { toast } from 'sonner';

interface ServiceFormValues {
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  cityId: string;
  purchasePrice: string;
  currency: string;
}

interface ServiceFormProps { 
  cities: any[]; 
  triggerButton?: React.ReactNode;
  initialData?: ServiceFormValues & { id?: string };
  id?: string;
  onSuccess?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ServiceForm({ cities, triggerButton, initialData, onSuccess, open: controlledOpen, onOpenChange }: ServiceFormProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const queryClient = useQueryClient();

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (onOpenChange || (() => {})) : setInternalOpen;

  const { register, control, handleSubmit, reset, formState: { errors } } = useForm<ServiceFormValues>({
    defaultValues: {
      nameAr: '',
      nameEn: '',
      descriptionAr: '',
      descriptionEn: '',
      cityId: '',
      purchasePrice: '',
      currency: 'USD'
    }
  });

  useEffect(() => {
    if (open && initialData) {
      reset({
        nameAr: initialData.nameAr,
        nameEn: initialData.nameEn || '',
        descriptionAr: initialData.descriptionAr || '',
        descriptionEn: initialData.descriptionEn || '',
        cityId: initialData.cityId,
        purchasePrice: String(initialData.purchasePrice || '0'),
        currency: initialData.currency || 'USD'
      });
    } else if (open && !initialData) {
      reset({
        nameAr: '',
        nameEn: '',
        descriptionAr: '',
        descriptionEn: '',
        cityId: '',
        purchasePrice: '',
        currency: 'USD'
      });
    }
  }, [open, initialData, reset]);

  const mutation = useMutation({
    mutationFn: async (data: ServiceFormValues) => {
      const payload = {
        ...data,
        purchasePrice: parseFloat(data.purchasePrice),
        sellingPrice: 0
      };
      
      if (initialData?.id) {
        return api.put(`/api/services/${initialData.id}`, payload);
      } else {
        return api.post('/api/services', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success(initialData?.id ? 'تم تحديث الخدمة بنجاح' : 'تم إضافة الخدمة بنجاح');
      setOpen(false);
      reset();
      if (onSuccess) onSuccess();
    },
    onError: () => {
      toast.error('حدث خطأ أثناء حفظ الخدمة');
    }
  });

  const onSubmit = (data: ServiceFormValues) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button className="gap-2 bg-blue-900 hover:bg-blue-800">
            <Plus className="w-4 h-4" />
            إضافة خدمة
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right text-lg font-bold">
            {initialData ? 'تعديل الخدمة' : 'إضافة خدمة جديدة'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          {/* Service Name (Arabic) - for internal use only */}
          <div className="space-y-2">
            <Label className="text-right block">
              اسم الخدمة (عربي) <span className="text-red-500">*</span>
              <span className="text-xs text-gray-400 mr-2">(للاستخدام الداخلي فقط)</span>
            </Label>
            <Input
              {...register('nameAr', { required: 'اسم الخدمة مطلوب' })}
              placeholder="مثال: جولة البسفور"
              className="text-right"
            />
            {errors.nameAr && <span className="text-red-500 text-sm">{errors.nameAr.message}</span>}
          </div>

          {/* City & Price Row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-right block">المدينة <span className="text-red-500">*</span></Label>
              <Controller
                name="cityId"
                control={control}
                rules={{ required: 'المدينة مطلوبة' }}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger dir="rtl" className="w-full">
                      <SelectValue placeholder="اختر المدينة" />
                    </SelectTrigger>
                    <SelectContent dir="rtl">
                      {cities.map((city) => (
                        <SelectItem key={city.id} value={city.id} className="text-right">
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
              <Label className="text-right block">سعر التكلفة</Label>
              <Input
                type="number"
                step="0.01"
                {...register('purchasePrice')}
                placeholder="0"
                className="text-center"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-right block">العملة</Label>
              <Controller
                name="currency"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="w-full" dir="rtl">
                      <SelectValue placeholder="USD" />
                    </SelectTrigger>
                    <SelectContent dir="rtl">
                      <SelectItem value="USD" className="text-right">USD</SelectItem>
                      <SelectItem value="EUR" className="text-right">EUR</SelectItem>
                      <SelectItem value="TRY" className="text-right">TRY</SelectItem>
                      <SelectItem value="SAR" className="text-right">SAR</SelectItem>
                      <SelectItem value="AED" className="text-right">AED</SelectItem>
                      <SelectItem value="GBP" className="text-right">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {/* Separator */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              📝 وصف الخدمة
              <span className="text-xs font-normal text-gray-400">(يظهر في عروض الأسعار)</span>
            </h4>
          </div>

          {/* Description Arabic */}
          <div className="space-y-2">
            <Label className="text-right block">
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
            <Label className="text-right block">
              الوصف بالإنجليزي
              <span className="text-xs text-amber-600 mr-2">(يظهر في الفاتورة في الانجليزية)</span>
            </Label>
            <textarea
              {...register('descriptionEn')}
              placeholder="After breakfast at the hotel, we start our trip by visiting..."
              className="w-full min-h-[120px] p-3 border rounded-md text-left resize-y text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              dir="ltr"
            />
          </div>

          <DialogFooter className="gap-2 justify-end sm:justify-end mt-4">
             <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={mutation.isPending} className="bg-blue-900 hover:bg-blue-800 text-white">
              {mutation.isPending ? 'جاري الحفظ...' : 'حفظ'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

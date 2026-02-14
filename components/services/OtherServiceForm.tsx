
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

interface OtherServiceFormValues {
  nameAr: string;
  nameEn?: string;
  descriptionAr?: string;
  purchasePrice: string;
  sellingPrice: string;
  currency: string;
}

interface OtherServiceFormProps {
  triggerButton?: React.ReactNode;
  initialData?: OtherServiceFormValues & { id?: string };
  onSuccess?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function OtherServiceForm({ triggerButton, initialData, onSuccess, open: controlledOpen, onOpenChange }: OtherServiceFormProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const queryClient = useQueryClient();

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = (newOpen: boolean) => {
    if (isControlled) {
      onOpenChange?.(newOpen);
    } else {
      setInternalOpen(newOpen);
    }
  };

  const { register, control, handleSubmit, reset, formState: { errors } } = useForm<OtherServiceFormValues>({
    defaultValues: {
      nameAr: '',
      nameEn: '',
      descriptionAr: '',
      purchasePrice: '',
      sellingPrice: '',
      currency: 'USD'
    }
  });

  useEffect(() => {
    if (open && initialData) {
      reset({
        nameAr: initialData.nameAr,
        nameEn: initialData.nameEn || '',
        descriptionAr: initialData.descriptionAr || '',
        purchasePrice: String(initialData.purchasePrice || '0'),
        sellingPrice: String(initialData.sellingPrice || '0'),
        currency: initialData.currency || 'USD'
      });
    } else if (open && !initialData) {
      reset({
        nameAr: '',
        nameEn: '',
        descriptionAr: '',
        purchasePrice: '',
        sellingPrice: '',
        currency: 'USD'
      });
    }
  }, [open, initialData, reset]);

  const mutation = useMutation({
    mutationFn: async (data: OtherServiceFormValues) => {
      const payload = {
        ...data,
        purchasePrice: parseFloat(data.purchasePrice) || 0,
        sellingPrice: parseFloat(data.sellingPrice) || 0
      };
      
      if (initialData?.id) {
        return api.put(`/api/other-services/${initialData.id}`, payload);
      } else {
        return api.post('/api/other-services', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['other-services'] });
      toast.success(initialData?.id ? 'تم تحديث الخدمة بنجاح' : 'تم إضافة الخدمة بنجاح');
      setOpen(false);
      reset();
      if (onSuccess) onSuccess();
    },
    onError: () => {
      toast.error('حدث خطأ أثناء حفظ الخدمة');
    }
  });

  const onSubmit = (data: OtherServiceFormValues) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button className="gap-2 bg-blue-900 hover:bg-blue-800">
            <Plus className="w-4 h-4" />
            إضافة خدمة أخرى
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-right">
            {initialData ? 'تعديل الخدمة' : 'إضافة خدمة أخرى جديدة'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-right block">اسم الخدمة (عربي) <span className="text-red-500">*</span></Label>
            <Input
              {...register('nameAr', { required: 'اسم الخدمة مطلوب' })}
              placeholder="اسم الخدمة بالعربية"
              className="text-right"
            />
            {errors.nameAr && <span className="text-red-500 text-sm">{errors.nameAr.message}</span>}
          </div>

          <div className="space-y-2">
            <Label className="text-right block">اسم الخدمة (إنجليزي)</Label>
            <Input
              {...register('nameEn')}
              placeholder="Service Name (English)"
              dir="ltr"
            />
          </div>
          
          <div className="space-y-2">
             <Label className="text-right block">الوصف</Label>
             <Input
               {...register('descriptionAr')}
               placeholder="وصف الخدمة"
               className="text-right"
             />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
                    <SelectTrigger className="text-center">
                      <SelectValue placeholder="USD" />
                    </SelectTrigger>
                    <SelectContent>
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

          <DialogFooter className="gap-2 sm:justify-start">
             <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={mutation.isPending} className="bg-blue-900 hover:bg-blue-800">
              {mutation.isPending ? 'جاري الحفظ...' : 'حفظ'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import api from '@/lib/api-client';
import { toast } from 'sonner';

interface RoomTypeField {
  id?: string;
  nameAr: string;
  board: string;
  price: string;
  currency: string;
  basePrice?: string | number;
  imageUrl: string;
}

interface HotelFormValues {
  nameAr: string;
  cityId: string;
  roomTypes: RoomTypeField[];
}

interface HotelFormProps { 
  cities: any[]; 
  triggerButton?: React.ReactNode;
  initialData?: HotelFormValues & { id?: string };
  onSuccess?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function HotelForm({ cities, triggerButton, initialData, onSuccess, open: controlledOpen, onOpenChange }: HotelFormProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const queryClient = useQueryClient();

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (onOpenChange || (() => {})) : setInternalOpen;

  const { data: globalRoomTypes = [] } = useQuery({
    queryKey: ['globalRoomTypes'],
    queryFn: async () => {
      const res = await api.get('/api/room-types');
      // Helper to return data array if wrapped (api-client usually returns json directly, 
      // but let's check. api-client returns response.json(). 
      // The route returns array. So just return res.
      // But queryFn expects `res.data` in the original code? 
      // Original: `return res.data;` 
      // My API returns straight JSON (array). 
      // `api-client` returns `response.json()`.
      // So `res` IS the array. 
      // I should update the queryFn return too.
      return res;
    },
    enabled: !!open // Only fetch when form is open (bool cast)
  });

  const { register, control, handleSubmit, reset, formState: { errors } } = useForm<HotelFormValues>({
    defaultValues: {
      nameAr: '',
      cityId: '',
      roomTypes: [{ nameAr: '', board: 'bb', price: '', currency: 'USD', imageUrl: '' }]
    }
  });

  // Reset form when initialData changes or dialog opens
  useEffect(() => {
    if (open && initialData) {
      reset({
        nameAr: initialData.nameAr,
        cityId: initialData.cityId,
        roomTypes: initialData.roomTypes.map(rt => ({
          id: (rt as any).id,
          nameAr: rt.nameAr,
          board: rt.board || 'bb',
          price: String(rt.basePrice || rt.price || '0'),
          currency: rt.currency || 'USD',
          imageUrl: rt.imageUrl || ''
        }))
      });
    } else if (open && !initialData) {
      reset({
        nameAr: '',
        cityId: '',
        roomTypes: [{ nameAr: '', board: 'bb', price: '', currency: 'USD', imageUrl: '' }]
      });
    }
  }, [open, initialData, reset]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'roomTypes'
  });

  const mutation = useMutation({
    mutationFn: async (data: HotelFormValues) => {
      if (initialData?.id) {
        const response = await api.put(`/api/hotels/${initialData.id}`, data);
        return response;
      } else {
        const response = await api.post('/api/hotels', data);
        return response;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hotels'] });
      toast.success(initialData?.id ? 'تم تحديث الفندق بنجاح' : 'تم إضافة الفندق بنجاح');
      setOpen(false);
      reset();
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      console.error(error);
      toast.error('حدث خطأ أثناء حفظ الفندق');
    }
  });

  const onSubmit = (data: HotelFormValues) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            إضافة فندق
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>إضافة فندق جديد</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Main Info */}
          <div className="p-4 border rounded-lg bg-muted/20">
            <h3 className="font-semibold text-lg mb-4">معلومات الفندق</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nameAr">اسم الفندق <span className="text-red-500">*</span></Label>
                <Input
                  id="nameAr"
                  {...register('nameAr', { required: 'اسم الفندق مطلوب' })}
                  placeholder="مثال: فندق الشيراتون"
                />
                {errors.nameAr && <span className="text-red-500 text-sm">{errors.nameAr.message}</span>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cityId">المدينة <span className="text-red-500">*</span></Label>
                <Controller
                  name="cityId"
                  control={control}
                  rules={{ required: 'المدينة مطلوبة' }}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger dir="rtl">
                        <SelectValue placeholder="اختر المدينة" />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.map((city) => (
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
            </div>
          </div>

          {/* Room Types */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">الغرف والأسعار <span className="text-red-500">*</span></h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ id: undefined, nameAr: '', board: 'bb', price: '', currency: 'USD', imageUrl: '' })}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                إضافة غرفة
              </Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted p-3 grid grid-cols-12 gap-4 text-sm font-medium">
                <div className="col-span-3">نوع الغرفة</div>
                <div className="col-span-2">الإقامة (Board)</div>
                <div className="col-span-2">سعر التكلفة</div>
                <div className="col-span-2">العملة</div>
                <div className="col-span-2">رابط الصورة</div>
                <div className="col-span-1"></div>
              </div>
              
              <div className="divide-y">
                {fields.map((field, index) => (
                  <div key={field.id} className="p-3 grid grid-cols-12 gap-4 items-center bg-card hover:bg-muted/10 transition-colors animate-in slide-in-from-top-2">
                    {/* Hidden ID field for persistence */}
                    <input type="hidden" {...register(`roomTypes.${index}.id` as const)} />
                    
                    <div className="col-span-3">
                      <Controller
                        name={`roomTypes.${index}.nameAr` as const}
                        control={control}
                        rules={{ required: true }}
                        render={({ field: selectField }) => (
                          <Select 
                            onValueChange={selectField.onChange} 
                            defaultValue={selectField.value} 
                            value={selectField.value}
                          >
                            <SelectTrigger className="h-9" dir="rtl">
                              <SelectValue placeholder="اختر نوع الغرفة" />
                            </SelectTrigger>
                            <SelectContent>
                              {globalRoomTypes.map((type: any) => (
                                <SelectItem key={type.id} value={type.nameEn}>
                                  {type.nameEn}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>

                    <div className="col-span-2">
                      <Controller
                        name={`roomTypes.${index}.board` as const}
                        control={control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                            <SelectTrigger className="h-9" dir="rtl">
                              <SelectValue placeholder="Board" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ro">RO (Room Only)</SelectItem>
                              <SelectItem value="bb">BB (Breakfast)</SelectItem>
                              <SelectItem value="hb">HB (Half Board)</SelectItem>
                              <SelectItem value="fb">FB (Full Board)</SelectItem>
                              <SelectItem value="ai">AI (All Inclusive)</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>

                    <div className="col-span-2">
                      <Input
                        type="number"
                        step="0.01"
                        {...register(`roomTypes.${index}.price` as const, { required: true })}
                        placeholder="0.00"
                        className="h-9"
                      />
                    </div>

                    <div className="col-span-2">
                      <Controller
                        name={`roomTypes.${index}.currency` as const}
                        control={control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                            <SelectTrigger className="h-9" dir="ltr">
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

                    <div className="col-span-2">
                      <Input
                        {...register(`roomTypes.${index}.imageUrl` as const)}
                        placeholder="https://..."
                        dir="ltr"
                        className="h-9 font-mono text-xs"
                      />
                    </div>

                    <div className="col-span-1 flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {errors.roomTypes && <span className="text-red-500 text-sm">يجب إضافة غرفة واحدة على الأقل</span>}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'جاري الحفظ...' : 'حفظ الفندق'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

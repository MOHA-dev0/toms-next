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
import { DatePicker } from '@/components/ui/date-picker';

interface RoomPricingField {
  id?: string;
  validFrom: string;
  validTo: string;
  price: string;
}

interface RoomTypeField {
  id?: string;
  nameAr: string;
  board: string;
  price: string;
  currency: string;
  basePrice?: string | number;
  imageUrl: string;
  pricings?: RoomPricingField[];
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

const parseDateString = (dateStr?: string) => {
  if (!dateStr) return undefined;
  const str = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const parts = str.split('-');
  if (parts.length !== 3) return undefined;
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
};

const formatDateString = (date?: Date) => {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const RoomTypePricings = ({ control, index, register }: any) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `roomTypes.${index}.pricings`
  });

  return (
    <div className="col-span-12 mt-2 px-4 py-3 bg-muted/40 rounded-lg border border-dashed border-gray-300">
      <div className="flex justify-between items-center mb-3">
        <label className="text-sm font-semibold text-gray-700">أسعار مخصصة حسب التاريخ (اختياري)</label>
        <Button type="button" variant="outline" size="sm" onClick={() => append({ validFrom: '', validTo: '', price: '' })} className="h-7 text-xs">
          + إضافة فترة
        </Button>
      </div>
      {fields.map((field, pIndex) => (
        <div key={field.id} className="grid grid-cols-12 gap-3 items-center mb-2 animate-in slide-in-from-top-1">
          <div className="col-span-4">
            <Label className="text-xs mb-1 block text-muted-foreground">من تاريخ</Label>
            <Controller
              control={control}
              name={`roomTypes.${index}.pricings.${pIndex}.validFrom`}
              rules={{ required: true }}
              render={({ field }) => (
                <div className="w-full">
                  <DatePicker 
                    date={parseDateString(field.value)} 
                    setDate={(date) => field.onChange(formatDateString(date))} 
                  />
                </div>
              )}
            />
          </div>
          <div className="col-span-4">
            <Label className="text-xs mb-1 block text-muted-foreground">إلى تاريخ</Label>
            <Controller
              control={control}
              name={`roomTypes.${index}.pricings.${pIndex}.validTo`}
              rules={{ required: true }}
              render={({ field }) => (
                <div className="w-full">
                  <DatePicker 
                    date={parseDateString(field.value)} 
                    setDate={(date) => field.onChange(formatDateString(date))} 
                  />
                </div>
              )}
            />
          </div>
          <div className="col-span-3">
            <Label className="text-xs mb-1 block text-muted-foreground">السعر المخصص</Label>
            <Input type="number" step="0.01" className="h-8 text-sm" placeholder="السعر" {...register(`roomTypes.${index}.pricings.${pIndex}.price`, { required: true })} />
          </div>
          <div className="col-span-1 flex items-end pb-0.5 justify-end">
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => remove(pIndex)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}
      {fields.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-2">لم يتم إضافة فترات مخصصة. سيتم تطبيق السعر الافتراضي للإقامة.</p>
      )}
    </div>
  )
}

export function HotelForm({ cities, triggerButton, initialData, onSuccess, open: controlledOpen, onOpenChange }: HotelFormProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const queryClient = useQueryClient();

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (onOpenChange || (() => {})) : setInternalOpen;

  const { data: globalRoomTypes = [] } = useQuery({
    queryKey: ['globalRoomTypes', ''], // Empty string to match the default empty search in RoomTypesManager
    queryFn: async () => {
      const res = await api.get('/api/room-types?search=');
      return Array.isArray(res) ? res : [];
    },
    staleTime: Infinity, // ZERO-REQUEST ARCHITECTURE: Read instantly from memory, never fetch again.
    // We don't need `enabled: !!open` anymore because:
    // 1. If it's already in the cache from RoomTypesManager, it returns instantly for free.
    // 2. If it's not in the cache, we want to prefetch it so the dropdown is perfectly ready when opened.
  });

  const { register, control, handleSubmit, reset, formState: { errors } } = useForm<HotelFormValues>({
    defaultValues: {
      nameAr: '',
      cityId: '',
      roomTypes: [{ nameAr: '', board: 'bb', price: '', currency: 'USD', imageUrl: '', pricings: [] }]
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
          imageUrl: rt.imageUrl || '',
          pricings: (rt as any).roomPricing?.map((p: any) => ({
            id: p.id,
            validFrom: new Date(p.validFrom).toISOString().split('T')[0],
            validTo: new Date(p.validTo).toISOString().split('T')[0],
            price: String(p.purchasePrice || p.sellingPrice || '0')
          })) || []
        }))
      });
    } else if (open && !initialData) {
      reset({
        nameAr: '',
        cityId: '',
        roomTypes: [{ nameAr: '', board: 'bb', price: '', currency: 'USD', imageUrl: '', pricings: [] }]
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
    // Validate pricings
    for (let i = 0; i < data.roomTypes.length; i++) {
      const rt = data.roomTypes[i];
      const nameObj = rt.nameAr || `الغرفة ${i + 1}`;
      if (rt.pricings && rt.pricings.length > 0) {
        let hasError = false;
        for (let j = 0; j < rt.pricings.length; j++) {
          const p = rt.pricings[j];
          if (!p.validFrom || !p.validTo || !p.price) {
            toast.error(`الرجاء إكمال جميع حقول الأسعار للغرفة: ${nameObj}`);
            hasError = true;
            break;
          }
          if (new Date(p.validFrom) > new Date(p.validTo)) {
            toast.error(`تاريخ البداية يجب أن يكون قبل تاريخ النهاية في الغرفة: ${nameObj}`);
            hasError = true;
            break;
          }
        }
        if (hasError) return;

        // Check overlaps
        for (let j = 0; j < rt.pricings.length; j++) {
          for (let k = j + 1; k < rt.pricings.length; k++) {
            const startA = new Date(rt.pricings[j].validFrom).getTime();
            const endA = new Date(rt.pricings[j].validTo).getTime();
            const startB = new Date(rt.pricings[k].validFrom).getTime();
            const endB = new Date(rt.pricings[k].validTo).getTime();
            if (startA <= endB && startB <= endA) {
              toast.error(`يوجد تداخل في تواريخ الأسعار للغرفة: ${nameObj}`);
              hasError = true;
              break;
            }
          }
          if (hasError) break;
        }
        if (hasError) return;
      }
    }
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
                onClick={() => append({ id: undefined, nameAr: '', board: 'bb', price: '', currency: 'USD', imageUrl: '', pricings: [] })}
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
                                  {type.nameAr || type.nameEn}
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

                    {/* Room Type Pricings */}
                    <RoomTypePricings control={control} index={index} register={register} />
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

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/client';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface GlobalRoomType {
  id: string;
  nameAr: string;
  nameEn: string;
}

export function SettingsRoomTypes() {
  const [open, setOpen] = useState(false);
  const [editingType, setEditingType] = useState<GlobalRoomType | null>(null);
  const queryClient = useQueryClient();

  const { data: roomTypes = [], isLoading } = useQuery({
    queryKey: ['globalRoomTypes'],
    queryFn: async () => {
      const res = await api.get('/room-types');
      return res.data;
    }
  });

  const mutation = useMutation({
    mutationFn: async (data: { nameAr: string; nameEn: string }) => {
      if (editingType) {
        await api.put(`/room-types/${editingType.id}`, data);
      } else {
        await api.post('/room-types', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['globalRoomTypes'] });
      toast.success(editingType ? 'تم تعديل نوع الغرفة' : 'تم إضافة نوع الغرفة');
      setOpen(false);
      setEditingType(null);
    },
    onError: () => {
      toast.error('حدث خطأ');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/room-types/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['globalRoomTypes'] });
      toast.success('تم حذف نوع الغرفة');
    },
    onError: () => toast.error('حدث خطأ أثناء الحذف')
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    mutation.mutate({
      nameAr: formData.get('nameAr') as string,
      nameEn: formData.get('nameEn') as string,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">أنواع الغرف</h2>
        <Dialog open={open} onOpenChange={(val) => {
          setOpen(val);
          if (!val) setEditingType(null);
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              إضافة نوع غرفة
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingType ? 'تعديل نوع الغرفة' : 'إضافة نوع غرفة جديد'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>الاسم بالعربية</Label>
                <Input 
                  name="nameAr" 
                  defaultValue={editingType?.nameAr} 
                  required 
                  placeholder="مثال: غرفة مطلة على البحر"
                />
              </div>
              <div className="space-y-2">
                <Label>الاسم بالإنجليزية</Label>
                <Input 
                  name="nameEn" 
                  defaultValue={editingType?.nameEn} 
                  required 
                  placeholder="Ex: Sea View Room"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? 'جاري الحفظ...' : 'حفظ'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">الاسم بالعربية</TableHead>
              <TableHead className="text-right">الاسم بالإنجليزية</TableHead>
              <TableHead className="w-[100px] text-right">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : roomTypes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                  لا توجد أنواع غرف مضافة
                </TableCell>
              </TableRow>
            ) : (
              roomTypes.map((type: GlobalRoomType) => (
                <TableRow key={type.id}>
                  <TableCell className="font-medium">{type.nameAr}</TableCell>
                  <TableCell>{type.nameEn}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => {
                          setEditingType(type);
                          setOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          if(confirm('هل أنت متأكد من الحذف؟')) deleteMutation.mutate(type.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

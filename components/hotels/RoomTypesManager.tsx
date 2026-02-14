'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, BedDouble } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import api from '@/lib/api-client';
import { toast } from 'sonner';

interface RoomType {
  id: string;
  nameAr: string;
  nameEn: string;
}

export function RoomTypesManager() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentType, setCurrentType] = useState<RoomType | null>(null);
  const [deleteType, setDeleteType] = useState<RoomType | null>(null);
  const [formData, setFormData] = useState({ nameAr: '', nameEn: '' });

  const queryClient = useQueryClient();

  // Fetch Room Types
  const { data: roomTypes = [], isLoading } = useQuery({
    queryKey: ['globalRoomTypes'],
    queryFn: async () => {
      const res: any = await api.get('/api/room-types');
      return Array.isArray(res) ? res : [];
    }
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (currentType) {
        return api.put(`/api/room-types/${currentType.id}`, data);
      } else {
        return api.post('/api/room-types', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['globalRoomTypes'] });
      toast.success(currentType ? 'تم التحديث بنجاح' : 'تم الإضافة بنجاح');
      setIsModalOpen(false);
      setFormData({ nameAr: '', nameEn: '' });
      setCurrentType(null);
    },
    onError: () => {
      toast.error('حدث خطأ أثناء الحفظ');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/api/room-types/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['globalRoomTypes'] });
      toast.success('تم الحذف بنجاح');
      setDeleteType(null);
    },
    onError: () => {
      toast.error('حدث خطأ أثناء الحذف');
    }
  });

  const handleOpenModal = (type?: RoomType) => {
    if (type) {
      setCurrentType(type);
      setFormData({ nameAr: type.nameAr, nameEn: type.nameEn });
    } else {
      setCurrentType(null);
      setFormData({ nameAr: '', nameEn: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <h2 className="text-2xl font-bold text-gray-900">أنواع الغرف</h2>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button 
            onClick={() => handleOpenModal()} 
            className="gap-2 bg-blue-900 hover:bg-blue-800 shadow-md transition-all hover:shadow-lg w-full md:w-auto"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة نوع غرفة</span>
          </Button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50/80">
            <TableRow>
              <TableHead className="text-right font-semibold text-gray-600 py-4 px-6">الاسم بالعربية</TableHead>
              <TableHead className="text-center font-semibold text-gray-600 py-4 px-6">الاسم بالإنجليزية</TableHead>
              <TableHead className="text-left font-semibold text-gray-600 py-4 px-6 w-[140px]">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
               <TableRow><TableCell colSpan={3} className="text-center py-8">جاري التحميل...</TableCell></TableRow>
            ) : roomTypes.length === 0 ? (
               <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">لا توجد أنواع غرف مضافة</TableCell></TableRow>
            ) : (
              roomTypes.map((type: RoomType) => (
                <TableRow key={type.id} className="hover:bg-gray-50/50 transition-colors border-b border-gray-50">
                  <TableCell className="font-medium text-gray-900 py-4 px-6 text-right">{type.nameAr}</TableCell>
                  <TableCell className="text-gray-600 py-4 px-6 text-center" dir="ltr">{type.nameEn}</TableCell>
                  <TableCell className="py-2 px-6">
                    <div className="flex justify-end gap-2" dir="ltr">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        onClick={() => handleOpenModal(type)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        onClick={() => setDeleteType(type)}
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

      {/* Modal for Add/Edit */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-right pr-4 border-r-4 border-blue-600 rounded-r-sm">
              {currentType ? 'تعديل نوع غرفة' : 'إضافة نوع غرفة جديد'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-right block">الاسم بالعربية</Label>
              <Input
                required
                value={formData.nameAr}
                onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                className="text-right"
                placeholder="مثال: غرفة ديلوكس"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-right block">الاسم بالإنجليزية</Label>
              <Input
                required
                value={formData.nameEn}
                onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                className="text-left"
                dir="ltr"
                placeholder="Ex: Deluxe Room"
              />
            </div>
            <DialogFooter className="gap-2 sm:justify-start">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={mutation.isPending} className="bg-blue-900 hover:bg-blue-800">
                {mutation.isPending ? 'جاري الحفظ...' : 'حفظ'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <DeleteConfirmationDialog
        open={!!deleteType}
        onOpenChange={(open) => !open && setDeleteType(null)}
        onConfirm={() => deleteType && deleteMutation.mutate(deleteType.id)}
        itemName={deleteType?.nameAr}
      />
    </div>
  );
}

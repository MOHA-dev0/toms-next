import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface City { id: string; nameAr: string; nameTr: string | null; countryAr: string; isActive: boolean; }

export function SettingsCities() {
  const { toast } = useToast();
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ name_ar: '', name_tr: '', country_ar: 'تركيا' });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => { fetchCities(); }, []);

  const fetchCities = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get('/cities');
      setCities(data || []);
    } catch (error) {
       console.error(error);
       toast({ title: 'خطأ', description: 'فشل في جلب البيانات', variant: 'destructive' });
    }
    setIsLoading(false);
  };

  const handleSubmit = async () => {
    if (!formData.name_ar) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال اسم المدينة",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingId) {
        await api.put(`/cities/${editingId}`, formData);
      } else {
        await api.post("/cities", formData);
      }
      toast({ title: "تم الحفظ" });
      setIsDialogOpen(false);
      setFormData({ name_ar: "", name_tr: "", country_ar: "تركيا" });
      setEditingId(null);
      fetchCities();
    } catch (error) {
      console.error(error);
      toast({
        title: "خطأ",
        description: "فشل في حفظ البيانات",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (city: City) => {
    setFormData({
      name_ar: city.nameAr,
      name_tr: city.nameTr || "",
      country_ar: city.countryAr,
    });
    setEditingId(city.id);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/cities/${id}`);
      toast({ title: "تم الحذف" });
      fetchCities();
    } catch (error) {
      console.error(error);
      toast({
        title: "خطأ",
        description: "فشل في حذف المدينة",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="card-elevated">
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="font-semibold flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          المدن
        </h3>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(o) => {
            setIsDialogOpen(o);
            if (!o) {
              setEditingId(null);
              setFormData({ name_ar: "", name_tr: "", country_ar: "تركيا" });
            }
          }}
        >
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              إضافة مدينة
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "تعديل" : "إضافة"} مدينة</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>الاسم (عربي) *</Label>
                <Input
                  value={formData.name_ar}
                  onChange={(e) =>
                    setFormData({ ...formData, name_ar: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>الاسم (تركي)</Label>
                <Input
                  value={formData.name_tr}
                  onChange={(e) =>
                    setFormData({ ...formData, name_tr: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>الدولة</Label>
                <Input
                  value={formData.country_ar}
                  onChange={(e) =>
                    setFormData({ ...formData, country_ar: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={handleSubmit}>حفظ</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-right">الاسم (عربي)</TableHead>
            <TableHead className="text-right">الاسم (تركي)</TableHead>
            <TableHead className="text-right">الدولة</TableHead>
            <TableHead className="text-right">الإجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading
            ? [...Array(3)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={4}>
                    <div className="skeleton h-4 w-full" />
                  </TableCell>
                </TableRow>
              ))
            : cities.map((city) => (
                <TableRow key={city.id}>
                  <TableCell className="text-right">{city.nameAr}</TableCell>
                  <TableCell className="text-right">{city.nameTr || "-"}</TableCell>
                  <TableCell className="text-right">{city.countryAr}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-start">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(city)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-right">
                              هل أنت متأكد من الحذف؟
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-right">
                              لا يمكن التراجع عن هذا الإجراء
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="flex-row gap-2 sm:justify-end">
                            <AlertDialogCancel className="mt-0">إلغاء</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(city.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              حذف
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>
    </div>
  );
};

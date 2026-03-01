'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Building, Search, FileUp, Download, BedDouble, LayoutGrid, List, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { HotelForm } from '@/components/hotels/HotelForm';
import { HotelExcelImport } from '@/components/hotels/HotelExcelImport';
import { RoomTypesManager } from '@/components/hotels/RoomTypesManager';
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api-client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataCard } from '@/components/ui/data-card';

interface City {
  id: string;
  nameAr: string;
}

interface RoomType {
  id: string;
  nameAr: string;
  board: string;
  basePrice: number | string;
  currency: string;
}

interface Hotel {
  id: string;
  nameAr: string;
  city: City;
  roomTypes: RoomType[];
  createdAt: string;
}

export default function HotelsPage() {
  const [activeTab, setActiveTab] = useState<'hotels' | 'room-types'>('hotels');
  
  // Hotels State
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentHotel, setCurrentHotel] = useState<any | null>(null);
  const [deleteHotel, setDeleteHotel] = useState<Hotel | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      const [hotelsData, citiesData] = await Promise.all([
        api.get('/api/hotels'),
        api.get('/api/cities')
      ]);
      setHotels(hotelsData);
      setCities(citiesData);
    } catch (error) {
      console.error('Failed to fetch data', error);
      toast({ 
        title: 'خطأ',
        description: 'فشل تحميل البيانات',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenForm = (hotel?: Hotel) => {
    if (hotel) {
      const formattedHotel = {
        ...hotel,
        cityId: hotel.city.id, 
        roomTypes: hotel.roomTypes.map((rt: any) => ({
          id: rt.id,
          nameAr: rt.nameAr,
          board: rt.board,
          price: rt.basePrice,
          currency: rt.currency,
          imageUrl: rt.imageUrl,
          roomPricing: rt.roomPricing
        }))
      };
      setCurrentHotel(formattedHotel);
    } else {
      setCurrentHotel(null);
    }
    setIsFormOpen(true);
  };

  const handleDelete = (hotel: Hotel) => {
    setDeleteHotel(hotel);
  };

  const confirmDelete = async () => {
    if (!deleteHotel) return;

    try {
      await api.delete(`/api/hotels/${deleteHotel.id}`);
      toast({ title: 'تم الحذف بنجاح' });
      fetchData();
    } catch (error) {
      console.error(error);
      toast({ 
        title: 'فشل الحذف',
        description: 'قد يكون الفندق مرتبط بحجوزات أو عروض أسعار.',
        variant: 'destructive'
      });
    } finally {
      setDeleteHotel(null);
    }
  };

  const onFormSuccess = () => {
    setIsFormOpen(false);
    fetchData();
  };

  const filteredHotels = hotels.filter(hotel => 
    hotel.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
    hotel.city?.nameAr.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6">
      {/* Tab Switcher - Top Right */}
   <div className="flex justify-between items-center mb-4">

    <div className="bg-gray-100 p-1 rounded-lg inline-flex items-center gap-1">
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setActiveTab('hotels')}
      className={`rounded-md text-sm font-medium gap-2 px-3 transition-all ${
        activeTab === 'hotels'
          ? 'bg-white shadow-sm text-blue-900'
          : 'text-gray-500 hover:text-gray-900'
      }`}
    >
      <Building className="w-4 h-4" />
      الفنادق
    </Button>

    <Button
      variant="ghost"
      size="sm"
      onClick={() => setActiveTab('room-types')}
      className={`rounded-md text-sm font-medium gap-2 px-3 transition-all ${
        activeTab === 'room-types'
          ? 'bg-white shadow-sm text-blue-900'
          : 'text-gray-500 hover:text-gray-900'
      }`}
    >
      <BedDouble className="w-4 h-4" />
      أنواع الغرف
    </Button>
  </div>

  {/* Add Button - أقصى اليسار */}
  <Button
    onClick={() => handleOpenForm()}
    className="bg-blue-900 hover:bg-blue-800 text-white gap-2 ml-4 shadow-md hover:shadow-lg transition-all"
  >
    <Plus className="w-4 h-4" />
    إضافة فندق
  </Button>

</div>


      {activeTab === 'hotels' ? (
        <>
          {/* Header & Actions */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            {/* Right Search */}
            <div className="relative w-full md:w-96">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                className="pr-10 bg-gray-50 border-gray-200 focus:bg-white transition-all text-right" 
                placeholder="بحث باسم الفندق..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Left Actions */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <HotelExcelImport cities={cities} />
            
            </div>
          </div>

          {/* Cards Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-48 bg-gray-100 rounded-xl" />
              ))}
            </div>
          ) : filteredHotels.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed text-muted-foreground">
              لا يوجد فنادق تطابق بحثك
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" dir="rtl">
              {filteredHotels.map((hotel) => (
                <DataCard
                  key={hotel.id}
                  title={hotel.nameAr}
                  subtitle={hotel.city?.nameAr}
                  icon={Building}
                  actions={
                    <>
                      <Button 
                        size="icon"
                        variant="ghost" 
                        className="h-8 w-8 rounded-full hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                        onClick={() => handleOpenForm(hotel)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="icon"
                        variant="ghost" 
                        className="h-8 w-8 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                        onClick={() => handleDelete(hotel)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  }
                  metadata={
                    <div className="space-y-2">
                       {hotel.roomTypes?.length > 0 ? (
                         hotel.roomTypes.slice(0, 3).map((room, idx) => (
                           <div key={idx} className="flex justify-between items-center text-sm p-1.5 rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors border border-gray-100">
                             <div className="flex items-center gap-2">
                               <Badge variant="outline" className="text-[10px] h-5 bg-white font-normal text-muted-foreground border-gray-200">
                                 {room.board}
                               </Badge>
                               <span className="font-medium text-gray-700 text-xs">{room.nameAr}</span>
                             </div>
                             <span className="font-mono font-bold text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded" dir="ltr">
                               {room.basePrice} {room.currency}
                             </span>
                           </div>
                         ))
                       ) : (
                         <div className="text-center py-4 text-xs text-muted-foreground bg-gray-50 rounded-lg border border-dashed border-gray-200">
                           لا توجد غرف مضافة
                         </div>
                       )}
                       
                       {hotel.roomTypes?.length > 3 && (
                          <div className="text-center">
                            <Badge variant="secondary" className="text-xs font-normal cursor-pointer hover:bg-gray-200 transition-colors">
                              +{hotel.roomTypes.length - 3} المزيد
                            </Badge>
                          </div>
                       )}
                    </div>
                  }
                  footerLabel="عدد الغرف المتوفرة:"
                  footerValue={hotel.roomTypes?.length || 0}
                  footerValueSub="غرفة"
                />
              ))}
            </div>
          )}

          <HotelForm 
            cities={cities} 
            open={isFormOpen} 
            onOpenChange={setIsFormOpen}
            initialData={currentHotel}
            onSuccess={onFormSuccess}
          />

          <DeleteConfirmationDialog
            open={!!deleteHotel}
            onOpenChange={(open) => !open && setDeleteHotel(null)}
            onConfirm={confirmDelete}
            itemName={deleteHotel?.nameAr}
          />
        </>
      ) : (
        <RoomTypesManager />
      )}
    </div>
  );
}

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
          nameAr: rt.nameAr,
          board: rt.board,
          price: rt.basePrice,
          currency: rt.currency,
          imageUrl: rt.imageUrl
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
      <div className="flex justify-start mb-4">
        <div className="bg-gray-100 p-1 rounded-lg inline-flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab('hotels')}
            className={`rounded-md text-sm font-medium gap-2 px-3 transition-all ${
              activeTab === 'hotels' ? 'bg-white shadow-sm text-blue-900' : 'text-gray-500 hover:text-gray-900'
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
              activeTab === 'room-types' ? 'bg-white shadow-sm text-blue-900' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <BedDouble className="w-4 h-4" />
            أنواع الغرف
          </Button>
        </div>
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
                <div key={hotel.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100 overflow-hidden group text-right">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg mb-1 text-gray-900">{hotel.nameAr}</h3>
                        <div className="flex items-center text-muted-foreground text-sm gap-1">
                          <MapPin className="w-3 h-3" />
                          {hotel.city?.nameAr}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold">
                          {hotel.roomTypes?.length || 0} غرف
                        </div>
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
                      </div>
                    </div>
                    
                    <div className="space-y-2 pt-4 border-t border-gray-50">
                      {hotel.roomTypes?.length > 0 ? (
                        hotel.roomTypes.slice(0, 3).map((room, idx) => (
                          <div key={idx} className="flex justify-between text-sm hover:bg-gray-50 p-2 rounded-lg transition-colors">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-700">{room.nameAr}</span>
                              <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded uppercase border border-gray-200">{room.board}</span>
                            </div>
                            <span className="font-mono font-medium text-blue-700" dir="ltr">{room.basePrice} {room.currency}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-xs text-muted-foreground">
                          لا توجد غرف مضافة
                        </div>
                      )}
                      {hotel.roomTypes?.length > 3 && (
                        <div className="text-xs text-blue-600 font-medium text-center pt-2 cursor-pointer hover:underline">
                          +{hotel.roomTypes.length - 3} المزيد
                        </div>
                      )}
                    </div>
                  </div>
                </div>
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

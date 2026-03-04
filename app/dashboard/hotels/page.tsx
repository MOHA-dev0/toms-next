'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Building, Search, FileUp, Download, BedDouble, LayoutGrid, List, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
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
  
  const queryClient = useQueryClient();
  
  // UI State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentHotel, setCurrentHotel] = useState<any | null>(null);
  const [deleteHotel, setDeleteHotel] = useState<Hotel | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 9;
  
  const { toast } = useToast();

  // 1. Debounce the search input to prevent firing an API call on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset to page 1 whenever search changes
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 2. CACHE-FIRST FETCHING
  // Cities change rarely. staleTime: Infinity
  const { data: cities = [] } = useQuery({
    queryKey: ['cities'],
    queryFn: async () => {
      const res = await api.get('/api/cities');
      return res;
    },
    staleTime: Infinity, 
  });

  // Hotels change occasionally. Request includes page and search.
  const { data: hotelsData, isLoading, isPlaceholderData } = useQuery({
    queryKey: ['hotels', page, debouncedSearch],
    queryFn: async () => {
      const res = await api.get(`/api/hotels?page=${page}&limit=${limit}&search=${encodeURIComponent(debouncedSearch)}`);
      return res;
    },
    placeholderData: (previousData) => previousData,
    staleTime: 5 * 60 * 1000, 
  });

  const hotels = hotelsData?.data || [];
  const totalPages = hotelsData?.totalPages || 0;

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

  // 2. MUTATION WITH CACHE INVALIDATION & OPTIMISTIC UPDATES
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/hotels/${id}`);
    },
    onMutate: async (deletedId) => {
      // Optimistic Update: Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['hotels'] });
      // Snapshot the previous value
      const previousHotels = queryClient.getQueryData<Hotel[]>(['hotels']);
      // Optimistically update to the new value
      if (previousHotels) {
        queryClient.setQueryData(['hotels'], previousHotels.filter(h => h.id !== deletedId));
      }
      return { previousHotels };
    },
    onError: (err, deletedId, context) => {
      // Rollback on error
      if (context?.previousHotels) {
        queryClient.setQueryData(['hotels'], context.previousHotels);
      }
      console.error(err);
      toast({ 
        title: 'فشل الحذف',
        description: 'قد يكون الفندق مرتبط بحجوزات أو عروض أسعار.',
        variant: 'destructive'
      });
    },
    onSuccess: () => {
      toast({ title: 'تم الحذف بنجاح' });
    },
    onSettled: () => {
      // Refetch after error or success to ensure server sync
      queryClient.invalidateQueries({ queryKey: ['hotels'] });
      setDeleteHotel(null);
    }
  });

  const confirmDelete = () => {
    if (!deleteHotel) return;
    deleteMutation.mutate(deleteHotel.id);
  };

  const onFormSuccess = () => {
    setIsFormOpen(false);
    // 3. CACHE INVALIDATION: Trigger background refetch on form submittion
    queryClient.invalidateQueries({ queryKey: ['hotels'] });
  };



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
          ) : hotels.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed text-muted-foreground">
              لا يوجد فنادق تطابق بحثك
            </div>
          ) : (
            <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-opacity duration-200", isPlaceholderData ? "opacity-50 pointer-events-none" : "opacity-100")} dir="rtl">
              {hotels.map((hotel: Hotel) => (
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
                         hotel.roomTypes.slice(0, 3).map((room: RoomType, idx: number) => (
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

          {activeTab === 'hotels' && totalPages > 1 && !isLoading && hotels.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4 mt-6 bg-white border border-gray-100 rounded-xl shadow-sm">
              <p className="text-sm font-medium text-gray-500">
                عرض صفحة <span className="font-bold text-gray-700">{page}</span> من <span className="font-bold text-gray-700">{totalPages}</span>
              </p>
              <div className="flex gap-1" dir="rtl">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8 border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50 hover:border-gray-200"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1 || isPlaceholderData}
                >
                  <ChevronRight size={16} />
                </Button>
                
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pageNum = idx + 1;
                  if (totalPages > 5 && Math.abs(page - pageNum) > 1 && pageNum !== 1 && pageNum !== totalPages) {
                    if (pageNum === 2 || pageNum === totalPages - 1) return <span key={pageNum} className="px-2 self-end text-gray-400">...</span>;
                    return null;
                  }

                  return (
                    <Button 
                      key={pageNum}
                      variant={page === pageNum ? 'default' : 'outline'}
                      size="sm"
                      className={cn(
                        "h-8 min-w-8 font-bold border-transparent transition-all",
                        page === pageNum 
                          ? "bg-blue-900 text-white shadow-sm hover:bg-blue-800" 
                          : "bg-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50 hover:border-gray-200"
                      )}
                      onClick={() => setPage(pageNum)}
                      disabled={isPlaceholderData}
                    >
                      {pageNum}
                    </Button>
                  );
                })}

                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8 border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50 hover:border-gray-200"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || isPlaceholderData}
                >
                  <ChevronLeft size={16} />
                </Button>
              </div>
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

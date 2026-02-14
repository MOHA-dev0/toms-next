import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api-client';
import { toast } from 'sonner';
import { FileUp, Download, AlertTriangle, CheckCircle, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

interface ImportedHotel {
  nameAr: string;
  cityId: string;
  cityName: string; // Used for display/validation
  roomTypes: {
    nameAr: string;
    board: string;
    price: string;
    imageUrl: string;
  }[];
  isValid: boolean;
  errors: string[];
}

export function HotelExcelImport({ cities }: { cities: any[] }) {
  const [open, setOpen] = useState(false);
  const [previewData, setPreviewData] = useState<ImportedHotel[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['Hotel Name', 'City', 'Room Type', 'BOARD', 'Price', 'Room Image Link'],
      ['Hilton Istanbul', 'Istanbul', 'DELUXE SEA VIEW', 'BB', '120', 'https://example.com/image1.jpg'],
      ['', '', 'LOFT BUNGALOW', 'BB', '150', 'https://example.com/image2.jpg'],
      ['', '', 'SUPERIOR', 'BB', '100', 'https://example.com/image3.jpg'],
      ['Rixos Antalya', 'Antalya', 'DELUXE', 'HB', '90', ''],
      ['', '', 'STANDARD', 'BB', '70', ''],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Hotels');
    XLSX.writeFile(wb, 'hotels_template.xlsx');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

      // Process Data
      const processedHotels: ImportedHotel[] = [];
      let currentHotel: ImportedHotel | null = null;
      
      // Helper to find existing hotel in processed list
      const findExistingHotel = (name: string) => processedHotels.find(h => h.nameAr === name);

      // Skip header row
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length === 0) continue;

        let [hotelName, cityName, roomType, board, price, imgUrl] = row;
        
        // Normalize inputs
        hotelName = hotelName ? String(hotelName).trim() : '';
        cityName = cityName ? String(cityName).trim() : '';
        roomType = roomType ? String(roomType).trim() : '';
        
        // Case 1: New Hotel Name provided
        if (hotelName) {
           const existing = findExistingHotel(hotelName);
           
           if (existing) {
             currentHotel = existing;
           } else {
             // Create New Hotel
             const city = cities.find(c => 
               (c.nameAr && c.nameAr.includes(cityName)) || 
               (c.nameTr && c.nameTr.includes(cityName)) ||
               (c.nameAr && cityName && c.nameAr.toLowerCase() === cityName.toLowerCase()) // Exact match attempt
             );

             currentHotel = {
               nameAr: hotelName,
               cityName: cityName || 'Unknown',
               cityId: city?.id || '',
               roomTypes: [],
               isValid: true,
               errors: []
             };

             if (!city) {
               currentHotel.isValid = false;
               currentHotel.errors.push(`City "${cityName}" not found`);
             }
             processedHotels.push(currentHotel);
           }
        }

        // Case 2: No Hotel Name, but we have context (continuation of previous hotel)
        // OR we just set currentHotel above.
        
        if (currentHotel && roomType) {
           currentHotel.roomTypes.push({
             nameAr: roomType,
             board: board || 'bb',
             price: String(price || '0'),
             imageUrl: imgUrl || ''
           });
        }
      }
      
      setPreviewData(processedHotels);
      setOpen(true); // Ensure dialog is open
    };
    reader.readAsBinaryString(file);
  };

  const importMutation = useMutation({
    mutationFn: async (hotels: ImportedHotel[]) => {
      // Filter only valid hotels
      const validHotels = hotels.filter(h => h.isValid);
      if (validHotels.length === 0) throw new Error("No valid data to import");

      await api.post('/api/hotels/bulk', validHotels);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hotels'] });
      toast.success(`تم استيراد ${previewData.filter(h => h.isValid).length} فندق بنجاح`);
      setOpen(false);
      setPreviewData([]);
    },
    onError: () => toast.error('فشل الاستيراد')
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="flex gap-2">
        <Button variant="outline" onClick={handleDownloadTemplate} className="gap-2">
          <Download className="w-4 h-4" />
          تحميل نموذج Excel
        </Button>
        <div className="relative">
             <input
                type="file"
                accept=".xlsx"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleFileUpload}
                ref={fileInputRef}
                value="" // Reset value to allow same file upload
             />
             <Button className="gap-2">
               <FileUp className="w-4 h-4" />
               رفع ملف Excel
             </Button>
        </div>
      </div>

      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>معاينة الاستيراد</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-1">
          {previewData.length > 0 ? (
            <div className="space-y-4">
               {previewData.map((hotel, idx) => (
                 <div key={idx} className={`border rounded-lg p-3 ${hotel.isValid ? 'bg-card' : 'bg-red-50/10 border-red-500/50'}`}>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        {hotel.isValid ? <CheckCircle className="w-4 h-4 text-green-500" /> : <AlertTriangle className="w-4 h-4 text-red-500" />}
                        <span className="font-bold">{hotel.nameAr}</span>
                        <span className="text-sm text-muted-foreground">({hotel.cityName})</span>
                      </div>
                      <span className="text-xs bg-muted px-2 py-1 rounded">{hotel.roomTypes.length} غرف</span>
                    </div>
                    
                    {hotel.errors.length > 0 && (
                      <div className="text-red-500 text-sm mb-2">
                        {hotel.errors.join(', ')}
                      </div>
                    )}

                    <div className="ml-6 space-y-1 text-sm border-r-2 border-muted pr-3">
                       {hotel.roomTypes.slice(0, 3).map((r, i) => (
                         <div key={i} className="grid grid-cols-4 gap-2 text-muted-foreground">
                            <span>{r.nameAr}</span>
                            <span>{r.board}</span>
                            <span>{r.price}</span>
                         </div>
                       ))}
                       {hotel.roomTypes.length > 3 && <div className="text-xs text-muted-foreground">... +{hotel.roomTypes.length - 3} more</div>}
                    </div>
                 </div>
               ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد بيانات للمعاينه
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
           <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
           <Button 
             onClick={() => importMutation.mutate(previewData)} 
             disabled={importMutation.isPending || previewData.filter(h => h.isValid).length === 0}
           >
             {importMutation.isPending ? 'جاري الاستيراد...' : `استيراد ${previewData.filter(h => h.isValid).length} فندق`}
           </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

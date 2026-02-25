"use client";

import { useQuotationStore } from "@/lib/store/quotationStore";
import { Plus, Trash2, Plane, Car } from "lucide-react";
import { differenceInDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { DatePicker } from "@/components/ui/date-picker";

export default function StepFlightsCars() {
  const { 
    isFlightsEnabled, flights, 
    isCarsEnabled, carRentals,
    setSectionEnabled, 
    addFlight, updateFlight, removeFlight,
    addCarRental, updateCarRental, removeCarRental
  } = useQuotationStore();

  const handleAddFlight = () => {
    addFlight({
      id: crypto.randomUUID(),
      date: new Date(),
      description: "",
      type: "domestic",
      paxCount: 1,
      price: 0,
      currency: "USD",
    });
    if (!isFlightsEnabled) setSectionEnabled('flights', true);
  };

  const handleAddCar = () => {
    addCarRental({
      id: crypto.randomUUID(),
      pickupDate: new Date(),
      dropoffDate: new Date(),
      days: 1,
      description: "",
      price: 0,
      currency: "USD",
    });
    if (!isCarsEnabled) setSectionEnabled('cars', true);
  };

  const handleDateChange = (id: string, field: 'pickupDate' | 'dropoffDate', date?: Date) => {
    if (!date) return;
    const rental = carRentals.find(r => r.id === id);
    if (!rental) return;

    const updates: any = { [field]: date };
    let pDate = field === 'pickupDate' ? date : new Date(rental.pickupDate);
    let dDate = field === 'dropoffDate' ? date : new Date(rental.dropoffDate);

    if (pDate && dDate && !isNaN(pDate.getTime()) && !isNaN(dDate.getTime())) {
        const days = differenceInDays(dDate, pDate);
        updates.days = Math.max(1, days);
    }
    updateCarRental(id, updates);
  };

  return (
    <div className="space-y-8" dir="rtl">
      {/* FLIGHTS SECTION */}
      <Card className={`transition-all duration-300 ${isFlightsEnabled ? 'border-primary/20 shadow-md transform hover:-translate-y-1' : 'opacity-75 border-dashed'}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl transition-colors ${isFlightsEnabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                    <Plane size={28} strokeWidth={1.5} />
                </div>
                <div>
                    <CardTitle className="text-xl">الطيران (Flights)</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">إضافة حجوزات الطيران الداخلية والدولية</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <Label htmlFor="flights-toggle" className={`text-sm ${isFlightsEnabled ? 'font-bold text-primary' : 'text-gray-500'}`}>
                    {isFlightsEnabled ? 'مفعل' : 'غير مفعل'}
                </Label>
                <Switch 
                    id="flights-toggle"
                    checked={isFlightsEnabled}
                    onCheckedChange={(checked) => setSectionEnabled('flights', checked)}
                />
            </div>
        </CardHeader>
        
        {isFlightsEnabled && (
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-right w-40">التاريخ</TableHead>
                            <TableHead className="text-right">الخدمة (Route/Flight)</TableHead>
                            <TableHead className="text-right w-32">النوع</TableHead>
                            <TableHead className="text-center w-24">الركاب (PAX)</TableHead>
                            <TableHead className="text-center w-32">السعر</TableHead>
                            <TableHead className="text-center w-24">العملة</TableHead>
                            <TableHead className="text-center w-32">الإجمالي</TableHead>
                            <TableHead className="w-12"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {flights.map((flight) => (
                            <TableRow key={flight.id}>
                                <TableCell>
                                    <DatePicker 
                                        className="h-9 w-[140px]"
                                        date={flight.date ? new Date(flight.date) : undefined}
                                        setDate={(date) => {
                                            if (date) updateFlight(flight.id, { date });
                                        }}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Input 
                                        className="h-9"
                                        placeholder="مثال: ANKARA TO ISTANBUL"
                                        value={flight.description}
                                        onChange={(e) => updateFlight(flight.id, { description: e.target.value })}
                                    />
                                </TableCell>
                                <TableCell>
                                    <select
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                        value={flight.type}
                                        onChange={(e) => updateFlight(flight.id, { type: e.target.value as any })}
                                    >
                                        <option value="domestic">Domestic</option>
                                        <option value="international">International</option>
                                    </select>
                                </TableCell>
                                <TableCell>
                                    <Input 
                                        type="number" min="1"
                                        className="h-9 text-center"
                                        value={flight.paxCount}
                                        onChange={(e) => updateFlight(flight.id, { paxCount: Number(e.target.value) })}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Input 
                                        type="number" min="0"
                                        className="h-9 text-center"
                                        value={flight.price}
                                        onChange={(e) => updateFlight(flight.id, { price: Number(e.target.value) })}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Input 
                                        className="h-9 text-center uppercase"
                                        value={flight.currency}
                                        onChange={(e) => updateFlight(flight.id, { currency: e.target.value })}
                                        maxLength={3}
                                    />
                                </TableCell>
                                <TableCell className="font-bold text-center">
                                    {(flight.price * flight.paxCount).toLocaleString()} {flight.currency}
                                </TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="icon" onClick={() => removeFlight(flight.id)} className="text-red-500 hover:bg-red-50 hover:text-red-600">
                                        <Trash2 size={16} />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {flights.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                    لا توجد رحلات طيران مضافة
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                
                <div className="mt-4 flex justify-start">
                    <Button variant="outline" onClick={handleAddFlight} className="gap-2 border-dashed">
                        <Plus size={16} /> إضافة رحلة (Add Flight)
                    </Button>
                </div>
            </CardContent>
        )}
      </Card>

      {/* RENT A CAR SECTION */}
      <Card className={`transition-all duration-300 ${isCarsEnabled ? 'border-primary/20 shadow-md transform hover:-translate-y-1' : 'opacity-75 border-dashed'}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl transition-colors ${isCarsEnabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                    <Car size={28} strokeWidth={1.5} />
                </div>
                <div>
                    <CardTitle className="text-xl">تأجير السيارات (Rent a Car)</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">إضافة تفاصيل السيارة والمسار</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <Label htmlFor="cars-toggle" className={`text-sm ${isCarsEnabled ? 'font-bold text-primary' : 'text-gray-500'}`}>
                    {isCarsEnabled ? 'مفعل' : 'غير مفعل'}
                </Label>
                <Switch 
                    id="cars-toggle"
                    checked={isCarsEnabled}
                    onCheckedChange={(checked) => setSectionEnabled('cars', checked)}
                />
            </div>
        </CardHeader>

        {isCarsEnabled && (
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-right w-40">تاريخ الاستلام</TableHead>
                            <TableHead className="text-right w-40">تاريخ التسليم</TableHead>
                            <TableHead className="text-right">الخدمة (Car Details)</TableHead>
                            <TableHead className="text-center w-24">الأيام</TableHead>
                            <TableHead className="text-center w-32">السعر / يوم</TableHead>
                            <TableHead className="text-center w-24">العملة</TableHead>
                            <TableHead className="text-center w-32">الإجمالي</TableHead>
                            <TableHead className="w-12"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {carRentals.map((rental) => (
                            <TableRow key={rental.id}>
                                <TableCell>
                                    <DatePicker 
                                        className="h-9 w-[140px]"
                                        date={rental.pickupDate ? new Date(rental.pickupDate) : undefined}
                                        setDate={(date) => handleDateChange(rental.id, 'pickupDate', date)}
                                    />
                                </TableCell>
                                <TableCell>
                                    <DatePicker 
                                        className="h-9 w-[140px]"
                                        date={rental.dropoffDate ? new Date(rental.dropoffDate) : undefined}
                                        setDate={(date) => handleDateChange(rental.id, 'dropoffDate', date)}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Input 
                                        className="h-9"
                                        placeholder="مثال: Mercedes Vito + Driver"
                                        value={rental.description}
                                        onChange={(e) => updateCarRental(rental.id, { description: e.target.value })}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Input 
                                        type="number" min="1"
                                        className="h-9 text-center"
                                        value={rental.days}
                                        onChange={(e) => updateCarRental(rental.id, { days: Number(e.target.value) })}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Input 
                                        type="number" min="0"
                                        className="h-9 text-center"
                                        value={rental.price}
                                        onChange={(e) => updateCarRental(rental.id, { price: Number(e.target.value) })}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Input 
                                        className="h-9 text-center uppercase"
                                        value={rental.currency}
                                        onChange={(e) => updateCarRental(rental.id, { currency: e.target.value })}
                                        maxLength={3}
                                    />
                                </TableCell>
                                <TableCell className="font-bold text-center">
                                    {(rental.price * rental.days).toLocaleString()} {rental.currency}
                                </TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="icon" onClick={() => removeCarRental(rental.id)} className="text-red-500 hover:bg-red-50 hover:text-red-600">
                                        <Trash2 size={16} />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {carRentals.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                    لا توجد سيارات مضافة
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                <div className="mt-4 flex justify-start">
                    <Button variant="outline" onClick={handleAddCar} className="gap-2 border-dashed">
                        <Plus size={16} /> إضافة سيارة (Add Car)
                    </Button>
                </div>
            </CardContent>
        )}
      </Card>
    </div>
  );
}

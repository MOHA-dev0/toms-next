"use client";

import { useQuotationStore } from "@/lib/store/quotationStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator } from "lucide-react";
import { differenceInDays } from "date-fns";

export default function StepFinancials() {
  const {
    hotelSegments,
    itineraryServices,
    otherServices,
    isFlightsEnabled,
    flights,
    isCarsEnabled,
    carRentals,
    financials,
    setFinancials
  } = useQuotationStore();

  // 1. Calculate Costs
  const hotelCost = hotelSegments.reduce((sum, h) => {
    let nights = 1;
    if (h.checkIn && h.checkOut) {
      const pDate = new Date(h.checkIn);
      const dDate = new Date(h.checkOut);
      if (!isNaN(pDate.getTime()) && !isNaN(dDate.getTime())) {
        nights = Math.max(1, differenceInDays(dDate, pDate));
      }
    }
    return sum + (h.sellingPrice * nights * h.roomsCount);
  }, 0);

  const servicesCost = itineraryServices.reduce((sum, s) => sum + (s.sellingPrice * s.quantity), 0);
  
  const carCost = isCarsEnabled 
    ? carRentals.reduce((sum, c) => sum + (c.price * c.days), 0)
    : 0;
    
  const otherServicesCost = otherServices.reduce((sum, s) => sum + (s.sellingPrice * s.quantity), 0);
  
  const flightCost = isFlightsEnabled 
    ? flights.reduce((sum, f) => sum + (f.price * f.paxCount), 0)
    : 0;

  const totalCost = hotelCost + servicesCost + carCost + otherServicesCost + flightCost;

  // 2. Calculate Merge (Markup) & Commission
  const mergeAmount = financials.marginType === 'percentage' 
    ? totalCost * ((financials.marginValue || 0) / 100)
    : (financials.marginValue || 0);

  const commissionAmount = financials.commissionType === 'percentage'
    ? totalCost * ((financials.commissionValue || 0) / 100)
    : (financials.commissionValue || 0);

  const totalSales = totalCost + mergeAmount + commissionAmount;

  return (
    <div className="space-y-8" dir="rtl">
      <Card className="border-primary/20 shadow-md">
        <CardHeader className="flex flex-row items-center gap-4 pb-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
            <Calculator size={28} strokeWidth={1.5} />
          </div>
          <div>
            <CardTitle className="text-xl">الملخص المالي (Financial Summary)</CardTitle>
            <p className="text-sm text-gray-500 mt-1">تكلفة الخدمات وإضافة النسب والتسعير النهائي</p>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="max-w-2xl mx-auto border rounded-xl overflow-hidden shadow-sm">
            <Table>
              <TableBody>
                {/* Costs */}
                <TableRow className="bg-white hover:bg-white">
                  <TableCell className="font-bold text-gray-700 w-1/2 text-right">
                    فنادق (HOTELS)
                  </TableCell>
                  <TableCell className="text-left font-semibold">
                    {hotelCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
                
                <TableRow className="bg-white hover:bg-white">
                  <TableCell className="font-bold text-gray-700 text-right">
                    مواصلات / برامج (TRANSPORTATION)
                  </TableCell>
                  <TableCell className="text-left font-semibold">
                    {servicesCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>

                <TableRow className="bg-white hover:bg-white">
                  <TableCell className="font-bold text-gray-700 text-right">
                    خدمات أخرى (OTHER SERVICES)
                  </TableCell>
                  <TableCell className="text-left font-semibold">
                    {otherServicesCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>

                <TableRow className="bg-white hover:bg-white">
                  <TableCell className="font-bold text-gray-700 text-right">
                    طيران (FLIGHT)
                  </TableCell>
                  <TableCell className="text-left font-semibold">
                    {flightCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>

                <TableRow className="bg-white hover:bg-white">
                  <TableCell className="font-bold text-gray-700 text-right">
                    تأجير سيارات (RENT A CAR)
                  </TableCell>
                  <TableCell className="text-left font-semibold">
                    {carCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>

                {/* Total Cost */}
                <TableRow className="bg-gray-100 hover:bg-gray-100 border-y-2 border-gray-300">
                  <TableCell className="font-bold text-gray-900 text-lg">
                    التكلفة الإجمالية (TOTAL COST)
                  </TableCell>
                  <TableCell className="text-left font-bold text-lg text-gray-900">
                    {totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>

                {/* Margins */}
                <TableRow className="bg-blue-50/50 hover:bg-blue-50/50">
                  <TableCell className="font-bold text-gray-700 align-middle text-right">
                    <div className="flex flex-col gap-1">
                      <span>هامش الربح (MERGE % OR NET AMOUNT)</span>
                      <div className="flex gap-2 mt-1 w-48">
                        <select
                          className="p-1 border bg-white rounded-md text-sm cursor-pointer"
                          value={financials.marginType}
                          onChange={(e) => setFinancials({ ...financials, marginType: e.target.value as 'percentage' | 'fixed' })}
                        >
                          <option value="percentage">%</option>
                          <option value="fixed">Net</option>
                        </select>
                        <Input 
                          type="number"
                          min="0"
                          step="0.01"
                          dir="ltr"
                          className="h-8 text-right"
                          value={financials.marginValue || ''}
                          onChange={(e) => setFinancials({ ...financials, marginValue: Number(e.target.value) })}
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-left font-semibold text-blue-700 align-middle">
                    {mergeAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>

                {/* Commission */}
                <TableRow className="bg-blue-50/50 hover:bg-blue-50/50">
                  <TableCell className="font-bold text-gray-700 align-middle text-right">
                    <div className="flex flex-col gap-1">
                      <span>العمولة (COMMISSION % OR NET AMOUNT) (اختياري)</span>
                      <div className="flex gap-2 mt-1 w-48">
                        <select
                          className="p-1 border bg-white rounded-md text-sm cursor-pointer"
                          value={financials.commissionType}
                          onChange={(e) => setFinancials({ ...financials, commissionType: e.target.value as 'percentage' | 'fixed' })}
                        >
                          <option value="percentage">%</option>
                          <option value="fixed">Net</option>
                        </select>
                        <Input 
                          type="number"
                          min="0"
                          step="0.01"
                          dir="ltr"
                          className="h-8 text-right"
                          value={financials.commissionValue || ''}
                          onChange={(e) => setFinancials({ ...financials, commissionValue: Number(e.target.value) })}
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-left font-semibold text-blue-700 align-middle">
                    {commissionAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>

                {/* Total Sales */}
                <TableRow className="bg-blue-600 hover:bg-blue-600 border-t-2 border-blue-800">
                  <TableCell className="font-bold text-white text-lg">
                    إجمالي البيع (TOTAL SALES)
                  </TableCell>
                  <TableCell className="text-left font-bold text-xl text-white">
                    {totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

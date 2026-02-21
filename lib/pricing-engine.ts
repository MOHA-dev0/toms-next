
import { QuotationState } from './store/quotationStore';
import { differenceInDays } from 'date-fns';

export interface PricingSummary {
  hotelCost: number;
  transportationCost: number; // Cars
  flightCost: number;
  otherServicesCost: number;
  servicesCost: number; // Daily program services
  totalCost: number;
  markupAmount: number;
  commissionAmount: number;
  totalSales: number;
  profit: number;
}

export const calculateQuotationTotals = (state: QuotationState): PricingSummary => {
  const { hotelSegments, flights, carRentals, itineraryServices, otherServices, financials, isFlightsEnabled, isCarsEnabled } = state;

  // 1. Calculate Base Component Prices (Matching StepFinancials)
  const hotelCost = hotelSegments.reduce((sum, h) => {
    let nights = 1;
    if (h.checkIn && h.checkOut) {
      const pDate = new Date(h.checkIn);
      const dDate = new Date(h.checkOut);
      if (!isNaN(pDate.getTime()) && !isNaN(dDate.getTime())) {
        nights = Math.max(1, differenceInDays(dDate, pDate));
      }
    }
    // StepFinancials computes this using sellingPrice
    return sum + ((h.sellingPrice || 0) * nights * (h.roomsCount || 1));
  }, 0);

  const flightCost = isFlightsEnabled 
    ? flights.reduce((sum, f) => sum + ((f.price || 0) * (f.paxCount || 1)), 0)
    : 0;
  
  const transportationCost = isCarsEnabled 
    ? carRentals.reduce((sum, c) => sum + ((c.price || 0) * (c.days || 1)), 0)
    : 0;
  
  const servicesCost = itineraryServices.reduce((sum, s) => sum + ((s.sellingPrice || 0) * (s.quantity || 1)), 0);
  
  const otherServicesCost = otherServices.reduce((sum, s) => sum + ((s.sellingPrice || 0) * (s.quantity || 1)), 0);

  const totalCost = hotelCost + flightCost + transportationCost + servicesCost + otherServicesCost;

  // 2. Calculate Margins and Commissions (Matching StepFinancials)
  const markupAmount = financials.marginType === 'percentage' 
    ? totalCost * ((financials.marginValue || 0) / 100)
    : (financials.marginValue || 0);

  const commissionAmount = financials.commissionType === 'percentage'
    ? totalCost * ((financials.commissionValue || 0) / 100)
    : (financials.commissionValue || 0);

  const totalSales = totalCost + markupAmount + commissionAmount;
  const profit = markupAmount; // Your profit is the raw margin added
  
  
  return {
    hotelCost,
    transportationCost,
    flightCost,
    otherServicesCost,
    servicesCost,
    totalCost,
    markupAmount,
    commissionAmount,
    totalSales,
    profit
  };
};

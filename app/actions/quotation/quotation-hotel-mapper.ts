import { QuotationHotel, RoomType, RoomPricing, RoomUsage, BoardType, Currency } from "@prisma/client";
import { toSafeDate } from "./quotation-date-utils";

export interface HotelSegmentState {
  hotelId: string;
  roomTypeId?: string;
  checkIn?: string | Date | null;
  checkOut?: string | Date | null;
  usage?: string;
  boardType?: string;
  sellingPrice?: number;
  purchasePrice?: number;
  originalPrice?: number;
  originalCurrency?: string;
  exchangeRate?: number;
  roomsCount?: number;
  notes?: string;
}

export interface MappedQuotationHotel {
  hotelId: string;
  roomTypeId: string;
  checkIn: Date;
  checkOut: Date;
  nights: number;
  roomsCount: number;
  usage: RoomUsage;
  board: BoardType;
  purchasePrice: number;
  sellingPrice: number;
  notes: string | null;
  originalPrice?: number;
  originalCurrency?: Currency | null;
  exchangeRate?: number | null;
}

export function mapHotelSegments(
  hotelSegments: HotelSegmentState[],
  existingQuotationHotels: QuotationHotel[],
  rebalanceMode: string | undefined,
  roomTypePricingMap: Map<string, RoomType & { roomPricing: RoomPricing[] }>
): MappedQuotationHotel[] {
  const result: MappedQuotationHotel[] = [];

  for (const h of hotelSegments) {
    const checkInDate = toSafeDate(h.checkIn) || new Date();
    const checkOutDate = toSafeDate(h.checkOut) || new Date();
    const nightsCount = Math.max(1, Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)));
    
    let calculatedSellingPrice = h.sellingPrice || 0;
    let pPrice = h.purchasePrice || 0;
    let originalPri = h.originalPrice;
    let originalCurr = h.originalCurrency;

    const matchedOldHotel = existingQuotationHotels.find(old => 
      old.hotelId === h.hotelId && 
      old.roomTypeId === h.roomTypeId && 
      old.checkIn.getTime() === checkInDate.getTime() && 
      old.checkOut.getTime() === checkOutDate.getTime() &&
      old.usage === (h.usage || 'dbl') &&
      old.board === (h.boardType || 'bb')
    );

    if (matchedOldHotel && rebalanceMode !== 'rebalance_internally') {
      pPrice = Number(matchedOldHotel.purchasePrice);
      calculatedSellingPrice = Number(matchedOldHotel.sellingPrice);
      originalPri = matchedOldHotel.originalPrice ? Number(matchedOldHotel.originalPrice) : undefined;
      originalCurr = matchedOldHotel.originalCurrency || undefined;
    } else if (h.roomTypeId) {
      const roomTypeData = roomTypePricingMap.get(h.roomTypeId);
      
      if (roomTypeData) {
        const pricing = roomTypeData.roomPricing.find(p => {
          const start = new Date(p.validFrom);
          start.setHours(0,0,0,0);
          const end = new Date(p.validTo);
          end.setHours(0,0,0,0);
          const checkInMatch = new Date(checkInDate);
          checkInMatch.setHours(0,0,0,0);
          return start <= checkInMatch && end >= checkInMatch;
        });

        const dbPrice = pricing ? Number(pricing.sellingPrice) : Number(roomTypeData.basePrice || 0);
        const dbCurrency = pricing ? pricing.currency : (roomTypeData.currency || 'USD');

        pPrice = dbPrice;
        originalPri = dbPrice;
        originalCurr = dbCurrency;

        if (dbCurrency === 'USD') {
          calculatedSellingPrice = dbPrice;
        } else if (h.exchangeRate && h.exchangeRate > 0) {
          calculatedSellingPrice = Math.round(dbPrice * h.exchangeRate * 100) / 100;
        } else {
          calculatedSellingPrice = dbPrice;
        }

        if (h.purchasePrice !== undefined && h.purchasePrice !== pPrice) {
           pPrice = h.purchasePrice;
        }

        if (h.sellingPrice !== undefined && h.sellingPrice !== calculatedSellingPrice) {
           calculatedSellingPrice = h.sellingPrice;
        }
      }
    }

    result.push({
      hotelId: h.hotelId,
      roomTypeId: h.roomTypeId || '',
      checkIn: checkInDate as Date,
      checkOut: checkOutDate as Date,
      nights: nightsCount,
      roomsCount: h.roomsCount || 1,
      usage: (h.usage as RoomUsage) || 'dbl',
      board: (h.boardType as BoardType) || 'bb',
      purchasePrice: pPrice as number,
      sellingPrice: calculatedSellingPrice as number,
      notes: h.notes || null,
      ...(originalPri ? {
        originalPrice: originalPri,
        originalCurrency: (originalCurr as Currency) || null,
        exchangeRate: h.exchangeRate || null,
      } : {}),
    });
  }

  return result;
}

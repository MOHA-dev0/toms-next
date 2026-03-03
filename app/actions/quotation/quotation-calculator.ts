export interface CalculateSubtotalItem {
  sellingPrice?: number;
  nights?: number;
  roomsCount?: number;
  price?: number;
  paxCount?: number;
  days?: number;
  quantity?: number;
}

export function calculateActualSubtotal(
  hotels: CalculateSubtotalItem[],
  flights: CalculateSubtotalItem[],
  cars: CalculateSubtotalItem[],
  services: CalculateSubtotalItem[]
): number {
  let actualSubtotal = 0;
  
  for (const h of hotels) {
    actualSubtotal += (Number(h.sellingPrice) || 0) * (Number(h.nights) || 1) * (Number(h.roomsCount) || 1);
  }
  for (const f of flights) {
    actualSubtotal += (Number(f.price) || 0) * (Number(f.paxCount) || 1);
  }
  for (const c of cars) {
    actualSubtotal += (Number(c.price) || 0) * (Number(c.days) || 1);
  }
  for (const s of services) {
    actualSubtotal += (Number(s.sellingPrice) || 0) * (Number(s.quantity) || 1);
  }
  
  return actualSubtotal;
}

export interface FinalFinancials {
  finalTotalPrice: number;
  finalSubtotal: number;
  finalCommission: number;
  finalProfit: number;
}

export function calculateFinalFinancials(
  rebalanceMode: 'update_total' | 'rebalance_internally' | undefined,
  actualSubtotal: number,
  inputTotalPrice: number,
  inputProfit: number,
  inputCommission: number,
  existingTotalPrice: number,
  existingCommission: number
): FinalFinancials {
  let finalTotalPrice = inputTotalPrice;
  let finalSubtotal = actualSubtotal;
  let finalCommission = inputCommission;
  let finalProfit = inputProfit;

  if (rebalanceMode === 'rebalance_internally') {
    finalTotalPrice = existingTotalPrice;
    finalCommission = existingCommission;
    finalProfit = finalTotalPrice - finalSubtotal - finalCommission;
  } else {
    finalProfit = inputProfit;
    finalCommission = inputCommission;
    finalTotalPrice = finalSubtotal + finalProfit + finalCommission;
  }

  return {
    finalTotalPrice,
    finalSubtotal,
    finalCommission,
    finalProfit
  };
}

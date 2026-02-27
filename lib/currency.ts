/**
 * Currency Conversion Utility
 * Uses the Frankfurter API (free, no API key required)
 * https://www.frankfurter.app/
 * 
 * Design:
 * - Caches the exchange rate in memory for 1 hour to avoid excessive API calls
 * - Falls back gracefully if the API is unreachable
 * - Converts any supported currency to USD
 */

interface CachedRate {
  rate: number;
  timestamp: number;
  fromCurrency: string;
  toCurrency: string;
}

const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour
const rateCache: Map<string, CachedRate> = new Map();

/**
 * Fetch the latest exchange rate from the Frankfurter API.
 * Returns the rate to convert `from` currency to `to` currency.
 * Example: getExchangeRate('EUR', 'USD') => 1.08 (1 EUR = 1.08 USD)
 */
export async function getExchangeRate(
  from: string = 'EUR',
  to: string = 'USD'
): Promise<{ rate: number; source: 'api' | 'cache' | 'fallback'; error?: string }> {
  // Same currency — no conversion needed
  if (from === to) {
    return { rate: 1, source: 'api' };
  }

  const cacheKey = `${from}_${to}`;

  // Check cache first
  const cached = rateCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
    return { rate: cached.rate, source: 'cache' };
  }

  // Fetch from Frankfurter API
  try {
    const response = await fetch(
      `https://api.frankfurter.app/latest?from=${from}&to=${to}`,
      { 
        signal: AbortSignal.timeout(5000), // 5 second timeout
        next: { revalidate: 3600 } // Next.js ISR cache for 1 hour 
      }
    );

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();
    const rate = data.rates?.[to];

    if (!rate || typeof rate !== 'number') {
      throw new Error(`Rate not found for ${from} -> ${to}`);
    }

    // Cache the result
    rateCache.set(cacheKey, {
      rate,
      timestamp: Date.now(),
      fromCurrency: from,
      toCurrency: to,
    });

    return { rate, source: 'api' };
  } catch (error: any) {
    // Try to return stale cache as fallback
    if (cached) {
      return { 
        rate: cached.rate, 
        source: 'cache', 
        error: `API unavailable, using cached rate from ${new Date(cached.timestamp).toLocaleString()}` 
      };
    }

    // Hardcoded fallback rates (last known approximate values)
    const fallbackRates: Record<string, Record<string, number>> = {
      EUR: { USD: 1.08, TRY: 35.0, SAR: 4.05, AED: 3.97, GBP: 0.86 },
      TRY: { USD: 0.031, EUR: 0.029 },
      SAR: { USD: 0.267, EUR: 0.247 },
      AED: { USD: 0.272, EUR: 0.252 },
      GBP: { USD: 1.27, EUR: 1.16 },
    };

    const fallbackRate = fallbackRates[from]?.[to];
    if (fallbackRate) {
      return { 
        rate: fallbackRate, 
        source: 'fallback', 
        error: `API unavailable: ${error.message}. Using hardcoded fallback rate.` 
      };
    }

    return { 
      rate: 0, 
      source: 'fallback', 
      error: `Cannot convert ${from} to ${to}: ${error.message}` 
    };
  }
}

/**
 * Convert an amount from one currency to another.
 * Returns the converted amount and the rate used.
 */
export async function convertCurrency(
  amount: number,
  from: string,
  to: string = 'USD'
): Promise<{ 
  convertedAmount: number; 
  rate: number; 
  source: 'api' | 'cache' | 'fallback'; 
  error?: string 
}> {
  if (from === to || amount === 0) {
    return { convertedAmount: amount, rate: 1, source: 'api' };
  }

  const { rate, source, error } = await getExchangeRate(from, to);
  
  return {
    convertedAmount: Math.round(amount * rate * 100) / 100, // Round to 2 decimals
    rate,
    source,
    error,
  };
}

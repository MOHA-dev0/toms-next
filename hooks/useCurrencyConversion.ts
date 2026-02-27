"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface ExchangeRateResult {
  rate: number;
  source: "api" | "cache" | "fallback" | "manual";
  loading: boolean;
  error?: string;
  lastUpdated?: Date;
}

interface UseCurrencyConversionOptions {
  from: string;
  to?: string;
  enabled?: boolean;
}

/**
 * React hook for live currency conversion.
 * Fetches and caches exchange rates from /api/currency/rate.
 * 
 * Usage:
 *   const { rate, convertToUsd, loading } = useCurrencyConversion({ from: 'EUR' });
 *   const usdPrice = convertToUsd(100); // converts 100 EUR to USD
 */
export function useCurrencyConversion({ from, to = "USD", enabled = true }: UseCurrencyConversionOptions) {
  const [result, setResult] = useState<ExchangeRateResult>({
    rate: 1,
    source: "cache",
    loading: false,
  });
  const [manualRate, setManualRate] = useState<number | null>(null);
  const [isManualMode, setIsManualMode] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const fetchRate = useCallback(async () => {
    if (!enabled || from === to) {
      setResult({ rate: 1, source: "api", loading: false });
      return;
    }

    // Cancel previous request
    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();

    setResult((prev) => ({ ...prev, loading: true }));

    try {
      const res = await fetch(`/api/currency/rate?from=${from}&to=${to}`, {
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();

      setResult({
        rate: data.rate,
        source: data.source,
        loading: false,
        error: data.warning,
        lastUpdated: new Date(),
      });
    } catch (error: any) {
      if (error.name === "AbortError") return;
      
      setResult((prev) => ({
        ...prev,
        loading: false,
        error: `Failed to fetch rate: ${error.message}`,
        source: "fallback",
      }));
    }
  }, [from, to, enabled]);

  // Fetch rate when currency changes
  useEffect(() => {
    if (from !== to && enabled) {
      fetchRate();
    }
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, [fetchRate, from, to, enabled]);

  // Get the effective rate (manual override or API)
  const effectiveRate = isManualMode && manualRate !== null ? manualRate : result.rate;

  // Convert a price to USD using the current rate
  const convertToUsd = useCallback(
    (amount: number): number => {
      if (from === to || !amount) return amount;
      return Math.round(amount * effectiveRate * 100) / 100;
    },
    [effectiveRate, from, to]
  );

  // Enable manual mode with a custom rate
  const enableManualRate = useCallback((rate: number) => {
    setManualRate(rate);
    setIsManualMode(true);
  }, []);

  // Disable manual mode and revert to API rate
  const disableManualRate = useCallback(() => {
    setManualRate(null);
    setIsManualMode(false);
  }, []);

  return {
    rate: effectiveRate,
    source: isManualMode ? "manual" as const : result.source,
    loading: result.loading,
    error: result.error,
    lastUpdated: result.lastUpdated,
    convertToUsd,
    isManualMode,
    enableManualRate,
    disableManualRate,
    refetch: fetchRate,
  };
}

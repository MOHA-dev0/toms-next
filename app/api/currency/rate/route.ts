import { NextRequest, NextResponse } from 'next/server';
import { getExchangeRate } from '@/lib/currency';

/**
 * GET /api/currency/rate?from=EUR&to=USD
 * Returns the current exchange rate between two currencies.
 * Used by the frontend to display live conversion previews.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from') || 'EUR';
    const to = searchParams.get('to') || 'USD';

    const supportedCurrencies = ['USD', 'EUR', 'TRY', 'SAR', 'AED', 'GBP'];
    
    if (!supportedCurrencies.includes(from) || !supportedCurrencies.includes(to)) {
      return NextResponse.json(
        { error: `Unsupported currency. Supported: ${supportedCurrencies.join(', ')}` },
        { status: 400 }
      );
    }

    const { rate, source, error } = await getExchangeRate(from, to);

    return NextResponse.json({
      from,
      to,
      rate,
      source,
      ...(error && { warning: error }),
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Currency rate error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exchange rate', details: error.message },
      { status: 500 }
    );
  }
}

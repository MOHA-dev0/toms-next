import { useQuery } from '@tanstack/react-query';

export interface Quotation {
  id: string;
  referenceNumber: string;
  customerName: string;
  agentName: string;
  destination: string;
  paxCount: number;
  totalPrice: number;
  paidAmount: number;
  createdAt: Date;
  status: string;
}

export interface QuotationMeta {
  totalCount: number;
  draftCount: number;
  unconfirmedCount: number;
  confirmedCount: number;
  filteredCount: number;
  page: number;
  pageCount: number;
}

export interface QuotationsResponse {
  meta: QuotationMeta;
  data: Quotation[];
}

interface UseQuotationsFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export function useQuotations(filters: UseQuotationsFilters) {
  const { page = 1, limit = 10, search = '', status = 'all' } = filters;

  return useQuery<QuotationsResponse>({
    queryKey: ['quotations', { page, limit, search, status }],
    queryFn: async ({ signal }) => {
      const searchParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search,
        status,
      });

      const res = await fetch(`/api/quotations?${searchParams.toString()}`, {
        signal, // React Query uses this to cancel previous requests
      });

      if (!res.ok) {
        throw new Error('Failed to fetch quotations');
      }

      return res.json();
    },
    placeholderData: (previousData) => previousData, // Keeps previous data while fetching new to prevent flicker
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}

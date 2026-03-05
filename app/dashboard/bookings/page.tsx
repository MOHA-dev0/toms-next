import { Suspense } from 'react';
import { unstable_cache } from 'next/cache';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { getUserContext, getAccessFilters } from '@/lib/permissions';
import BookingsClientView from './components/BookingsClientView';

// SECURITY: ensure we never store HTML statically and always check JWT/Cookies
export const dynamic = 'force-dynamic';

// SAFE CACHING: Uses next cached data layer (without Redis) taking JSON stringified security filters as cache keys
const getCachedQueries = unstable_cache(
  async (bFilterJson: string, qFilterJson: string, tab: string, search: string, page: number) => {
    const limit = 10;
    const skip = (page - 1) * limit;

    const bFilters = JSON.parse(bFilterJson);
    const qFilters = JSON.parse(qFilterJson);

    const searchFilterBooking = search
      ? {
          OR: [
            { referenceNumber: { contains: search, mode: 'insensitive' as const } },
            { quotation: { referenceNumber: { contains: search, mode: 'insensitive' as const } } },
            { vouchers: { some: { voucherCode: { contains: search, mode: 'insensitive' as const } } } },
          ],
        }
      : {};

    const searchFilterQuotation = search
      ? {
          OR: [
            { referenceNumber: { contains: search, mode: 'insensitive' as const } },
            { customer: { nameAr: { contains: search, mode: 'insensitive' as const } } },
          ],
        }
      : {};

    if (tab === 'bookings') {
      const [data, total] = await Promise.all([
        prisma.booking.findMany({
          where: { ...bFilters, status: 'confirmed', ...searchFilterBooking },
          select: { // ONLY Select precisely what is rendered to reduce DB compute & network size
            id: true,
            referenceNumber: true,
            status: true,
            invoiceNeedsUpdate: true,
            createdAt: true,
            quotation: {
              select: {
                referenceNumber: true,
                customer: { select: { nameAr: true } },
              },
            },
            _count: {
              select: { vouchers: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.booking.count({ 
          where: { ...bFilters, status: 'confirmed', ...searchFilterBooking }
        }),
      ]);
      return { data, total, limit };
    }

    // Default: 'confirmed' tab
    const [data, total] = await Promise.all([
      prisma.quotation.findMany({
        where: {
          ...qFilters,
          status: 'confirmed',
          bookings: { none: { status: 'confirmed' } },
          ...searchFilterQuotation,
        },
        select: {
          id: true,
          referenceNumber: true,
          startDate: true,
          customer: { select: { nameAr: true } },
          salesEmployee: { select: { nameAr: true } },
          bookings: { 
            select: { id: true, status: true },
            take: 1
          },
          _count: {
            select: { quotationHotels: true, quotationCars: true, passengers: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.quotation.count({
        where: {
          ...qFilters,
          status: 'confirmed',
          bookings: { none: { status: 'confirmed' } },
          ...searchFilterQuotation,
        },
      }),
    ]);

    return { data, total, limit };
  },
  ['bookings-list-cache'], // Built-in Next.js file-system cache
  { revalidate: 30 }       // Holds data for 30s to reduce DB hits on pagination/refresh
);

type PageProps = {
  searchParams: Promise<{ tab?: string; search?: string; page?: string }>;
};

export default async function BookingsPage({ searchParams }: PageProps) {
  const user = await getUserContext();
  if (!user) {
    redirect('/login');
  }

  // Next.js 15: searchParams is a Promise
  const resolvedParams = await searchParams;
  const tab = (resolvedParams.tab as 'confirmed' | 'bookings') || 'confirmed';
  const search = resolvedParams.search || '';
  const page = parseInt(resolvedParams.page || '1', 10);

  // Parse security rules for database query securely at the edge/server level
  const bFilter = getAccessFilters(user, 'booking');
  const qFilter = getAccessFilters(user, 'quotation');

  const { data, total, limit } = await getCachedQueries(
    JSON.stringify(bFilter),
    JSON.stringify(qFilter),
    tab,
    search,
    page
  );

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      }
    >
      <BookingsClientView
        initialData={data}
        total={total}
        totalPages={totalPages}
        currentPage={page}
        currentTab={tab}
        currentSearch={search}
      />
    </Suspense>
  );
}

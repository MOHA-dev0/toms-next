'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Search, Bell, Menu, FileText, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  onMenuClick?: () => void;
}

interface QuickSearchResult {
  id: string;
  referenceNumber: string;
  customerName: string;
  status: string;
  totalPrice: number;
}

export function Header({ title, subtitle, onMenuClick }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { employee, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [time, setTime] = useState('');
  const [results, setResults] = useState<QuickSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeString = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Europe/Istanbul',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).format(now);
      setTime(timeString);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Live search with debounce
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/quotations?search=${encodeURIComponent(searchQuery.trim())}&limit=5`);
        if (res.ok) {
          const json = await res.json();
          setResults(json.data || []);
          setShowResults(true);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      confirmed: { label: 'مؤكد', cls: 'bg-emerald-100 text-emerald-700' },
      draft: { label: 'مسودة', cls: 'bg-slate-100 text-slate-600' },
      sent: { label: 'غير مؤكد', cls: 'bg-orange-100 text-orange-700' },
      cancelled: { label: 'ملغي', cls: 'bg-red-100 text-red-600' },
    };
    const s = map[status] || { label: status, cls: 'bg-gray-100 text-gray-600' };
    return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>;
  };

  const getPageHeader = () => {
    if (pathname === '/dashboard') {
      return {
        title: 'لوحة التحكم',
        subtitle: `مرحباً ${employee?.nameAr || user?.email || 'المستخدم'} - ${time} (توقيت تركيا)`
      };
    }
    if (pathname === '/dashboard/cities') return { title: 'المدن', subtitle: 'إدارة المدن والوجهات' };
    if (pathname === '/dashboard/hotels') return { title: 'الفنادق', subtitle: 'إدارة الفنادق والغرف' };
    if (pathname === '/dashboard/services') return { title: 'الخدمات', subtitle: 'إدارة الخدمات والبرامج' };
    if (pathname === '/dashboard/other-services') return { title: 'خدمات أخرى', subtitle: 'إدارة الخدمات' };
    if (pathname === '/dashboard/companies') return { title: 'الشركات', subtitle: 'إدارة الشركات' };
    if (pathname === '/dashboard/agents') return { title: 'الوكالات', subtitle: 'إدارة الوكالات' };
    if (pathname === '/dashboard/employees') return { title: 'الموظفين', subtitle: 'إدارة الموظفين' };
    if (pathname === '/dashboard/reports') return { title: 'التقارير', subtitle: 'إدارة التقارير' };
    if (pathname === '/dashboard/financial-reports') return { title: 'التقارير المالية', subtitle: 'إدارة التقارير المالية' };
    return { title: 'TOMS', subtitle: '' };
  };

  const pageHeader = getPageHeader();
  const displayTitle = title || pageHeader.title;
  const displaySubtitle = subtitle || pageHeader.subtitle;

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">{displayTitle}</h1>
          <p className="text-sm text-muted-foreground">{displaySubtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Global Quick Search */}
        <div ref={searchRef} className="hidden md:block relative">
          <div className="relative">
            {isSearching ? (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 animate-spin" />
            ) : (
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            )}
            <Input
              type="search"
              placeholder="بحث برقم المرجع..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => { if (results.length > 0) setShowResults(true); }}
              className="w-72 pr-10 bg-muted/50 border-0 focus:bg-card transition-all"
            />
          </div>

          {/* Search Results Dropdown */}
          {showResults && (
            <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-fade-in" dir="rtl">
              {results.length > 0 ? (
                <div>
                  <div className="px-4 py-2 text-xs font-bold text-slate-400 bg-slate-50 border-b">
                    نتائج البحث ({results.length})
                  </div>
                  {results.map((q) => (
                    <Link
                      key={q.id}
                      href={`/dashboard/quotations/${q.id}`}
                      onClick={() => {
                        setShowResults(false);
                        setSearchQuery('');
                      }}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50/70 transition-colors cursor-pointer border-b border-slate-50 last:border-0"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-800">{q.referenceNumber}</span>
                          {getStatusBadge(q.status)}
                        </div>
                        <div className="text-xs text-slate-500 truncate">{q.customerName}</div>
                      </div>
                      <div className="text-sm font-bold text-slate-700">
                        ${q.totalPrice?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-6 text-center text-sm text-slate-400">
                  لا توجد نتائج لـ "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 left-1.5 w-2 h-2 bg-destructive rounded-full" />
            </Button>
          </DropdownMenuTrigger>
          {/* <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3 cursor-pointer">
           
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3 cursor-pointer">
           
            </DropdownMenuItem>
          </DropdownMenuContent> */}
        </DropdownMenu>
      </div>
    </header>
  );
}


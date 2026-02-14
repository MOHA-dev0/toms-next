'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Search, Bell, Menu } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  onMenuClick?: () => void;
}

export function Header({ title, subtitle, onMenuClick }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { employee, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [time, setTime] = useState('');

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const getPageHeader = () => {
    if (pathname === '/dashboard') {
      return {
        title: 'لوحة التحكم',
        subtitle: `مرحباً ${employee?.nameAr || user?.email || 'المستخدم'} - ${time} (توقيت تركيا)`
      };
    }
    if (pathname === '/dashboard/cities') {
      return {
        title: 'المدن',
        subtitle: 'إدارة المدن والوجهات'
      };
    }
    if (pathname === '/dashboard/hotels') {
      return {
        title: 'الفنادق',
        subtitle: 'إدارة الفنادق والغرف'
      };
    }
    return {
      title: 'TOMS',
      subtitle: ''
    };
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
        {/* Global Search */}
        <form onSubmit={handleSearch} className="hidden md:block">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="بحث برقم المرجع..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pr-10 bg-muted/50 border-0 focus:bg-card"
            />
          </div>
        </form>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 left-1.5 w-2 h-2 bg-destructive rounded-full" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3 cursor-pointer">
              <span className="font-medium">عرض سعر جديد</span>
              <span className="text-xs text-muted-foreground">
                تم إنشاء عرض سعر جديد برقم M-25-00000001
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3 cursor-pointer">
              <span className="font-medium">تأكيد حجز</span>
              <span className="text-xs text-muted-foreground">
                تم تأكيد الحجز رقم B-25-00000005
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

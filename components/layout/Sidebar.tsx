'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { NAV_ITEMS, ROLE_NAMES } from '@/lib/constants';
import {
  LayoutDashboard,
  FileText,
  Calendar,
  Ticket,
  Users,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  Plane,
  Building,
  MapPin,
  Map,
  Layers,
  Building2,
  Briefcase,
  LineChart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  FileText,
  Calendar,
  Ticket,
  Users,
  CreditCard,
  BarChart3,
  Settings,
  MapPin,
  Building,
  Map,
  Layers,
  Building2,
  Briefcase,
  LineChart,
};

export function Sidebar() {
  const pathname = usePathname();
  const { employee, role, signOut } = useAuth();

  const navItems = role ? NAV_ITEMS[role] : [];

  return (
    <aside className="fixed right-0 top-0 h-screen w-64 bg-sidebar flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-gold flex items-center justify-center">
            <Plane className="w-6 h-6 text-sidebar rotate-45" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground">TOMS</h1>
            <p className="text-xs text-sidebar-foreground/60">نظام إدارة السياحة</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item, index) => {
            if (item.type === 'divider') {
              return (
                <li key={`divider-${index}`} className="px-4 py-2 mt-4 mb-2 text-xs font-bold text-sidebar-foreground/40">
                  {item.label}
                </li>
              );
            }

            const Icon = item.icon ? iconMap[item.icon] : null;
            const isActive = pathname === item.path;

            return (
              <li key={item.path}>
                <Link
                  href={item.path || '#'}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-primary'
                      : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                  )}
                >
                  {Icon && <Icon className="w-5 h-5" />}
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center">
            <span className="text-sm font-bold text-sidebar-primary">
              {employee?.initial || '?'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {(employee as any)?.name_ar || employee?.nameAr || 'مستخدم'}
            </p>
            <p className="text-xs text-sidebar-foreground/60">
              {role ? ROLE_NAMES[role] : ''}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          onClick={signOut}
          className="w-full justify-start gap-3 text-sidebar-foreground/80 hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="w-4 h-4" />
          <span>تسجيل الخروج</span>
        </Button>
      </div>
    </aside>
  );
}

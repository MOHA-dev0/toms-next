// Board Types
export const BOARD_TYPES = {
  ro: { ar: 'بدون وجبات', tr: 'Oda Kahvaltı Yok' },
  bb: { ar: 'إفطار فقط', tr: 'Oda Kahvaltı' },
  hb: { ar: 'نصف إقامة', tr: 'Yarım Pansiyon' },
  fb: { ar: 'إقامة كاملة', tr: 'Tam Pansiyon' },
  ai: { ar: 'شامل كلياً', tr: 'Her Şey Dahil' },
} as const;

// Room Usage Types
export const ROOM_USAGE_TYPES = {
  sgl: { ar: 'فردي', tr: 'Tek Kişilik' },
  dbl: { ar: 'مزدوج', tr: 'Çift Kişilik' },
  tpl: { ar: 'ثلاثي', tr: 'Üç Kişilik' },
  quad: { ar: 'رباعي', tr: 'Dört Kişilik' },
} as const;

// Quotation Status
export const QUOTATION_STATUS = {
  draft: { ar: 'مسودة', color: 'status-draft' },
  sent: { ar: 'مُرسل', color: 'status-sent' },
  confirmed: { ar: 'مؤكد', color: 'status-confirmed' },
  cancelled: { ar: 'ملغي', color: 'status-cancelled' },
} as const;

// Booking Status
export const BOOKING_STATUS = {
  pending: { ar: 'قيد الانتظار', color: 'status-pending' },
  confirmed: { ar: 'مؤكد', color: 'status-confirmed' },
  cancelled: { ar: 'ملغي', color: 'status-cancelled' },
  completed: { ar: 'مكتمل', color: 'status-completed' },
} as const;

// Source Types
export const SOURCE_TYPES = {
  b2b: { ar: 'شركات (B2B)' },
  b2c: { ar: 'أفراد (B2C)' },
} as const;

// Payment Methods
export const PAYMENT_METHODS = [
  'نقدي',
  'تحويل بنكي',
  'بطاقة ائتمان',
  'شيك',
  'أخرى',
] as const;

// Voucher Types
export const VOUCHER_TYPES = {
  hotel: { ar: 'فندقي', tr: 'Otel' },
  transportation: { ar: 'مواصلات', tr: 'Ulaşım' },
  other: { ar: 'أخرى', tr: 'Diğer' },
} as const;

// Role Names
export const ROLE_NAMES = {
  admin: 'مدير النظام',
  sales: 'موظف مبيعات',
  booking: 'موظف حجوزات',
} as const;

// Navigation Items per Role
export const NAV_ITEMS = {
  admin: [
    { type: 'link', path: '/dashboard', label: 'لوحة التحكم', icon: 'LayoutDashboard' },
    { type: 'link', path: '/dashboard/quotations', label: 'عروض الأسعار', icon: 'FileText' },
    { type: 'link', path: '/dashboard/bookings', label: 'الحجوزات والعمليات', icon: 'Calendar' },
    { type: 'link', path: '/reports', label: 'التقارير', icon: 'BarChart3' },
    { type: 'link', path: '/settings', label: 'الإعدادات', icon: 'Settings' },
    { type: 'divider', label: 'الإدارة' },
    { type: 'link', path: '/dashboard/cities', label: 'المدن', icon: 'MapPin' },
    { type: 'link', path: '/dashboard/hotels', label: 'الفنادق', icon: 'Building' },
    { type: 'link', path: '/dashboard/services', label: 'الخدمات', icon: 'Map' },
    { type: 'link', path: '/dashboard/other-services', label: 'الخدمات الأخرى', icon: 'Layers' },
    { type: 'link', path: '/dashboard/companies', label: 'الشركات', icon: 'Building2' },
    { type: 'link', path: '/dashboard/agents', label: 'الوكلاء', icon: 'Briefcase' },
    { type: 'link', path: '/dashboard/employees', label: 'الموظفين', icon: 'Users' },
    { type: 'link', path: '/financial-reports', label: 'التقارير المالية', icon: 'LineChart' },
  ],
  sales: [
    { type: 'link', path: '/dashboard', label: 'لوحة التحكم', icon: 'LayoutDashboard' },
    { type: 'link', path: '/dashboard/quotations', label: 'عروض الأسعار', icon: 'FileText' },
    { type: 'link', path: '/customers', label: 'العملاء', icon: 'Users' },
    { type: 'link', path: '/payments', label: 'المدفوعات', icon: 'CreditCard' },
  ],
  booking: [
    { type: 'link', path: '/dashboard', label: 'لوحة التحكم', icon: 'LayoutDashboard' },
    { type: 'link', path: '/dashboard/quotations', label: 'عروض الأسعار المؤكدة', icon: 'FileText' },
    { type: 'link', path: '/dashboard/bookings', label: 'الحجوزات والعمليات', icon: 'Calendar' },
    { type: 'link', path: '/dashboard/bookings', label: 'القسائم', icon: 'Ticket' },
  ],
} as const;

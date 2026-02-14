
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface DataCardProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  metadata?: React.ReactNode; // For location, dates, etc.
  footerLabel?: string;
  footerValue?: string | number;
  footerValueSub?: string; // e.g. currency
  className?: string;
}

export function DataCard({
  title,
  subtitle,
  icon: Icon,
  actions,
  metadata,
  footerLabel,
  footerValue,
  footerValueSub,
  className
}: DataCardProps) {
  return (
    <div 
      className={cn(
        "bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100 p-5 group relative overflow-hidden",
        className
      )}
      dir="rtl"
    >
      <div className="flex justify-between items-start mb-4">
        {/* Right Side: Icon & Title */}
        <div className="flex gap-3 items-start flex-1">
          {Icon && (
            <div className="bg-slate-100 p-2.5 rounded-xl text-slate-600 shrink-0">
              <Icon className="w-5 h-5" />
            </div>
          )}
          <div className="flex flex-col gap-1">
            <h3 className="font-bold text-gray-900 text-lg leading-tight">{title}</h3>
            {subtitle && (
              <span className="text-sm text-gray-400 font-medium" dir="ltr">
                {subtitle}
              </span>
            )}
          </div>
        </div>

        {/* Left Side: Actions */}
        {actions && (
          <div className="flex gap-1 shrink-0 mr-2">
            {actions}
          </div>
        )}
      </div>

      {/* Metadata Section */}
      {metadata && (
        <div className="mb-4 text-sm text-gray-500 space-y-1">
          {metadata}
        </div>
      )}

      {/* Footer / Price Section */}
      {(footerLabel || footerValue) && (
        <div className="pt-4 border-t border-gray-50 flex justify-between items-center text-sm mt-auto">
          <div className="text-gray-500 font-medium">{footerLabel}</div>
          <div className="font-bold text-gray-900 flex items-center gap-1" dir="ltr">
            {footerValue} 
            {footerValueSub && (
              <span className="text-xs text-gray-400 font-medium">{footerValueSub}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

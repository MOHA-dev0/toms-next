import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, FileEdit, CreditCard, CheckCircle, Eye } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export interface Quotation {
  id: string;
  referenceNumber: string;
  customerName: string;
  agentName: string;
  destination: string;
  paxCount: number;
  totalPrice: number;
  paidAmount: number;
  startDate: Date;
  createdAt: Date;
  status: string;
}

interface QuotationTableProps {
  quotations: Quotation[];
  onUpdateStatus: (id: string, newStatus: string) => void;
  onAddPayment: (quotation: Quotation) => void;
}

export function QuotationTable({ quotations, onUpdateStatus, onAddPayment }: QuotationTableProps) {

  const getStatusBadge = (status: string, quotation?: Quotation) => {
    if (quotation) {
      const isFullyPaid = quotation.totalPrice > 0 && quotation.paidAmount >= quotation.totalPrice;
      const isPartiallyPaid = quotation.totalPrice > 0 && quotation.paidAmount > 0 && quotation.paidAmount < quotation.totalPrice;
      
      if (isFullyPaid) {
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-green-50 text-green-600 border border-green-100">مدفوع بالكامل</span>;
      } else if (isPartiallyPaid || status === 'confirmed') {
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">مؤكد</span>;
      }
    }

    if (status === 'cancelled') {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-100">ملغي</span>;
    }

    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-50 text-orange-600 border border-orange-100">غير مؤكد</span>;
  };

  return (
    <div className="overflow-x-auto flex-1 p-0">
      <Table>
        <TableHeader className="bg-transparent sticky top-0 z-10">
          <TableRow className="hover:bg-transparent border-b-slate-100 bg-slate-50/80 backdrop-blur-sm">
            <TableHead className="text-right font-bold text-slate-500 py-3.5 px-6 w-32 whitespace-nowrap">رقم المرجع</TableHead>
            <TableHead className="text-right font-bold text-slate-500 py-3.5 px-6 whitespace-nowrap">العميل</TableHead>
            <TableHead className="text-right font-bold text-slate-500 py-3.5 px-6 whitespace-nowrap">الوكيل</TableHead>
            <TableHead className="text-right font-bold text-slate-500 py-3.5 px-6 whitespace-nowrap">الوجهة</TableHead>
            <TableHead className="text-center font-bold text-slate-500 py-3.5 px-6 whitespace-nowrap">تاريخ البداية</TableHead>
            <TableHead className="text-center font-bold text-slate-500 py-3.5 px-6 whitespace-nowrap">عدد الأشخاص</TableHead>
            <TableHead className="text-center font-bold text-slate-500 py-3.5 px-6 whitespace-nowrap">الإجمالي</TableHead>
            <TableHead className="text-center font-bold text-slate-500 py-3.5 px-6 whitespace-nowrap">المدفوع</TableHead>
            <TableHead className="text-center font-bold text-slate-500 py-3.5 px-6 whitespace-nowrap">المتبقي</TableHead>
            <TableHead className="text-center font-bold text-slate-500 py-3.5 px-6 w-32 whitespace-nowrap">الحالة</TableHead>
            <TableHead className="text-center font-bold text-slate-500 py-3.5 px-6 w-24">الإجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {quotations.map((quotation) => (
            <TableRow key={quotation.id} className="hover:bg-slate-50/50 border-b border-slate-50/80 transition-colors group">
              <TableCell className="font-bold text-slate-700 px-6 py-4">
                {quotation.referenceNumber}
              </TableCell>
              <TableCell className="font-bold text-slate-700 px-6 py-4">
                {quotation.customerName}
              </TableCell>
              <TableCell className="font-medium text-slate-400 px-6 py-4">
                {quotation.agentName || <span className="opacity-50">-</span>}
              </TableCell>
              <TableCell className="font-medium text-slate-500 px-6 py-4">
                {quotation.destination || <span className="opacity-50">-</span>}
              </TableCell>
              <TableCell className="text-center font-medium text-slate-500 px-6 py-4 whitespace-nowrap">
                {format(new Date(quotation.startDate), 'dd-MM-yyyy')}
              </TableCell>
              <TableCell className="text-center font-bold text-slate-500 px-6 py-4">
                {quotation.paxCount}
              </TableCell>
              <TableCell className="text-center px-6 py-4 whitespace-nowrap">
                <span className="font-black text-slate-800">
                  ${quotation.totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </TableCell>
              <TableCell className="text-center px-6 py-4 whitespace-nowrap">
                <span className="font-bold text-emerald-600">
                  ${(quotation.paidAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </TableCell>
              <TableCell className="text-center px-6 py-4 whitespace-nowrap">
                <span className="font-bold text-rose-600">
                  ${Math.max(0, quotation.totalPrice - (quotation.paidAmount || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </TableCell>
              <TableCell className="text-center px-6 py-4">
                {getStatusBadge(quotation.status, quotation)}
              </TableCell>
              <TableCell className="text-center px-6 py-4">
                <DropdownMenu dir="rtl">
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="h-9 w-9 p-0 hover:bg-slate-100 hover:text-slate-900 rounded-full transition-all flex items-center justify-center"
                    >
                      <span className="sr-only">فتح القائمة</span>
                      <MoreVertical className="h-5 w-5 text-slate-400 group-hover:text-slate-600" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 text-right bg-white rounded-xl shadow-lg border border-slate-100 p-2">
                    <Link href={`/dashboard/quotations/edit/${quotation.id}`} passHref>
                      <DropdownMenuItem 
                        className="focus:bg-slate-100 focus:text-slate-800 text-slate-700 cursor-pointer rounded-lg py-2.5 px-3 flex items-center justify-end gap-2 font-medium transition-colors"
                      >
                        <span className="flex-1 text-right">تعديل العرض</span>
                        <FileEdit className="h-4 w-4 ml-1 opacity-70" />
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuItem 
                      className="focus:bg-emerald-50 focus:text-emerald-700 text-slate-700 cursor-pointer rounded-lg py-2.5 px-3 flex items-center justify-end gap-2 font-medium transition-colors"
                      onClick={() => onAddPayment(quotation)}
                    >
                      <span className="flex-1 text-right">إضافة دفعة</span>
                      <CreditCard className="h-4 w-4 ml-1 opacity-70" />
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="focus:bg-blue-50 focus:text-blue-700 text-slate-700 cursor-pointer rounded-lg py-2.5 px-3 flex items-center justify-end gap-2 font-medium transition-colors"
                      onClick={() => onUpdateStatus(quotation.id, 'confirmed')}
                      disabled={quotation.status === 'confirmed'}
                    >
                      <span className="flex-1 text-right">تأكيد العرض</span>
                      <CheckCircle className="h-4 w-4 ml-1 opacity-70" />
                    </DropdownMenuItem>
                    <Link href={`/dashboard/quotations/${quotation.id}`} passHref>
                      <DropdownMenuItem 
                        className="focus:bg-slate-100 focus:text-slate-800 text-slate-700 cursor-pointer rounded-lg py-2.5 px-3 flex items-center justify-end gap-2 font-medium transition-colors"
                      >
                        <span className="flex-1 text-right">عرض و طباعة (View & Print)</span>
                        <Eye className="h-4 w-4 ml-1 opacity-70" />
                      </DropdownMenuItem>
                    </Link>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

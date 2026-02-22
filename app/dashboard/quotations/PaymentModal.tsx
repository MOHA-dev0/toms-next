import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface Quotation {
  id: string;
  referenceNumber: string;
  totalPrice: number;
  paidAmount: number;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotation: Quotation | null;
  onPaymentSuccess: () => void;
}

export default function PaymentModal({ isOpen, onClose, quotation, onPaymentSuccess }: PaymentModalProps) {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!quotation) return null;

  const remainingBalance = quotation.totalPrice - (quotation.paidAmount || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const paymentAmount = parseFloat(amount);
    
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      toast.error('أدخل مبلغ الدفع الصحيح');
      return;
    }

    if (paymentMethod === 'Bank Transfer' && (!referenceNumber || !receiverName)) {
      toast.error('يرجى إدخال الرقم المرجعي للتحويل واسم المستلم');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/quotations/${quotation.id}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: paymentAmount,
          paymentMethod,
          referenceNumber: paymentMethod === 'Bank Transfer' ? referenceNumber : undefined,
          receiverName: paymentMethod === 'Bank Transfer' ? receiverName : undefined,
        }),
      });

      if (!res.ok) {
        throw new Error('فشلت عملية الدفع');
      }

      toast.success('تمت إضافة الدفعة بنجاح');
      setAmount('');
      setPaymentMethod('Cash');
      setReferenceNumber('');
      setReceiverName('');
      onPaymentSuccess();
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('حدث خطأ أثناء إضافة الدفعة');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right">إضافة دفعة ({quotation.referenceNumber})</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-xl space-y-2 mb-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-semibold">المبلغ الإجمالي:</span>
              <span className="font-bold text-slate-800">${quotation.totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-semibold">المبلغ المدفوع:</span>
              <span className="font-bold text-emerald-600">${(quotation.paidAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
              <span className="text-slate-700 font-bold">المبلغ المتبقي:</span>
              <span className="font-black text-rose-600">${remainingBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-right block">المبلغ المراد دفعه ($)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="أدخل المبلغ"
                required
                className="text-left"
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMethod" className="text-right block">طريقة الدفع</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id="paymentMethod" className="text-right">
                  <SelectValue placeholder="اختر طريقة الدفع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">كاش</SelectItem>
                  <SelectItem value="Bank Transfer">تحويل بنكي</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {paymentMethod === 'Bank Transfer' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="referenceNumber" className="text-right block">رقم الحوالة المرجعي</Label>
                  <Input
                    id="referenceNumber"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    placeholder="رقم الحوالة"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="receiverName" className="text-right block">اسم المستلم</Label>
                  <Input
                    id="receiverName"
                    value={receiverName}
                    onChange={(e) => setReceiverName(e.target.value)}
                    placeholder="اسم المستلم"
                    required
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
              إلغاء
            </Button>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto bg-[#25396f] hover:bg-[#1a2850] text-white">
              {isSubmitting ? 'جاري الإضافة...' : 'حفظ الدفعة'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

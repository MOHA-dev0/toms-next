
'use client'

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Plane, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '@/lib/api-client';

const acceptSchema = z.object({
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "كلمات المرور غير متطابقة",
  path: ["confirmPassword"],
});

function AcceptInviteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { toast } = useToast();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('رابط الدعوة غير صالح أو مفقود');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setError(null);
    const result = acceptSchema.safeParse({ password, confirmPassword });
    
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/api/auth/accept-invite', {
        token,
        password,
      });
      setIsSuccess(true);
      toast({
        title: 'تم تفعيل الحساب بنجاح',
        description: 'يمكنك الآن تسجيل الدخول باستخدام كلمة المرور الجديدة',
      });
      setTimeout(() => {
        router.push('/auth');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تفعيل الحساب');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">تم التفعيل بنجاح!</h1>
        <p className="text-gray-500">جاري توجيهك إلى صفحة تسجيل الدخول...</p>
        <Button onClick={() => router.push('/auth')} className="w-full bg-blue-900">
          تسجيل الدخول الآن
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-primary mb-4 rotate-45">
          <Plane className="w-8 h-8 text-white -rotate-45" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">تفعيل حساب الموظف</h1>
        <p className="text-muted-foreground mt-2">يرجى تعيين كلمة مرور جديدة لتفعيل حسابك</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="password">كلمة المرور الجديدة</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-12 text-left"
              dir="ltr"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
          <Input
            id="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className="h-12 text-left"
            dir="ltr"
          />
        </div>

        <Button type="submit" className="w-full h-12 bg-blue-900 hover:bg-blue-800 rounded-xl" disabled={isLoading || !!error}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin ml-2" />
              جاري تفعيل الحساب...
            </>
          ) : 'تفعيل الحساب (Activate Account)'}
        </Button>
      </form>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-8">
      <Suspense fallback={<Loader2 className="w-8 h-8 animate-spin text-blue-600" />}>
        <AcceptInviteForm />
      </Suspense>
    </div>
  );
}


'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Plane, Eye, EyeOff, Loader2 } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
});

export default function Auth() {
  const router = useRouter();
  const { signIn } = useAuth();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      const result = loginSchema.safeParse({ email, password });
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        result.error.issues.forEach((issue) => {
          if (issue.path[0]) {
            fieldErrors[issue.path[0] as string] = issue.message;
          }
        });
        setErrors(fieldErrors);
        setIsLoading(false);
        return;
      }

      const { error } = await signIn(email, password);
      if (error) {
        toast({
          title: 'خطأ في تسجيل الدخول',
          description: error.message === 'Invalid login credentials' 
            ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
            : error.message,
          variant: 'destructive',
        });
      } else {
        router.push('/dashboard');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-blue-900/5 mb-6 text-blue-900 group">
              <Plane className="w-10 h-10 rotate-45 transform group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">تسجيل الدخول</h1>
            <p className="text-gray-500">أدخل بياناتك للدخول إلى نظام TOMS</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-gray-700">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className={`h-12 bg-gray-50/50 border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-900/20 ${errors.email ? 'border-destructive' : ''}`}
                dir="ltr"
              />
              {errors.email && (
                <p className="text-xs text-destructive mt-1">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password">{`كلمة المرور`}</Label>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`h-12 bg-gray-50/50 border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-900/20 pr-10 ${errors.password ? 'border-destructive' : ''}`}
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive mt-1">{errors.password}</p>
              )}
            </div>

            <Button type="submit" className="w-full h-12 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-bold shadow-lg shadow-blue-900/20 transition-all active:scale-95" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin ml-2" />
                  جاري تسجيل الدخول...
                </>
              ) : (
                'تسجيل الدخول'
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-400">
            لطلب صلاحية الوصول، يرجى التواصل مع مسؤول النظام
          </p>
        </div>
      </div>

      {/* Right side - Hero */}
      <div className="hidden lg:flex flex-1 bg-blue-900 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
        <div className="relative z-10 text-center text-white max-w-md">
          <h2 className="text-4xl font-extrabold mb-6">نظام TOMS للسياحة</h2>
          <p className="text-lg text-blue-100/80 mb-10 leading-relaxed font-medium">
            المنصة المتكاملة لإدارة عروض الأسعار والحجوزات والعمليات السياحية بكفاءة واحترافية عالية.
          </p>
          <div className="grid grid-cols-3 gap-6">
            <div className="p-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
              <div className="text-2xl font-bold mb-1">100%</div>
              <div className="text-[10px] text-blue-200 uppercase tracking-wider">نظام محمي</div>
            </div>
            <div className="p-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
              <div className="text-2xl font-bold mb-1">UI/UX</div>
              <div className="text-[10px] text-blue-200 uppercase tracking-wider">واجهة عصرية</div>
            </div>
            <div className="p-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
              <div className="text-2xl font-bold mb-1">Fast</div>
              <div className="text-[10px] text-blue-200 uppercase tracking-wider">سرعة فائقة</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

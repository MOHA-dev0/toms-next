
'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Loader2, Compass, MapPin } from 'lucide-react';

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
    <div className="min-h-screen flex bg-gray-50/50" dir="rtl">
      {/* Right side - Form (Actually right side in RTL layout) */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12 relative z-10">
        <div className="w-full max-w-md bg-white p-10 rounded-[2rem] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] border border-gray-100">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-blue-900 to-blue-700 mb-6 text-white shadow-xl shadow-blue-900/30">
              <Compass className="w-10 h-10 animate-[spin_4s_linear_infinite]" />
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-3 tracking-tight">مرحباً بك مجدداً</h1>
            <p className="text-gray-500 font-medium text-sm">أدخل بياناتك للدخول إلى نظام TOMS</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2 text-right">
              <Label htmlFor="email" className="text-sm font-bold text-gray-700 block mb-2">البريد الإلكتروني</Label>
              <div className="relative" dir="ltr">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className={`h-14 bg-gray-50 border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all text-left px-5 ${errors.email ? 'border-destructive focus:ring-destructive/20' : ''}`}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-destructive mt-1 font-medium">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2 text-right">
              <Label htmlFor="password" className="text-sm font-bold text-gray-700 block mb-2">كلمة المرور</Label>
              <div className="relative" dir="ltr">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`h-14 bg-gray-50 border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all text-left px-5 pr-14 ${errors.password ? 'border-destructive focus:ring-destructive/20' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors p-2 rounded-lg hover:bg-blue-50"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive mt-1 font-medium">{errors.password}</p>
              )}
            </div>

            <div className="pt-2">
                <Button 
                    type="submit" 
                    className="w-full h-14 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-bold text-base shadow-xl shadow-blue-900/20 transition-all hover:-translate-y-0.5" 
                    disabled={isLoading}
                >
                {isLoading ? (
                    <>
                    <Loader2 className="w-5 h-5 animate-spin ml-2" />
                    جاري تسجيل الدخول...
                    </>
                ) : (
                    'تسجيل الدخول'
                )}
                </Button>
            </div>
          </form>

          <p className="mt-8 text-center text-sm font-medium text-gray-400 border-t border-gray-50 pt-8">
            لطلب صلاحية الوصول، يرجى التواصل مع مسؤول النظام
          </p>
        </div>
      </div>

      {/* Left side - Hero (Actually left side in RTL layout) */}
      <div className="hidden lg:flex lg:w-1/2 bg-blue-900 items-center justify-center p-12 relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-800 to-blue-950 opacity-90 z-0"></div>
        <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-blue-600/20 blur-[120px] pointer-events-none z-0"></div>
        <div className="absolute -bottom-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-cyan-400/10 blur-[100px] pointer-events-none z-0"></div>
        
        <div className="relative z-10 text-center text-white max-w-lg w-full">
          <div className="mb-10 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-white/5 rounded-full blur-xl"></div>
            <MapPin className="w-20 h-20 mx-auto text-blue-200 drop-shadow-2xl relative z-10" />
          </div>
          <h2 className="text-4xl font-extrabold mb-6 leading-tight !leading-snug">نظام <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-cyan-200">TOMS</span> للسياحة</h2>
          <p className="text-lg text-blue-100/80 mb-12 leading-relaxed font-medium">
            المنصة المتكاملة لإدارة عروض الأسعار والحجوزات والعمليات السياحية بكفاءة واحترافية عالية.
          </p>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="p-5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
              <div className="text-2xl font-black mb-1 text-white">100%</div>
              <div className="text-[11px] text-blue-200 font-bold uppercase tracking-wider">نظام محمي</div>
            </div>
            <div className="p-5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
              <div className="text-2xl font-black mb-1 text-white">UI/UX</div>
              <div className="text-[11px] text-blue-200 font-bold uppercase tracking-wider">واجهة عصرية</div>
            </div>
            <div className="p-5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
              <div className="text-2xl font-black mb-1 text-white">Fast</div>
              <div className="text-[11px] text-blue-200 font-bold uppercase tracking-wider">سرعة فائقة</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

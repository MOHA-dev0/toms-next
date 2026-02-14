'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plane, Eye, EyeOff, Loader2 } from 'lucide-react';
import { ROLE_NAMES } from '@/lib/constants';

const loginSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
});

const signupSchema = loginSchema.extend({
  name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
  initial: z.string().length(1, 'الحرف الأول يجب أن يكون حرف واحد فقط'),
  role: z.enum(['admin', 'sales', 'booking']),
});

export default function Auth() {
  const router = useRouter();
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [initial, setInitial] = useState('');
  const [role, setRole] = useState<'admin' | 'sales' | 'booking'>('sales');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      if (isLogin) {
        const result = loginSchema.safeParse({ email, password });
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          const issues = result.error.issues;
          issues.forEach((issue: any) => {
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
      } else {
        const result = signupSchema.safeParse({ email, password, name, initial, role });
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          const issues = result.error.issues;
          issues.forEach((issue: any) => {
            if (issue.path[0]) {
              fieldErrors[issue.path[0] as string] = issue.message;
            }
          });
          setErrors(fieldErrors);
          setIsLoading(false);
          return;
        }

        const { error } = await signUp(email, password, name, initial.toUpperCase(), role);
        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              title: 'خطأ في التسجيل',
              description: 'هذا البريد الإلكتروني مسجل بالفعل',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'خطأ في التسجيل',
              description: error.message,
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: 'تم التسجيل بنجاح',
            description: 'يرجى التحقق من بريدك الإلكتروني لتأكيد الحساب',
          });
          setIsLogin(true);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-primary mb-4">
              <Plane className="w-8 h-8 text-white rotate-45" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              {isLogin ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
            </h1>
            <p className="text-muted-foreground mt-2">
              {isLogin
                ? 'أدخل بياناتك للدخول إلى النظام'
                : 'أنشئ حسابك للوصول إلى نظام إدارة السياحة'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">الاسم الكامل</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="أحمد محمد"
                    className={errors.name ? 'border-destructive' : ''}
                  />
                  {errors.name && (
                    <p className="text-xs text-destructive">{errors.name}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="initial">الحرف الأول (للمرجع)</Label>
                    <Input
                      id="initial"
                      value={initial}
                      onChange={(e) => setInitial(e.target.value.slice(0, 1).toUpperCase())}
                      placeholder="A"
                      maxLength={1}
                      className={errors.initial ? 'border-destructive' : ''}
                    />
                    {errors.initial && (
                      <p className="text-xs text-destructive">{errors.initial}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">الدور</Label>
                    <Select value={role} onValueChange={(v: any) => setRole(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">{ROLE_NAMES.admin}</SelectItem>
                        <SelectItem value="sales">{ROLE_NAMES.sales}</SelectItem>
                        <SelectItem value="booking">{ROLE_NAMES.booking}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@company.com"
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={errors.password ? 'border-destructive' : ''}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                  جاري التحميل...
                </>
              ) : isLogin ? (
                'تسجيل الدخول'
              ) : (
                'إنشاء الحساب'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setErrors({});
              }}
              className="text-sm text-primary hover:underline"
            >
              {isLogin ? 'ليس لديك حساب؟ سجل الآن' : 'لديك حساب بالفعل؟ سجل دخولك'}
            </button>
          </div>
        </div>
      </div>

      {/* Right side - Hero */}
      <div className="hidden lg:flex flex-1 bg-gradient-primary items-center justify-center p-12">
        <div className="text-center text-white max-w-md">
          <h2 className="text-4xl font-bold mb-4">نظام إدارة السياحة</h2>
          <p className="text-lg text-white/80 mb-8">
            منصة متكاملة لإدارة عروض الأسعار والحجوزات والقسائم بكل سهولة واحترافية
          </p>
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold">100%</div>
              <div className="text-sm text-white/70">عربي بالكامل</div>
            </div>
            <div>
              <div className="text-3xl font-bold">24/7</div>
              <div className="text-sm text-white/70">متاح دائماً</div>
            </div>
            <div>
              <div className="text-3xl font-bold">آمن</div>
              <div className="text-sm text-white/70">حماية البيانات</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

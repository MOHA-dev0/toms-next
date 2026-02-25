'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Save, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const validate = () => {
    let isValid = true;
    const newErrors = { currentPassword: '', newPassword: '', confirmPassword: '' };

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'يرجى إدخال كلمة المرور الحالية';
      isValid = false;
    }
    
    if (!formData.newPassword) {
      newErrors.newPassword = 'يرجى إدخال كلمة المرور الجديدة';
      isValid = false;
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'يجب أن تتكون التحديثة من 6 أحرف على الأقل';
      isValid = false;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'كلمات المرور غير متطابقة';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'حدث خطأ أثناء تغيير كلمة المرور');
      }

      toast.success('تم تغيير كلمة المرور بنجاح!');
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleVisibility = (field: keyof typeof showPassword) => {
    setShowPassword({ ...showPassword, [field]: !showPassword[field] });
  };

  return (
    <div className="p-8 space-y-6 animate-in fade-in-50 duration-500">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button 
          onClick={() => router.push('/dashboard')}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <ArrowRight className="w-5 h-5 text-muted-foreground" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-foreground">الإعدادات</h1>
          <p className="text-sm text-muted-foreground mt-1">
            إدارة إعدادات حسابك والأمان
          </p>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="p-6 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold">تغيير كلمة المرور</h2>
              <p className="text-sm text-muted-foreground">
                يرجى إدخال كلمة المرور الحالية لتحديث كلمة المرور
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid gap-6">
            {/* Current Password */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">كلمة المرور الحالية</label>
              <div className="relative max-w-md">
                <input
                  type={showPassword.current ? "text" : "password"}
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  dir="ltr"
                  className={'w-full text-left pl-4 pr-10 py-3 rounded-xl border ' + (errors.currentPassword ? 'border-red-500 focus:ring-red-500/20' : 'border-border focus:border-primary focus:ring-primary/20') + ' bg-background text-sm transition-all outline-none focus:ring-4'}
                  placeholder="••••••••"
                />
                <button 
                  type="button" 
                  onClick={() => toggleVisibility('current')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                >
                  {showPassword.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.currentPassword && (
                <p className="text-xs text-red-500 font-medium">{errors.currentPassword}</p>
              )}
            </div>

            {/* New Password */}
            <div className="space-y-2 flex flex-col">
              <label className="text-sm font-bold text-foreground">كلمة المرور الجديدة</label>
              <div className="relative max-w-md">
                <input
                  type={showPassword.new ? "text" : "password"}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  dir="ltr"
                  className={'w-full text-left pl-4 pr-10 py-3 rounded-xl border ' + (errors.newPassword ? 'border-red-500 focus:ring-red-500/20' : 'border-border focus:border-primary focus:ring-primary/20') + ' bg-background text-sm transition-all outline-none focus:ring-4'}
                  placeholder="••••••••"
                />
                <button 
                  type="button" 
                  onClick={() => toggleVisibility('new')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                >
                  {showPassword.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-xs text-red-500 font-medium max-w-md">{errors.newPassword}</p>
              )}
            </div>

            {/* Confirm New Password */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">تأكيد كلمة المرور الجديدة</label>
              <div className="relative max-w-md">
                <input
                  type={showPassword.confirm ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  dir="ltr"
                  className={'w-full text-left pl-4 pr-10 py-3 rounded-xl border ' + (errors.confirmPassword ? 'border-red-500 focus:ring-red-500/20' : 'border-border focus:border-primary focus:ring-primary/20') + ' bg-background text-sm transition-all outline-none focus:ring-4'}
                  placeholder="••••••••"
                />
                <button 
                  type="button" 
                  onClick={() => toggleVisibility('confirm')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                >
                  {showPassword.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-500 font-medium max-w-md">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          <div className="pt-6 mt-4 border-t border-border flex justify-start">
            <button
              type="submit"
              disabled={loading}
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              حفظ التغييرات
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

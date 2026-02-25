import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { getCurrentUserId } from '@/lib/auth';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'كلمة المرور الحالية مطلوبة'),
  newPassword: z.string().min(6, 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل'),
});

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = changePasswordSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: 'كلمة المرور الحالية غير صحيحة' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ message: 'تم تغيير كلمة المرور بنجاح' }, { status: 200 });
  } catch (error: any) {
    if (error && typeof error === 'object' && 'errors' in error) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Change password error:', error);
    return NextResponse.json({ error: 'فشل في تغيير كلمة المرور' }, { status: 500 });
  }
}

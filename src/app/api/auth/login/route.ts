import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'الرجاء إدخال اسم المستخدم وكلمة المرور' },
        { status: 400 }
      );
    }

    const db = getDatabase();

    // البحث عن المستخدم
    const user = db
      .prepare('SELECT * FROM users WHERE username = ?')
      .get(username) as { id: string; username: string; password: string; fullName?: string; role: string } | undefined;

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    // التحقق من كلمة المرور
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    // إرجاع بيانات المستخدم (بدون كلمة المرور)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      message: `مرحباً ${user.fullName || user.username}`,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء تسجيل الدخول' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { verifyPassword } from '@/lib/auth';
import { UserRole, AuthUser } from '@/types';

interface UserWithPassword {
  id: string;
  username: string;
  password: string;
  role: UserRole;
  fullName?: string;
  email?: string;
  isActive: number;
}

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({
        success: false,
        message: 'اسم المستخدم وكلمة المرور مطلوبان'
      }, { status: 400 });
    }

    const db = getDatabase();

    // البحث عن المستخدم
    const stmt = db.prepare(`
      SELECT id, username, password, role, fullName, email, isActive
      FROM users
      WHERE username = ? AND isActive = 1
    `);

    const user = stmt.get(username) as UserWithPassword | undefined;

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: 'اسم المستخدم غير موجود أو الحساب معطل' 
      }, { status: 401 });
    }

    // التحقق من كلمة المرور باستخدام bcrypt
    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json({ 
        success: false, 
        message: 'كلمة المرور غير صحيحة' 
      }, { status: 401 });
    }

    // تحديث آخر تسجيل دخول
    const updateStmt = db.prepare('UPDATE users SET lastLogin = CURRENT_TIMESTAMP WHERE id = ?');
    updateStmt.run(user.id);

    // إنشاء بيانات المستخدم للإرجاع (بدون كلمة المرور)
    const authUser: AuthUser = {
      id: user.id,
      username: user.username,
      role: user.role,
      fullName: user.fullName,
      email: user.email,
    };

    return NextResponse.json({ 
      success: true, 
      message: `مرحباً ${user.fullName || user.username}`,
      user: authUser 
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'حدث خطأ في الخادم' 
    }, { status: 500 });
  }
}

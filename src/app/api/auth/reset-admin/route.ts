import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { hashPassword } from '@/lib/auth';

/**
 * API لإعادة تعيين كلمة مرور المستخدمين
 * استخدم هذا فقط للطوارئ!
 */
export async function POST(request: NextRequest) {
  try {
    const db = getDatabase();
    const body = await request.json().catch(() => ({}));
    const username = body.username || 'admin';

    // البحث عن المستخدم
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as Record<string, unknown> | undefined;

    if (!user) {
      return NextResponse.json({
        success: false,
        message: `User ${username} not found`
      }, { status: 404 });
    }

    // تحديد كلمة المرور الافتراضية حسب المستخدم
    let newPassword = 'Moh@9801'; // default for admin
    if (username === 'usar') {
      newPassword = 'usar10';
    }

    const hashedPassword = await hashPassword(newPassword);

    const stmt = db.prepare('UPDATE users SET password = ?, updatedAt = ? WHERE username = ?');
    stmt.run(hashedPassword, new Date().toISOString(), username);

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully',
      credentials: {
        username: username,
        password: newPassword
      }
    });

  } catch (error: unknown) {
    console.error('Password reset error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to reset password: ' + (error instanceof Error ? error.message : String(error))
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'معرف المستخدم مطلوب' },
        { status: 400 }
      );
    }

    const db = getDatabase();

    // تحديث آخر تسجيل دخول
    db.prepare('UPDATE users SET lastLogin = CURRENT_TIMESTAMP WHERE id = ?').run(userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update login error:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء تحديث بيانات الدخول' },
      { status: 500 }
    );
  }
}

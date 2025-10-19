import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        message: 'معرف المستخدم مطلوب' 
      }, { status: 400 });
    }

    const db = getDatabase();
    
    // تحديث آخر تسجيل دخول
    const stmt = db.prepare('UPDATE users SET lastLogin = ? WHERE id = ?');
    stmt.run(new Date().toISOString(), userId);

    return NextResponse.json({ 
      success: true, 
      message: 'تم تحديث وقت تسجيل الدخول' 
    });

  } catch (error) {
    console.error('Update login error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'حدث خطأ في الخادم' 
    }, { status: 500 });
  }
}
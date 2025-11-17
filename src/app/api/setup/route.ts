import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const db = getDatabase();

    // Check if setup is needed (no users exist)
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };

    if (userCount.count === 0) {
      return NextResponse.json({ needsSetup: true });
    }

    return NextResponse.json({ needsSetup: false });
  } catch (error) {
    console.error('Setup check error:', error);
    return NextResponse.json({ needsSetup: true });
  }
}

export async function POST() {
  try {
    const db = getDatabase();

    // Check if users already exist
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };

    if (userCount.count > 0) {
      return NextResponse.json({
        success: false,
        message: 'النظام تم إعداده مسبقاً',
      });
    }

    // Create default super admin user
    const hashedPassword = await bcrypt.hash('Moh@9801', 10);

    db.prepare(`
      INSERT INTO users (id, username, password, fullName, role)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      'admin-' + Date.now(),
      'super',
      hashedPassword,
      'المدير العام',
      'admin'
    );

    console.log('✅ Default admin user created successfully');

    return NextResponse.json({
      success: true,
      message: 'تم إنشاء المستخدم الافتراضي بنجاح',
    });
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'حدث خطأ أثناء الإعداد',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

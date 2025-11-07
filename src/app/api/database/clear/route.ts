import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';

export async function POST() {
  try {
    const db = getDatabase();

    // Clear all tables in the correct order (respecting foreign key constraints)
    db.exec('DELETE FROM returns');
    db.exec('DELETE FROM sales');
    db.exec('DELETE FROM products');
    db.exec('DELETE FROM subcategories');
    db.exec('DELETE FROM categories');
    // Keep users table for login purposes
    // If you want to clear users too, uncomment the line below
    // db.exec('DELETE FROM users WHERE username != "admin"'); // Keep admin user

    console.log('✅ Database cleared successfully');

    return NextResponse.json({
      success: true,
      message: 'تم إفراغ قاعدة البيانات بنجاح',
    });
  } catch (error) {
    console.error('Error clearing database:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'فشل إفراغ قاعدة البيانات',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

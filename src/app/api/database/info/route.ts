import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { getDatabasePath } from '@/config/database';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const dbPath = getDatabasePath();

    // Check if database file exists
    const exists = fs.existsSync(dbPath);

    // Get file size if it exists
    let size = 0;
    if (exists) {
      const stats = fs.statSync(dbPath);
      size = stats.size;
    }

    // Get database statistics
    const db = getDatabase();

    const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
    const categoryCount = db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number };
    const salesCount = db.prepare('SELECT COUNT(*) as count FROM sales').get() as { count: number };
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };

    return NextResponse.json({
      success: true,
      database: {
        path: dbPath,
        size,
        exists,
        stats: {
          products: productCount.count,
          categories: categoryCount.count,
          sales: salesCount.count,
          users: userCount.count,
        }
      }
    });
  } catch (error) {
    console.error('Database info error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'فشل في جلب معلومات قاعدة البيانات',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

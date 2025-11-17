import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';

export async function POST() {
  try {
    const db = getDatabase();

    // Temporarily disable foreign key constraints to handle circular dependencies
    db.exec('PRAGMA foreign_keys = OFF');

    // Clear all tables in the correct order
    // Note: We disable foreign keys temporarily to handle circular dependencies between sales and debts
    db.exec('DELETE FROM returns');
    db.exec('DELETE FROM debt_payments');
    db.exec('DELETE FROM debts');
    db.exec('DELETE FROM sales');
    db.exec('DELETE FROM products');
    db.exec('DELETE FROM subcategories');
    db.exec('DELETE FROM categories');
    db.exec('DELETE FROM debt_customers');
    // Keep users table for login purposes
    // If you want to clear users too, uncomment the line below
    // db.exec('DELETE FROM users WHERE username != "super"'); // Keep super admin user

    // Re-enable foreign key constraints
    db.exec('PRAGMA foreign_keys = ON');

    console.log('✅ Database cleared successfully');

    return NextResponse.json({
      success: true,
      message: 'تم إفراغ قاعدة البيانات بنجاح',
    });
  } catch (error) {
    console.error('Error clearing database:', error);

    // Make sure to re-enable foreign keys even if there's an error
    try {
      const db = getDatabase();
      db.exec('PRAGMA foreign_keys = ON');
    } catch (pragmaError) {
      console.error('Failed to re-enable foreign keys:', pragmaError);
    }

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

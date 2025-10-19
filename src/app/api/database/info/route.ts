import { NextResponse } from 'next/server';
import { getDatabaseInfo, createBackup } from '@/lib/database';
import { getPathInfo } from '@/config/database';

export async function GET() {
  try {
    const dbInfo = getDatabaseInfo();
    const pathInfo = getPathInfo();
    
    return NextResponse.json({
      database: dbInfo,
      paths: pathInfo,
    });
  } catch (error) {
    console.error('Error getting database info:', error);
    return NextResponse.json({ error: 'Failed to get database info' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const backupPath = createBackup();
    return NextResponse.json({ 
      success: true, 
      backupPath,
      message: 'تم إنشاء نسخة احتياطية بنجاح' 
    });
  } catch (error) {
    console.error('Error creating backup:', error);
    return NextResponse.json({ error: 'Failed to create backup' }, { status: 500 });
  }
}

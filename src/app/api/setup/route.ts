import { NextResponse } from 'next/server';
import { ensureDatabaseSetup } from '@/lib/database';
import { createDefaultAdminIfNeeded } from '@/lib/queries/users';

/**
 * API للتهيئة التلقائية للنظام
 * يتم استدعاؤها عند بدء التطبيق لأول مرة
 *
 * المهام:
 * 1. التأكد من إنشاء المجلدات (D:\MyWarehouseData)
 * 2. التأكد من إنشاء قاعدة البيانات والجداول
 * 3. إنشاء حساب المدير الافتراضي إذا لم يكن موجوداً
 */
export async function POST() {
  try {
    console.log('🚀 بدء عملية التهيئة التلقائية...');

    // 1. التأكد من إنشاء قاعدة البيانات والمجلدات
    ensureDatabaseSetup();

    // 2. إنشاء حساب المدير الافتراضي إذا لزم الأمر
    const adminCreated = await createDefaultAdminIfNeeded();

    let message = 'تم التحقق من إعدادات النظام بنجاح';

    if (adminCreated) {
      message = 'تم تهيئة النظام بنجاح! تم إنشاء حساب المدير الافتراضي';
    }

    console.log('✅ اكتملت عملية التهيئة التلقائية');

    return NextResponse.json({
      success: true,
      adminCreated,
      message,
      credentials: adminCreated ? {
        username: 'super',
        password: 'Moh@9801',
      } : undefined,
    });
  } catch (error: unknown) {
    console.error('❌ فشلت عملية التهيئة التلقائية:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'فشل في تهيئة النظام: ' + (error instanceof Error ? error.message : String(error)),
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * GET: الحصول على حالة النظام
 */
export async function GET() {
  try {
    // يمكن إضافة منطق للتحقق من حالة النظام هنا
    return NextResponse.json({
      success: true,
      message: 'النظام جاهز',
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        message: 'خطأ في النظام',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

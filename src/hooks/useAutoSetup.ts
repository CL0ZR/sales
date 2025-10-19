import { useEffect, useState } from 'react';

interface SetupResult {
  success: boolean;
  adminCreated?: boolean;
  credentials?: {
    username: string;
    password: string;
  };
  message?: string;
}

/**
 * Hook للتهيئة التلقائية للنظام عند بدء التطبيق
 *
 * يقوم بـ:
 * 1. استدعاء API للتحقق من إعدادات قاعدة البيانات
 * 2. إنشاء المجلدات تلقائياً
 * 3. إنشاء حساب المدير الافتراضي إذا لزم الأمر
 */
export function useAutoSetup() {
  const [setupComplete, setSetupComplete] = useState(false);
  const [setupResult, setSetupResult] = useState<SetupResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🔄 Starting auto-setup...');

        const response = await fetch('/api/setup', {
          method: 'POST',
        });

        const result: SetupResult = await response.json();

        if (result.success) {
          console.log('✅ Auto-setup completed successfully');
          setSetupResult(result);
          setSetupComplete(true);

          // إذا تم إنشاء حساب المدير، حفظ العلامة في localStorage
          if (result.adminCreated) {
            localStorage.setItem('first_time_setup', 'true');
            localStorage.setItem('admin_credentials_shown', 'false');
          }
        } else {
          console.error('❌ Auto-setup failed:', result.message);
          setError(result.message || 'فشل في تهيئة النظام');
        }
      } catch (err: unknown) {
        console.error('❌ Auto-setup error:', err);
        setError('حدث خطأ أثناء تهيئة النظام: ' + (err instanceof Error ? err.message : String(err)));
      }
    };

    initializeApp();
  }, []); // يعمل مرة واحدة فقط عند تحميل التطبيق

  return {
    setupComplete,
    setupResult,
    error,
  };
}

/**
 * التحقق مما إذا كان هذا أول تشغيل للتطبيق
 */
export function isFirstTimeSetup(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('first_time_setup') === 'true';
}

/**
 * التحقق مما إذا كانت بيانات الدخول قد تم عرضها للمستخدم
 */
export function areCredentialsShown(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem('admin_credentials_shown') === 'true';
}

/**
 * تحديد أن بيانات الدخول قد تم عرضها
 */
export function markCredentialsAsShown(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('admin_credentials_shown', 'true');
}

/**
 * إعادة تعيين حالة الإعداد الأولي (للاختبار فقط)
 */
export function resetFirstTimeSetup(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('first_time_setup');
  localStorage.removeItem('admin_credentials_shown');
}

import { useState, useEffect } from 'react';

/**
 * Hook للتأخير في تنفيذ البحث (Debouncing)
 * يمنع إجراء البحث عند كل ضغطة مفتاح ويؤخر التنفيذ حتى يتوقف المستخدم عن الكتابة
 *
 * @param value - القيمة المراد تأخير تحديثها
 * @param delay - مدة التأخير بالميلي ثانية (الافتراضي: 300ms)
 * @returns القيمة المؤخرة
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // إنشاء مؤقت لتحديث القيمة بعد انتهاء فترة التأخير
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // إلغاء المؤقت السابق عند تغيير القيمة
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

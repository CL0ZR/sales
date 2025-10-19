import bcrypt from 'bcryptjs';

/**
 * تشفير كلمة المرور باستخدام bcrypt
 * @param password - كلمة المرور الأصلية
 * @returns كلمة المرور المشفرة
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * التحقق من كلمة المرور
 * @param password - كلمة المرور المدخلة
 * @param hashedPassword - كلمة المرور المشفرة المحفوظة
 * @returns true إذا كانت كلمة المرور صحيحة
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

/**
 * التحقق من قوة كلمة المرور
 * @param password - كلمة المرور المراد التحقق منها
 * @returns كائن يحتوي على صحة كلمة المرور ورسالة الخطأ
 */
export function validatePassword(password: string): {
  valid: boolean;
  message?: string;
} {
  if (!password || password.length < 6) {
    return {
      valid: false,
      message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
    };
  }

  // يمكن إضافة شروط إضافية هنا حسب الحاجة
  // مثل: وجود أرقام، أحرف كبيرة، رموز خاصة، إلخ

  return { valid: true };
}

/**
 * إنشاء رمز عشوائي للجلسة أو التوكن
 * @param length - طول الرمز (افتراضي: 32)
 * @returns رمز عشوائي
 */
export function generateToken(length: number = 32): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

import { getDatabase } from '@/lib/database';
import { hashPassword } from '@/lib/auth';

export interface User {
  id: string;
  username: string;
  password: string; // مشفّر
  role: 'admin' | 'user';
  fullName?: string;
  email?: string;
  phone?: string;
  isActive: number; // 0 or 1 (SQLite boolean)
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

/**
 * الحصول على جميع المستخدمين
 */
export function getAllUsers(): User[] {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM users WHERE isActive = 1 ORDER BY createdAt DESC');
  return stmt.all() as User[];
}

/**
 * الحصول على مستخدم بواسطة الـ ID
 */
export function getUserById(id: string): User | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  return (stmt.get(id) as User) || null;
}

/**
 * الحصول على مستخدم بواسطة اسم المستخدم
 */
export function getUserByUsername(username: string): User | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
  return (stmt.get(username) as User) || null;
}

/**
 * إنشاء مستخدم جديد
 */
export async function createUser(userData: {
  username: string;
  password: string; // سيتم تشفيرها
  role?: 'admin' | 'user';
  fullName?: string;
  email?: string;
  phone?: string;
}): Promise<User> {
  const db = getDatabase();

  const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
  const hashedPassword = await hashPassword(userData.password);
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO users (
      id, username, password, role, fullName, email, phone,
      isActive, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    userData.username,
    hashedPassword,
    userData.role || 'user',
    userData.fullName || null,
    userData.email || null,
    userData.phone || null,
    1, // isActive
    now,
    now
  );

  return getUserById(id)!;
}

/**
 * تحديث آخر تسجيل دخول
 */
export function updateLastLogin(userId: string): void {
  const db = getDatabase();
  const stmt = db.prepare('UPDATE users SET lastLogin = ? WHERE id = ?');
  stmt.run(new Date().toISOString(), userId);
}

/**
 * تغيير كلمة المرور
 */
export async function changePassword(userId: string, newPassword: string): Promise<boolean> {
  try {
    const db = getDatabase();
    const hashedPassword = await hashPassword(newPassword);
    const stmt = db.prepare('UPDATE users SET password = ?, updatedAt = ? WHERE id = ?');
    stmt.run(hashedPassword, new Date().toISOString(), userId);
    return true;
  } catch (error) {
    console.error('❌ Error changing password:', error);
    return false;
  }
}

/**
 * حذف مستخدم (soft delete)
 */
export function deleteUser(userId: string): boolean {
  try {
    const db = getDatabase();
    const stmt = db.prepare('UPDATE users SET isActive = 0, updatedAt = ? WHERE id = ?');
    stmt.run(new Date().toISOString(), userId);
    return true;
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    return false;
  }
}

/**
 * إنشاء حساب المدير الافتراضي إذا لم يكن موجوداً
 * @returns true إذا تم إنشاء حساب جديد، false إذا كان موجود مسبقاً
 */
export async function createDefaultAdminIfNeeded(): Promise<boolean> {
  try {
    const db = getDatabase();

    // التحقق من وجود أي مستخدمين
    const usersCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };

    if (usersCount.count === 0) {
      console.log('👤 No users found. Creating default admin account...');

      // إنشاء حساب المدير الافتراضي
      // Username: super
      // Password: Moh@9801
      await createUser({
        username: 'super',
        password: 'Moh@9801',
        role: 'admin',
        fullName: 'مدير النظام',
        email: 'admin@warehouse.local',
      });

      console.log('✅ Default admin account created successfully');
      console.log('📌 Username: super');
      console.log('📌 Password: Moh@9801');

      return true; // تم إنشاء حساب جديد
    }

    console.log(`ℹ️ Users already exist (${usersCount.count}). Skipping default admin creation.`);
    return false; // لم يتم إنشاء حساب (موجود مسبقاً)
  } catch (error) {
    console.error('❌ Error creating default admin:', error);
    throw error;
  }
}

/**
 * التحقق من بيانات تسجيل الدخول
 */
export function validateCredentials(username: string, password: string): User | null {
  // ملاحظة: التحقق من كلمة المرور يتم في AuthContext باستخدام verifyPassword
  // هذه الدالة فقط تُرجع المستخدم إذا كان موجوداً ونشطاً
  const user = getUserByUsername(username);

  if (!user || user.isActive !== 1) {
    return null;
  }

  return user;
}

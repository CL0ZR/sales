import path from 'path';
import os from 'os';

// 📁 تحديد مسار تخزين البيانات
// يمكنك تغيير هذا المسار حسب رغبتك

export const DATABASE_CONFIG = {
  // المسار الافتراضي - يمكنك تغييره
  basePath: 'D:\\MyWarehouseData', // أو أي مسار تريده مثل: 'D:\\MyWarehouseData'
  
  // اسم ملف قاعدة البيانات
  dbFileName: 'warehouse.db',
  
  // مجلد النسخ الاحتياطية
  backupFolder: 'backups',
  
  // مجلد التصدير
  exportFolder: 'exports',
  
  // إعدادات النسخ الاحتياطي
  autoBackup: true,
  backupInterval: 24 * 60 * 60 * 1000, // 24 ساعة بالميلي ثانية
};

// دالة للحصول على المسار الكامل لقاعدة البيانات
export function getDatabasePath(): string {
  return path.join(DATABASE_CONFIG.basePath, DATABASE_CONFIG.dbFileName);
}

// دالة للحصول على مسار مجلد النسخ الاحتياطية
export function getBackupPath(): string {
  return path.join(DATABASE_CONFIG.basePath, DATABASE_CONFIG.backupFolder);
}

// دالة للحصول على مسار مجلد التصدير
export function getExportPath(): string {
  return path.join(DATABASE_CONFIG.basePath, DATABASE_CONFIG.exportFolder);
}

// دالة لإنشاء اسم ملف النسخة الاحتياطية
export function getBackupFileName(): string {
  const date = new Date().toISOString().split('T')[0];
  return `warehouse-backup-${date}.db`;
}

// معلومات المسارات للعرض في الواجهة
export function getPathInfo() {
  return {
    databasePath: getDatabasePath(),
    backupPath: getBackupPath(),
    exportPath: getExportPath(),
    basePath: DATABASE_CONFIG.basePath,
  };
}

/* 
🔧 تعليمات تغيير مسار التخزين:

1. غير قيمة basePath في DATABASE_CONFIG أعلاه
2. مثال للمسارات:
   - Windows: 'C:\\MyWarehouseData'
   - أو: 'D:\\Business\\WarehouseSystem'
   - أو: path.join(os.homedir(), 'Documents', 'WarehouseData')

3. المجلدات ستنشأ تلقائياً إذا لم تكن موجودة

4. مثال للمسار النهائي:
   C:\MyWarehouseData\
   ├── warehouse.db
   ├── backups\
   ├── exports\
   └── config.json
*/

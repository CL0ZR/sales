import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { getDatabasePath, getBackupPath, getExportPath, getBackupFileName } from '@/config/database';
import { Product, Category, Sale } from '@/types';

let db: Database.Database | null = null;

// إنشاء المجلدات المطلوبة
function ensureDirectoriesExist() {
  const dbPath = getDatabasePath();
  const backupPath = getBackupPath();
  const exportPath = getExportPath();

  // إنشاء المجلد الرئيسي
  const baseDir = path.dirname(dbPath);
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
    console.log(`✅ Created base directory: ${baseDir}`);
  }

  // إنشاء مجلد النسخ الاحتياطية
  if (!fs.existsSync(backupPath)) {
    fs.mkdirSync(backupPath, { recursive: true });
    console.log(`✅ Created backup directory: ${backupPath}`);
  }

  // إنشاء مجلد التصدير
  if (!fs.existsSync(exportPath)) {
    fs.mkdirSync(exportPath, { recursive: true });
    console.log(`✅ Created export directory: ${exportPath}`);
  }
}

/**
 * التأكد من تهيئة قاعدة البيانات بشكل كامل
 * يتم استدعاؤها من API عند بدء التطبيق
 */
export function ensureDatabaseSetup(): boolean {
  try {
    console.log('🔄 Starting database setup...');

    // 1. التأكد من وجود المجلدات
    ensureDirectoriesExist();

    // 2. التأكد من وجود قاعدة البيانات والجداول
    const database = getDatabase();

    // 3. التحقق من أن كل شيء يعمل
    const usersCount = database.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    console.log(`✅ Database setup complete. Users count: ${usersCount.count}`);

    return true;
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  }
}

// إنشاء الجداول
function createTables(database: Database.Database) {
  // جدول المستخدمين
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT CHECK(role IN ('admin', 'user')) DEFAULT 'user',
      fullName TEXT,
      email TEXT,
      phone TEXT,
      isActive INTEGER DEFAULT 1,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      lastLogin TEXT
    )
  `);

  // جدول الفئات
  database.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // جدول الفئات الفرعية
  database.exec(`
    CREATE TABLE IF NOT EXISTS subcategories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      categoryId TEXT NOT NULL,
      FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE CASCADE
    )
  `);

  // جدول المنتجات
  database.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      subcategory TEXT,
      wholesalePrice REAL NOT NULL,
      salePrice REAL NOT NULL,
      discount REAL DEFAULT 0,
      measurementType TEXT DEFAULT 'quantity' CHECK(measurementType IN ('quantity', 'weight')),
      quantity INTEGER NOT NULL DEFAULT 0,
      minQuantity INTEGER DEFAULT 5,
      weightUnit TEXT CHECK(weightUnit IN ('kg', 'g', NULL)),
      weight REAL,
      minWeight REAL,
      barcode TEXT,
      currency TEXT DEFAULT 'IQD',
      imageUrl TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // جدول المبيعات
  database.exec(`
    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,
      productId TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      weight REAL,
      weightUnit TEXT CHECK(weightUnit IN ('kg', 'g', NULL)),
      unitPrice REAL NOT NULL,
      totalPrice REAL NOT NULL,
      discount REAL DEFAULT 0,
      finalPrice REAL NOT NULL,
      customerName TEXT,
      customerPhone TEXT,
      paymentMethod TEXT CHECK(paymentMethod IN ('cash', 'card', 'transfer')),
      saleDate DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (productId) REFERENCES products(id)
    )
  `);

  // إنشاء فهارس للأداء
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
    CREATE INDEX IF NOT EXISTS idx_products_quantity ON products(quantity);
    CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(saleDate);
    CREATE INDEX IF NOT EXISTS idx_sales_product ON sales(productId);
  `);
}

// الحصول على اتصال قاعدة البيانات
export function getDatabase(): Database.Database {
  if (!db) {
    try {
      ensureDirectoriesExist();
      const dbPath = getDatabasePath();
      
      console.log(`📁 Database path: ${dbPath}`);
      
      db = new Database(dbPath);
      db.pragma('journal_mode = WAL'); // تحسين الأداء
      db.pragma('foreign_keys = ON'); // تفعيل القيود الخارجية
      
      createTables(db);
      
      console.log('✅ Database initialized successfully');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }
  
  return db;
}

// إغلاق قاعدة البيانات
export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

// إنشاء نسخة احتياطية
export function createBackup(): string {
  const database = getDatabase();
  const backupPath = getBackupPath();
  const backupFileName = getBackupFileName();
  const backupFilePath = path.join(backupPath, backupFileName);
  
  try {
    // نسخ ملف قاعدة البيانات
    database.backup(backupFilePath);
    console.log(`✅ Backup created: ${backupFilePath}`);
    return backupFilePath;
  } catch (error) {
    console.error('❌ Backup failed:', error);
    throw error;
  }
}

// استعادة من نسخة احتياطية
export function restoreFromBackup(backupFilePath: string): boolean {
  try {
    const dbPath = getDatabasePath();
    
    // إغلاق الاتصال الحالي
    closeDatabase();
    
    // نسخ ملف النسخة الاحتياطية
    fs.copyFileSync(backupFilePath, dbPath);
    
    // إعادة فتح قاعدة البيانات
    getDatabase();
    
    console.log(`✅ Database restored from: ${backupFilePath}`);
    return true;
  } catch (error) {
    console.error('❌ Restore failed:', error);
    return false;
  }
}

// تصدير البيانات
export function exportData(format: 'json' | 'csv' = 'json') {
  const database = getDatabase();
  const exportPath = getExportPath();
  const timestamp = new Date().toISOString().split('T')[0];
  
  try {
    // تصدير المنتجات
    const products = database.prepare('SELECT * FROM products').all();
    const categories = database.prepare('SELECT * FROM categories').all();
    const sales = database.prepare(`
      SELECT s.*, p.name as productName, p.category 
      FROM sales s 
      LEFT JOIN products p ON s.productId = p.id
    `).all();
    
    if (format === 'json') {
      const exportData = {
        products,
        categories,
        sales,
        exportDate: new Date().toISOString(),
      };
      
      const exportFile = path.join(exportPath, `warehouse-export-${timestamp}.json`);
      fs.writeFileSync(exportFile, JSON.stringify(exportData, null, 2), 'utf8');
      console.log(`✅ Data exported to: ${exportFile}`);
      return exportFile;
    }
    
    // يمكن إضافة تصدير CSV هنا لاحقاً
    
  } catch (error) {
    console.error('❌ Export failed:', error);
    throw error;
  }
}

// الحصول على معلومات قاعدة البيانات
export function getDatabaseInfo() {
  const database = getDatabase();
  
  try {
    const productsCount = database.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
    const categoriesCount = database.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number };
    const salesCount = database.prepare('SELECT COUNT(*) as count FROM sales').get() as { count: number };
    
    const dbPath = getDatabasePath();
    const stats = fs.statSync(dbPath);
    
    return {
      path: dbPath,
      size: stats.size,
      lastModified: stats.mtime,
      tables: {
        products: productsCount.count,
        categories: categoriesCount.count,
        sales: salesCount.count,
      },
    };
  } catch (error) {
    console.error('❌ Failed to get database info:', error);
    return null;
  }
}

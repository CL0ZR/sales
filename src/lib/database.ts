import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { getDatabasePath, getBackupPath, getExportPath, getBackupFileName } from '@/config/database';
import { Product, Category, Sale, Return } from '@/types';

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
      role TEXT CHECK(role IN ('admin', 'assistant-admin', 'user')) DEFAULT 'user',
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
      category TEXT,
      subcategory TEXT,
      wholesalePrice REAL NOT NULL,
      wholesaleCostPrice REAL DEFAULT 0,
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
      saleType TEXT DEFAULT 'retail' CHECK(saleType IN ('retail', 'wholesale')),
      quantity INTEGER NOT NULL DEFAULT 0,
      weight REAL,
      weightUnit TEXT CHECK(weightUnit IN ('kg', 'g', NULL)),
      unitPrice REAL NOT NULL,
      totalPrice REAL NOT NULL,
      discount REAL DEFAULT 0,
      finalPrice REAL NOT NULL,
      customerName TEXT,
      paymentMethod TEXT CHECK(paymentMethod IN ('cash', 'debt')),
      debtCustomerId TEXT,
      debtId TEXT,
      saleDate DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (productId) REFERENCES products(id),
      FOREIGN KEY (debtCustomerId) REFERENCES debt_customers(id),
      FOREIGN KEY (debtId) REFERENCES debts(id)
    )
  `);

  // Returns table
  database.exec(`
    CREATE TABLE IF NOT EXISTS returns (
      id TEXT PRIMARY KEY,
      saleId TEXT NOT NULL,
      productId TEXT NOT NULL,
      returnedQuantity INTEGER DEFAULT 0,
      returnedWeight REAL,
      weightUnit TEXT CHECK(weightUnit IN ('kg', 'g', NULL)),
      unitPrice REAL NOT NULL,
      totalRefund REAL NOT NULL,
      reason TEXT,
      returnDate DATETIME DEFAULT CURRENT_TIMESTAMP,
      processedBy TEXT,
      FOREIGN KEY (saleId) REFERENCES sales(id),
      FOREIGN KEY (productId) REFERENCES products(id)
    )
  `);

  // Debt Customers table
  database.exec(`
    CREATE TABLE IF NOT EXISTS debt_customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Debts table
  database.exec(`
    CREATE TABLE IF NOT EXISTS debts (
      id TEXT PRIMARY KEY,
      saleId TEXT NOT NULL,
      customerId TEXT NOT NULL,
      totalAmount REAL NOT NULL,
      amountPaid REAL DEFAULT 0,
      amountRemaining REAL NOT NULL,
      status TEXT CHECK(status IN ('unpaid', 'partial', 'paid')) DEFAULT 'unpaid',
      dueDate DATETIME,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (saleId) REFERENCES sales(id),
      FOREIGN KEY (customerId) REFERENCES debt_customers(id)
    )
  `);

  // Debt Payments table
  database.exec(`
    CREATE TABLE IF NOT EXISTS debt_payments (
      id TEXT PRIMARY KEY,
      debtId TEXT NOT NULL,
      amount REAL NOT NULL,
      paymentDate DATETIME DEFAULT CURRENT_TIMESTAMP,
      paymentMethod TEXT CHECK(paymentMethod IN ('cash', 'card', 'transfer')),
      notes TEXT,
      createdBy TEXT,
      FOREIGN KEY (debtId) REFERENCES debts(id) ON DELETE CASCADE
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
    CREATE INDEX IF NOT EXISTS idx_sales_type ON sales(saleType);
    CREATE INDEX IF NOT EXISTS idx_sales_payment_method ON sales(paymentMethod);
    CREATE INDEX IF NOT EXISTS idx_returns_date ON returns(returnDate);
    CREATE INDEX IF NOT EXISTS idx_returns_product ON returns(productId);
    CREATE INDEX IF NOT EXISTS idx_returns_sale ON returns(saleId);
    CREATE INDEX IF NOT EXISTS idx_debt_customers_name ON debt_customers(name);
    CREATE INDEX IF NOT EXISTS idx_debt_customers_phone ON debt_customers(phone);
    CREATE INDEX IF NOT EXISTS idx_debts_customer ON debts(customerId);
    CREATE INDEX IF NOT EXISTS idx_debts_sale ON debts(saleId);
    CREATE INDEX IF NOT EXISTS idx_debts_status ON debts(status);
    CREATE INDEX IF NOT EXISTS idx_debt_payments_debt ON debt_payments(debtId);
    CREATE INDEX IF NOT EXISTS idx_debt_payments_date ON debt_payments(paymentDate);
  `);
}

// Migration: Convert wholesaleProfit to wholesaleCostPrice
function migrateWholesalePricing(database: Database.Database) {
  try {
    // Check if wholesaleProfit column exists
    const tableInfo = database.prepare("PRAGMA table_info(products)").all() as Array<{ name: string }>;
    const hasWholesaleProfit = tableInfo.some(col => col.name === 'wholesaleProfit');
    const hasWholesaleCostPrice = tableInfo.some(col => col.name === 'wholesaleCostPrice');

    if (hasWholesaleProfit && !hasWholesaleCostPrice) {
      console.log('🔄 Migrating wholesale pricing model...');

      // Add new column
      database.exec('ALTER TABLE products ADD COLUMN wholesaleCostPrice REAL DEFAULT 0');

      // Migrate data:
      // 1. wholesaleCostPrice = old wholesalePrice (the actual cost)
      // 2. wholesalePrice = wholesalePrice + wholesaleProfit (to keep customer price same)
      database.exec(`
        UPDATE products
        SET
          wholesaleCostPrice = wholesalePrice,
          wholesalePrice = wholesalePrice + COALESCE(wholesaleProfit, 0)
      `);

      console.log('✅ Wholesale pricing migration completed');
    }
  } catch (error) {
    console.error('⚠️ Migration warning:', error);
    // Don't throw - migration is optional for new databases
  }
}

// Migration: Add debt tracking columns to sales table
function migrateDebtTracking(database: Database.Database) {
  try {
    // Check if debt tracking columns exist in sales table
    const tableInfo = database.prepare("PRAGMA table_info(sales)").all() as Array<{ name: string }>;
    const hasDebtCustomerId = tableInfo.some(col => col.name === 'debtCustomerId');
    const hasDebtId = tableInfo.some(col => col.name === 'debtId');

    if (!hasDebtCustomerId || !hasDebtId) {
      console.log('🔄 Adding debt tracking columns to sales table...');

      if (!hasDebtCustomerId) {
        database.exec('ALTER TABLE sales ADD COLUMN debtCustomerId TEXT');
      }

      if (!hasDebtId) {
        database.exec('ALTER TABLE sales ADD COLUMN debtId TEXT');
      }

      console.log('✅ Debt tracking migration completed');
    }
  } catch (error) {
    console.error('⚠️ Debt tracking migration warning:', error);
    // Don't throw - migration is optional for new databases
  }
}

// Migration: Update payment methods CHECK constraint from card/transfer to debt
function migratePaymentMethods(database: Database.Database) {
  try {
    // Check if sales table has old constraint with 'card' or 'transfer'
    const tableSQL = database.prepare(
      "SELECT sql FROM sqlite_master WHERE type='table' AND name='sales'"
    ).get() as { sql: string } | undefined;

    if (tableSQL && (tableSQL.sql.includes("'card'") || tableSQL.sql.includes("'transfer'"))) {
      console.log('🔄 Migrating payment methods constraint from (cash, card, transfer) to (cash, debt)...');

      // SQLite doesn't allow modifying CHECK constraints, so we need to recreate the table
      database.exec(`
        -- Create new sales table with correct constraint
        CREATE TABLE sales_new (
          id TEXT PRIMARY KEY,
          productId TEXT NOT NULL,
          saleType TEXT DEFAULT 'retail' CHECK(saleType IN ('retail', 'wholesale')),
          quantity INTEGER NOT NULL DEFAULT 0,
          weight REAL,
          weightUnit TEXT CHECK(weightUnit IN ('kg', 'g', NULL)),
          unitPrice REAL NOT NULL,
          totalPrice REAL NOT NULL,
          discount REAL DEFAULT 0,
          finalPrice REAL NOT NULL,
          customerName TEXT,
          paymentMethod TEXT CHECK(paymentMethod IN ('cash', 'debt')),
          debtCustomerId TEXT,
          debtId TEXT,
          saleDate DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (productId) REFERENCES products(id),
          FOREIGN KEY (debtCustomerId) REFERENCES debt_customers(id),
          FOREIGN KEY (debtId) REFERENCES debts(id)
        );

        -- Copy existing data, converting old payment methods to new ones
        INSERT INTO sales_new (
          id, productId, saleType, quantity, weight, weightUnit,
          unitPrice, totalPrice, discount, finalPrice,
          customerName, paymentMethod, debtCustomerId, debtId, saleDate
        )
        SELECT
          id, productId, saleType, quantity, weight, weightUnit,
          unitPrice, totalPrice, discount, finalPrice,
          customerName,
          CASE
            WHEN paymentMethod = 'cash' THEN 'cash'
            WHEN paymentMethod IN ('card', 'transfer') THEN 'cash'
            ELSE 'cash'
          END as paymentMethod,
          debtCustomerId, debtId, saleDate
        FROM sales;

        -- Drop old table
        DROP TABLE sales;

        -- Rename new table to sales
        ALTER TABLE sales_new RENAME TO sales;

        -- Recreate indexes
        CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(saleDate);
        CREATE INDEX IF NOT EXISTS idx_sales_product ON sales(productId);
        CREATE INDEX IF NOT EXISTS idx_sales_type ON sales(saleType);
        CREATE INDEX IF NOT EXISTS idx_sales_payment_method ON sales(paymentMethod);
      `);

      console.log('✅ Payment methods migration completed - old payment methods converted to cash');
    }
  } catch (error) {
    console.error('⚠️ Payment methods migration warning:', error);
    // Don't throw - migration is optional for new databases
  }
}

// Migration: Populate customer names in existing debt sales
function migrateDebtSalesCustomerNames(database: Database.Database) {
  try {
    // Find all debt sales that have debtCustomerId but no customerName
    const salesNeedingUpdate = database.prepare(`
      SELECT s.id, s.debtCustomerId
      FROM sales s
      WHERE s.paymentMethod = 'debt'
        AND s.debtCustomerId IS NOT NULL
        AND (s.customerName IS NULL OR s.customerName = '')
    `).all() as Array<{ id: string; debtCustomerId: string }>;

    if (salesNeedingUpdate.length > 0) {
      console.log(`🔄 Updating ${salesNeedingUpdate.length} debt sales with customer names...`);

      let updated = 0;
      for (const sale of salesNeedingUpdate) {
        const customer = database.prepare(
          'SELECT name FROM debt_customers WHERE id = ?'
        ).get(sale.debtCustomerId) as { name: string } | undefined;

        if (customer) {
          database.prepare(
            'UPDATE sales SET customerName = ? WHERE id = ?'
          ).run(customer.name, sale.id);
          updated++;
        }
      }

      console.log(`✅ Updated ${updated} debt sales with customer names`);
    }
  } catch (error) {
    console.error('⚠️ Debt sales customer names migration warning:', error);
    // Don't throw - migration is optional
  }
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
      migrateWholesalePricing(db);
      migrateDebtTracking(db);
      migratePaymentMethods(db);
      migrateDebtSalesCustomerNames(db);

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
    const returnsCount = database.prepare('SELECT COUNT(*) as count FROM returns').get() as { count: number };
    const debtCustomersCount = database.prepare('SELECT COUNT(*) as count FROM debt_customers').get() as { count: number };
    const debtsCount = database.prepare('SELECT COUNT(*) as count FROM debts').get() as { count: number };
    const debtPaymentsCount = database.prepare('SELECT COUNT(*) as count FROM debt_payments').get() as { count: number };

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
        returns: returnsCount.count,
        debtCustomers: debtCustomersCount.count,
        debts: debtsCount.count,
        debtPayments: debtPaymentsCount.count,
      },
    };
  } catch (error) {
    console.error('❌ Failed to get database info:', error);
    return null;
  }
}

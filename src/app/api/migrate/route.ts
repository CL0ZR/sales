import { NextResponse } from 'next/server';
import { getDatabase, closeDatabase } from '@/lib/database';

export async function POST() {
  try {
    const db = getDatabase();

    console.log('🔄 Starting database migration...');

    // Check current state
    const productsInfo = db.prepare("PRAGMA table_info(products)").all() as Array<{ name: string }>;
    const salesInfo = db.prepare("PRAGMA table_info(sales)").all() as Array<{ name: string }>;
    const usersInfo = db.prepare("PRAGMA table_info(users)").all() as Array<{ name: string }>;

    const hasWholesaleProfit = productsInfo.some(col => col.name === 'wholesaleProfit');
    const hasSaleType = salesInfo.some(col => col.name === 'saleType');
    const hasAssistantAdminRole = usersInfo.some(col => col.name === 'role');

    const changes: string[] = [];

    // Begin transaction
    db.exec('BEGIN TRANSACTION');

    try {
      // Migration 1: Update users table for assistant-admin role
      if (!hasAssistantAdminRole || true) { // Always run to ensure role constraint is updated
        console.log('📝 Updating users table for assistant-admin role...');
        db.exec(`
          CREATE TABLE IF NOT EXISTS users_new (
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

        db.exec(`
          INSERT INTO users_new (
            id, username, password, role, fullName, email, phone,
            isActive, createdAt, updatedAt, lastLogin
          )
          SELECT
            id, username, password, role, fullName, email, phone,
            isActive, createdAt, updatedAt, lastLogin
          FROM users
        `);

        db.exec('DROP TABLE users');
        db.exec('ALTER TABLE users_new RENAME TO users');
        db.exec(`
          CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
          CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
        `);

        changes.push('✅ Users table updated for assistant-admin role');
        console.log('✅ Users table updated successfully');
      }

      // Migration 2: Add wholesaleProfit column to products
      if (!hasWholesaleProfit) {
        console.log('➕ Adding wholesaleProfit column to products table...');
        db.exec('ALTER TABLE products ADD COLUMN wholesaleProfit REAL DEFAULT 0');
        changes.push('✅ wholesaleProfit column added to products table');
        console.log('✅ wholesaleProfit column added successfully');
      }

      // Migration 3: Add saleType column to sales
      if (!hasSaleType) {
        console.log('➕ Adding saleType column to sales table...');
        db.exec("ALTER TABLE sales ADD COLUMN saleType TEXT DEFAULT 'retail' CHECK(saleType IN ('retail', 'wholesale'))");
        db.exec('CREATE INDEX IF NOT EXISTS idx_sales_type ON sales(saleType)');
        changes.push('✅ saleType column added to sales table');
        console.log('✅ saleType column added successfully');
      }

      // Migration 4: Convert product discounts from percentage to fixed amount
      console.log('🔄 Converting product discounts from percentage to fixed amount...');

      // Get all products
      const products = db.prepare('SELECT id, salePrice, discount FROM products').all() as Array<{
        id: string;
        salePrice: number;
        discount: number;
      }>;

      // Update each product's discount
      const updateDiscountStmt = db.prepare('UPDATE products SET discount = ? WHERE id = ?');
      let convertedCount = 0;

      for (const product of products) {
        // Only convert if discount is between 0 and 100 (likely a percentage)
        // and salePrice is greater than 100 (to avoid converting already-converted values)
        if (product.discount > 0 && product.discount <= 100 && product.salePrice > 100) {
          const fixedDiscount = product.salePrice * (product.discount / 100);
          updateDiscountStmt.run(fixedDiscount, product.id);
          convertedCount++;
        }
      }

      if (convertedCount > 0) {
        changes.push(`✅ Converted ${convertedCount} product discounts from percentage to fixed amount`);
        console.log(`✅ Converted ${convertedCount} product discounts`);
      }

      // Convert sale discounts from percentage to fixed amount
      console.log('🔄 Converting sale discounts from percentage to fixed amount...');

      // Get all sales
      const sales = db.prepare('SELECT id, totalPrice, discount, finalPrice FROM sales').all() as Array<{
        id: string;
        totalPrice: number;
        discount: number;
        finalPrice: number;
      }>;

      // Update each sale's discount
      const updateSaleDiscountStmt = db.prepare('UPDATE sales SET discount = ? WHERE id = ?');
      let convertedSalesCount = 0;

      for (const sale of sales) {
        // Only convert if discount is between 0 and 100 (likely a percentage)
        // Calculate what the price before discount would have been
        if (sale.discount > 0 && sale.discount <= 100) {
          // If old logic was: finalPrice = totalPrice * (1 - discount/100)
          // Then: totalPrice = finalPrice / (1 - discount/100)
          // And: fixedDiscount = totalPrice - finalPrice
          const priceBeforeDiscount = sale.finalPrice / (1 - sale.discount / 100);

          // Only convert if the calculation makes sense (totalPrice should match our calculation)
          if (Math.abs(priceBeforeDiscount - sale.totalPrice) < 1) {
            const fixedDiscount = sale.totalPrice * (sale.discount / 100);
            updateSaleDiscountStmt.run(fixedDiscount, sale.id);
            convertedSalesCount++;
          }
        }
      }

      if (convertedSalesCount > 0) {
        changes.push(`✅ Converted ${convertedSalesCount} sale discounts from percentage to fixed amount`);
        console.log(`✅ Converted ${convertedSalesCount} sale discounts`);
      }

      // Migration 5: Remove customerPhone column from sales
      const hasCustomerPhone = salesInfo.some(col => col.name === 'customerPhone');
      if (hasCustomerPhone) {
        console.log('🗑️ Removing customerPhone column from sales table...');

        // SQLite doesn't support DROP COLUMN, so we need to recreate the table
        db.exec(`
          CREATE TABLE IF NOT EXISTS sales_new (
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
            FOREIGN KEY (debtCustomerId) REFERENCES debt_customers(id),
            FOREIGN KEY (debtId) REFERENCES debts(id),
            FOREIGN KEY (productId) REFERENCES products(id)
          )
        `);

        // Copy data without customerPhone, add new debt fields
        db.exec(`
          INSERT INTO sales_new (
            id, productId, saleType, quantity, weight, weightUnit,
            unitPrice, totalPrice, discount, finalPrice,
            customerName, paymentMethod, debtCustomerId, debtId, saleDate
          )
          SELECT
            id, productId,
            COALESCE(saleType, 'retail'),
            quantity, weight, weightUnit,
            unitPrice, totalPrice, discount, finalPrice,
            customerName, paymentMethod, NULL, NULL, saleDate
          FROM sales
        `);

        // Temporarily disable foreign key constraints to handle dependent tables
        db.exec('PRAGMA foreign_keys = OFF');
        
        // Create temporary table to store return records that reference sales
        db.exec(`
          CREATE TEMPORARY TABLE temp_returns AS 
          SELECT * FROM returns WHERE saleId IN (SELECT id FROM sales)
        `);
        
        // Store the return records count to check if we need to restore them
        const returnsCount = db.prepare('SELECT COUNT(*) as count FROM temp_returns').get() as { count: number };
        
        // Drop the returns table temporarily
        if (returnsCount.count > 0) {
          db.exec('DROP TABLE returns');
        }
        
        // Now safely drop and rename the sales table
        db.exec('DROP TABLE sales');
        db.exec('ALTER TABLE sales_new RENAME TO sales');
        
        // Recreate the returns table structure
        if (returnsCount.count > 0) {
          db.exec(`
            CREATE TABLE returns (
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
          
          // Copy back the return records
          db.exec(`
            INSERT INTO returns (id, saleId, productId, returnedQuantity, returnedWeight, 
                               weightUnit, unitPrice, totalRefund, reason, returnDate, processedBy)
            SELECT id, saleId, productId, returnedQuantity, returnedWeight, 
                   weightUnit, unitPrice, totalRefund, reason, returnDate, processedBy
            FROM temp_returns
          `);
          
          // Drop the temporary table
          db.exec('DROP TABLE temp_returns');
        } else {
          // If no returns records existed, just recreate the table structure
          db.exec(`
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
        }

        // Recreate indexes
        db.exec('CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(saleDate)');
        db.exec('CREATE INDEX IF NOT EXISTS idx_sales_product ON sales(productId)');
        db.exec('CREATE INDEX IF NOT EXISTS idx_sales_type ON sales(saleType)');
        db.exec('CREATE INDEX IF NOT EXISTS idx_sales_payment_method ON sales(paymentMethod)');
        db.exec('CREATE INDEX IF NOT EXISTS idx_returns_date ON returns(returnDate)');
        db.exec('CREATE INDEX IF NOT EXISTS idx_returns_product ON returns(productId)');
        db.exec('CREATE INDEX IF NOT EXISTS idx_returns_sale ON returns(saleId)');
        
        // Re-enable foreign key constraints
        db.exec('PRAGMA foreign_keys = ON');

        changes.push('✅ customerPhone column removed from sales table');
        console.log('✅ customerPhone column removed successfully');
      }

      // Migration 6: Update payment methods from cash/card/transfer to cash/debt
      console.log('🔄 Updating payment methods to cash/debt...');

      // Update all sales with 'card' or 'transfer' payment methods to 'cash'
      const updatePaymentStmt = db.prepare(`
        UPDATE sales
        SET paymentMethod = 'cash'
        WHERE paymentMethod IN ('card', 'transfer')
      `);
      const paymentResult = updatePaymentStmt.run();

      if (paymentResult.changes > 0) {
        changes.push(`✅ Updated ${paymentResult.changes} sales records: card/transfer → cash`);
        console.log(`✅ Updated ${paymentResult.changes} payment methods`);
      }

      // Commit transaction
      db.exec('COMMIT');

      const allMigrated = hasWholesaleProfit && hasSaleType;

      console.log('✅ Migration completed successfully!');
      console.log('Changes made:', changes);

      return NextResponse.json({
        success: true,
        message: changes.length > 0 ? 'تم تحديث قاعدة البيانات بنجاح' : 'قاعدة البيانات محدثة بالفعل',
        changes,
        alreadyMigrated: allMigrated && changes.length === 0,
      });

    } catch (error) {
      // Rollback on error
      db.exec('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    return NextResponse.json({
      success: false,
      message: 'فشل تحديث قاعدة البيانات',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

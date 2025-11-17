import { getDatabase } from '@/lib/database';
import { Sale } from '@/types';
import { getProductById } from './products';

// الحصول على جميع المبيعات
export function getAllSales(): Sale[] {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM sales ORDER BY saleDate DESC');
  const rows = stmt.all() as Record<string, unknown>[];

  return rows.map(row => {
    const product = getProductById(row.productId as string);

    return {
      ...(row as object),
      product: product!,
      saleDate: new Date(row.saleDate as string),
    };
  }) as Sale[];
}

// إضافة مبيعة جديدة
export function addSale(sale: Omit<Sale, 'id' | 'saleDate'>): Sale {
  const db = getDatabase();
  const id = Date.now().toString();
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO sales (
      id, productId, saleType, quantity, weight, weightUnit,
      unitPrice, totalPrice, discount, finalPrice,
      customerName, paymentMethod, debtCustomerId, debtId, saleDate
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id, sale.productId, sale.saleType, sale.quantity, sale.weight, sale.weightUnit,
    sale.unitPrice, sale.totalPrice, sale.discount, sale.finalPrice,
    sale.customerName, sale.paymentMethod, sale.debtCustomerId || null, sale.debtId || null, now
  );

  return {
    ...sale,
    id,
    saleDate: new Date(now),
  };
}

// تحديث مبيعة (لربط معرف الدين بعد إنشائه)
export function updateSale(saleId: string, updates: Partial<Pick<Sale, 'debtId'>>): Sale | null {
  const db = getDatabase();

  // Build dynamic UPDATE query
  const updateFields: string[] = [];
  const values: (string | null)[] = [];

  if (updates.debtId !== undefined) {
    updateFields.push('debtId = ?');
    values.push(updates.debtId || null);
  }

  if (updateFields.length === 0) {
    return getSaleById(saleId);
  }

  const stmt = db.prepare(`
    UPDATE sales
    SET ${updateFields.join(', ')}
    WHERE id = ?
  `);

  values.push(saleId);
  stmt.run(...values);

  return getSaleById(saleId);
}

// حذف مبيعة
export function deleteSale(id: string): boolean {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM sales WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

// الحصول على مبيعة بالمعرف
export function getSaleById(id: string): Sale | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM sales WHERE id = ?');
  const row = stmt.get(id) as Record<string, unknown> | undefined;

  if (!row) return null;

  const product = getProductById(row.productId as string);

  return {
    ...(row as object),
    product: product!,
    saleDate: new Date(row.saleDate as string),
  } as Sale;
}

// مبيعات اليوم
export function getTodaySales(): Sale[] {
  const db = getDatabase();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const stmt = db.prepare('SELECT * FROM sales WHERE saleDate >= ? ORDER BY saleDate DESC');
  const rows = stmt.all(today.toISOString()) as Record<string, unknown>[];

  return rows.map(row => {
    const product = getProductById(row.productId as string);

    return {
      ...(row as object),
      product: product!,
      saleDate: new Date(row.saleDate as string),
    };
  }) as Sale[];
}

// مبيعات الشهر
export function getMonthSales(): Sale[] {
  const db = getDatabase();
  const firstDay = new Date();
  firstDay.setDate(1);
  firstDay.setHours(0, 0, 0, 0);

  const stmt = db.prepare('SELECT * FROM sales WHERE saleDate >= ? ORDER BY saleDate DESC');
  const rows = stmt.all(firstDay.toISOString()) as Record<string, unknown>[];

  return rows.map(row => {
    const product = getProductById(row.productId as string);

    return {
      ...(row as object),
      product: product!,
      saleDate: new Date(row.saleDate as string),
    };
  }) as Sale[];
}

// إحصائيات المبيعات
export function getSalesStats() {
  const db = getDatabase();

  const totalSales = db.prepare('SELECT COUNT(*) as count FROM sales').get() as { count: number };
  const totalRevenue = db.prepare('SELECT SUM(finalPrice) as total FROM sales').get() as { total: number };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todaySales = db.prepare('SELECT COUNT(*) as count FROM sales WHERE saleDate >= ?').get(today.toISOString()) as { count: number };
  const todayRevenue = db.prepare('SELECT SUM(finalPrice) as total FROM sales WHERE saleDate >= ?').get(today.toISOString()) as { total: number };

  const firstDay = new Date();
  firstDay.setDate(1);
  firstDay.setHours(0, 0, 0, 0);
  const monthRevenue = db.prepare('SELECT SUM(finalPrice) as total FROM sales WHERE saleDate >= ?').get(firstDay.toISOString()) as { total: number };

  return {
    totalSales: totalSales.count,
    totalRevenue: totalRevenue.total || 0,
    todaySales: todaySales.count,
    todayRevenue: todayRevenue.total || 0,
    monthRevenue: monthRevenue.total || 0,
  };
}

// أكثر المنتجات مبيعاً
export function getTopSellingProducts(limit: number = 10) {
  const db = getDatabase();

  const stmt = db.prepare(`
    SELECT
      productId,
      SUM(quantity) as totalQuantity,
      SUM(finalPrice) as totalRevenue,
      COUNT(*) as salesCount
    FROM sales
    GROUP BY productId
    ORDER BY totalRevenue DESC
    LIMIT ?
  `);

  const rows = stmt.all(limit) as Record<string, unknown>[];

  return rows.map(row => {
    const product = getProductById(row.productId as string);

    return {
      product: product!,
      totalSold: row.totalQuantity as number,
      revenue: row.totalRevenue as number,
      salesCount: row.salesCount as number,
    };
  });
}

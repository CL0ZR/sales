import { getDatabase } from '@/lib/database';
import { Return } from '@/types';
import { getProductById } from './products';
import { getSaleById } from './sales';

// Get all returns
export function getAllReturns(): Return[] {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM returns ORDER BY returnDate DESC');
  const rows = stmt.all() as Record<string, unknown>[];

  return rows.map(row => {
    const product = getProductById(row.productId as string);

    return {
      ...(row as object),
      product: product!,
      returnDate: new Date(row.returnDate as string),
    };
  }) as Return[];
}

// Add new return
export function addReturn(returnData: Omit<Return, 'id' | 'returnDate' | 'product'>): Return {
  const db = getDatabase();
  const id = Date.now().toString();
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO returns (
      id, saleId, productId, returnedQuantity, returnedWeight, weightUnit,
      unitPrice, totalRefund, reason, returnDate, processedBy
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id, returnData.saleId, returnData.productId, returnData.returnedQuantity,
    returnData.returnedWeight, returnData.weightUnit, returnData.unitPrice,
    returnData.totalRefund, returnData.reason, now, returnData.processedBy
  );

  const product = getProductById(returnData.productId);

  return {
    ...returnData,
    id,
    returnDate: new Date(now),
    product: product!,
  };
}

// Get return by ID
export function getReturnById(id: string): Return | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM returns WHERE id = ?');
  const row = stmt.get(id) as Record<string, unknown> | undefined;

  if (!row) return null;

  const product = getProductById(row.productId as string);

  return {
    ...(row as object),
    product: product!,
    returnDate: new Date(row.returnDate as string),
  } as Return;
}

// Get returns by sale ID
export function getReturnsBySaleId(saleId: string): Return[] {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM returns WHERE saleId = ? ORDER BY returnDate DESC');
  const rows = stmt.all(saleId) as Record<string, unknown>[];

  return rows.map(row => {
    const product = getProductById(row.productId as string);

    return {
      ...(row as object),
      product: product!,
      returnDate: new Date(row.returnDate as string),
    };
  }) as Return[];
}

// Get returns by product ID
export function getReturnsByProductId(productId: string): Return[] {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM returns WHERE productId = ? ORDER BY returnDate DESC');
  const rows = stmt.all(productId) as Record<string, unknown>[];

  return rows.map(row => {
    const product = getProductById(row.productId as string);

    return {
      ...(row as object),
      product: product!,
      returnDate: new Date(row.returnDate as string),
    };
  }) as Return[];
}

// Get returns by date range
export function getReturnsByDateRange(startDate: Date, endDate: Date): Return[] {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM returns WHERE returnDate >= ? AND returnDate <= ? ORDER BY returnDate DESC');
  const rows = stmt.all(startDate.toISOString(), endDate.toISOString()) as Record<string, unknown>[];

  return rows.map(row => {
    const product = getProductById(row.productId as string);

    return {
      ...(row as object),
      product: product!,
      returnDate: new Date(row.returnDate as string),
    };
  }) as Return[];
}

// Get today's returns
export function getTodayReturns(): Return[] {
  const db = getDatabase();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const stmt = db.prepare('SELECT * FROM returns WHERE returnDate >= ? ORDER BY returnDate DESC');
  const rows = stmt.all(today.toISOString()) as Record<string, unknown>[];

  return rows.map(row => {
    const product = getProductById(row.productId as string);

    return {
      ...(row as object),
      product: product!,
      returnDate: new Date(row.returnDate as string),
    };
  }) as Return[];
}

// Get month's returns
export function getMonthReturns(): Return[] {
  const db = getDatabase();
  const firstDay = new Date();
  firstDay.setDate(1);
  firstDay.setHours(0, 0, 0, 0);

  const stmt = db.prepare('SELECT * FROM returns WHERE returnDate >= ? ORDER BY returnDate DESC');
  const rows = stmt.all(firstDay.toISOString()) as Record<string, unknown>[];

  return rows.map(row => {
    const product = getProductById(row.productId as string);

    return {
      ...(row as object),
      product: product!,
      returnDate: new Date(row.returnDate as string),
    };
  }) as Return[];
}

// Get return statistics
export function getReturnStats() {
  const db = getDatabase();

  const totalReturns = db.prepare('SELECT COUNT(*) as count FROM returns').get() as { count: number };
  const totalRefunds = db.prepare('SELECT SUM(totalRefund) as total FROM returns').get() as { total: number };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayReturns = db.prepare('SELECT COUNT(*) as count FROM returns WHERE returnDate >= ?').get(today.toISOString()) as { count: number };
  const todayRefunds = db.prepare('SELECT SUM(totalRefund) as total FROM returns WHERE returnDate >= ?').get(today.toISOString()) as { total: number };

  const firstDay = new Date();
  firstDay.setDate(1);
  firstDay.setHours(0, 0, 0, 0);
  const monthRefunds = db.prepare('SELECT SUM(totalRefund) as total FROM returns WHERE returnDate >= ?').get(firstDay.toISOString()) as { total: number };

  return {
    totalReturns: totalReturns.count,
    totalRefunds: totalRefunds.total || 0,
    todayReturns: todayReturns.count,
    todayRefunds: todayRefunds.total || 0,
    monthRefunds: monthRefunds.total || 0,
  };
}

// Get most returned products
export function getMostReturnedProducts(limit: number = 10) {
  const db = getDatabase();

  const stmt = db.prepare(`
    SELECT
      productId,
      SUM(returnedQuantity) as totalQuantity,
      SUM(totalRefund) as totalRefund,
      COUNT(*) as returnCount
    FROM returns
    GROUP BY productId
    ORDER BY returnCount DESC
    LIMIT ?
  `);

  const rows = stmt.all(limit) as Record<string, unknown>[];

  return rows.map(row => {
    const product = getProductById(row.productId as string);

    return {
      product: product!,
      totalReturned: row.totalQuantity as number,
      totalRefund: row.totalRefund as number,
      returnCount: row.returnCount as number,
    };
  });
}

// Calculate total returned amount for a specific sale
export function getTotalReturnedForSale(saleId: string): { quantity: number; weight: number } {
  const db = getDatabase();

  const stmt = db.prepare(`
    SELECT
      SUM(returnedQuantity) as totalQuantity,
      SUM(returnedWeight) as totalWeight
    FROM returns
    WHERE saleId = ?
  `);

  const result = stmt.get(saleId) as { totalQuantity: number | null; totalWeight: number | null } | undefined;

  return {
    quantity: result?.totalQuantity || 0,
    weight: result?.totalWeight || 0,
  };
}

import { getDatabase } from '@/lib/database';
import { Product } from '@/types';

// الحصول على جميع المنتجات
export function getAllProducts(): Product[] {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM products ORDER BY createdAt DESC');
  const rows = stmt.all() as Record<string, unknown>[];

  return rows.map(row => ({
    ...(row as object),
    createdAt: new Date(row.createdAt as string),
    updatedAt: new Date(row.updatedAt as string),
  })) as Product[];
}

// إضافة منتج جديد
export function addProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product {
  const db = getDatabase();
  const id = Date.now().toString();
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO products (
      id, name, description, category, subcategory,
      wholesalePrice, salePrice, discount,
      measurementType, quantity, minQuantity, weightUnit, weight, minWeight,
      barcode, currency, imageUrl, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id, product.name, product.description, product.category, product.subcategory,
    product.wholesalePrice, product.salePrice, product.discount,
    product.measurementType, product.quantity, product.minQuantity,
    product.weightUnit, product.weight, product.minWeight,
    product.barcode, product.currency, product.imageUrl, now, now
  );

  return {
    ...product,
    id,
    createdAt: new Date(now),
    updatedAt: new Date(now),
  };
}

// تحديث منتج
export function updateProduct(product: Product): Product {
  const db = getDatabase();
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    UPDATE products SET
      name = ?, description = ?, category = ?, subcategory = ?,
      wholesalePrice = ?, salePrice = ?, discount = ?,
      measurementType = ?, quantity = ?, minQuantity = ?, weightUnit = ?, weight = ?, minWeight = ?,
      barcode = ?, currency = ?, imageUrl = ?, updatedAt = ?
    WHERE id = ?
  `);

  stmt.run(
    product.name, product.description, product.category, product.subcategory,
    product.wholesalePrice, product.salePrice, product.discount,
    product.measurementType, product.quantity, product.minQuantity,
    product.weightUnit, product.weight, product.minWeight,
    product.barcode, product.currency, product.imageUrl, now, product.id
  );

  return {
    ...product,
    updatedAt: new Date(now),
  };
}

// حذف منتج
export function deleteProduct(id: string): boolean {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM products WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

// البحث عن منتج
export function getProductById(id: string): Product | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM products WHERE id = ?');
  const row = stmt.get(id) as Record<string, unknown> | undefined;

  if (!row) return null;

  return {
    ...(row as object),
    createdAt: new Date(row.createdAt as string),
    updatedAt: new Date(row.updatedAt as string),
  } as Product;
}

// البحث في المنتجات
export function searchProducts(searchTerm: string, category?: string): Product[] {
  const db = getDatabase();
  let query = `
    SELECT * FROM products 
    WHERE (name LIKE ? OR description LIKE ? OR barcode LIKE ?)
  `;
  const params = [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`];
  
  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  
  query += ' ORDER BY name ASC';
  
  const stmt = db.prepare(query);
  const rows = stmt.all(...params) as Record<string, unknown>[];

  return rows.map(row => ({
    ...(row as object),
    createdAt: new Date(row.createdAt as string),
    updatedAt: new Date(row.updatedAt as string),
  })) as Product[];
}

// منتجات قليلة المخزون
export function getLowStockProducts(): Product[] {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM products WHERE quantity <= minQuantity ORDER BY quantity ASC');
  const rows = stmt.all() as Record<string, unknown>[];

  return rows.map(row => ({
    ...(row as object),
    createdAt: new Date(row.createdAt as string),
    updatedAt: new Date(row.updatedAt as string),
  })) as Product[];
}

// إحصائيات المنتجات
export function getProductStats() {
  const db = getDatabase();
  
  const totalProducts = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
  const lowStockProducts = db.prepare('SELECT COUNT(*) as count FROM products WHERE quantity <= minQuantity').get() as { count: number };
  const outOfStockProducts = db.prepare('SELECT COUNT(*) as count FROM products WHERE quantity = 0').get() as { count: number };
  
  return {
    totalProducts: totalProducts.count,
    lowStockProducts: lowStockProducts.count,
    outOfStockProducts: outOfStockProducts.count,
  };
}

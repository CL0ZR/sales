import { getDatabase } from '@/lib/database';
import { Category, Subcategory } from '@/types';

/**
 * Add a new category
 */
export function addCategory(categoryData: {
  name: string;
  description?: string;
  subcategories?: Array<{ name: string; description?: string }>;
}): Category {
  const db = getDatabase();

  const categoryId = Date.now().toString() + Math.random().toString(36).substr(2, 9);

  // Insert category
  db.prepare(`
    INSERT INTO categories (id, name, description)
    VALUES (?, ?, ?)
  `).run(categoryId, categoryData.name, categoryData.description || null);

  // Insert subcategories if provided
  if (categoryData.subcategories && categoryData.subcategories.length > 0) {
    const subcategoryStmt = db.prepare(`
      INSERT INTO subcategories (id, name, description, categoryId)
      VALUES (?, ?, ?, ?)
    `);

    categoryData.subcategories.forEach((sub, index) => {
      const subcategoryId = `${categoryId}-sub-${index}`;
      subcategoryStmt.run(subcategoryId, sub.name, sub.description || null, categoryId);
    });
  }

  return getCategoryById(categoryId)!;
}

/**
 * Get category by ID
 */
export function getCategoryById(id: string): Category | null {
  const db = getDatabase();

  const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as Category | undefined;
  if (!category) return null;

  const subcategories = db
    .prepare('SELECT * FROM subcategories WHERE categoryId = ?')
    .all(id) as Subcategory[];

  return {
    ...category,
    subcategories,
  };
}

/**
 * Get all categories
 */
export function getAllCategories(): Category[] {
  const db = getDatabase();

  const categories = db.prepare('SELECT * FROM categories').all() as Omit<Category, 'subcategories'>[];

  return categories.map((category) => {
    const subcategories = db
      .prepare('SELECT * FROM subcategories WHERE categoryId = ?')
      .all(category.id) as Subcategory[];

    return {
      ...category,
      subcategories,
    };
  });
}

/**
 * Update a category
 */
export function updateCategory(categoryData: {
  id: string;
  name: string;
  description?: string;
  subcategories?: Array<{ id?: string; name: string; description?: string }>;
}): Category {
  const db = getDatabase();

  // Update category
  db.prepare(`
    UPDATE categories
    SET name = ?, description = ?
    WHERE id = ?
  `).run(categoryData.name, categoryData.description || null, categoryData.id);

  // Delete existing subcategories
  db.prepare('DELETE FROM subcategories WHERE categoryId = ?').run(categoryData.id);

  // Insert new subcategories if provided
  if (categoryData.subcategories && categoryData.subcategories.length > 0) {
    const subcategoryStmt = db.prepare(`
      INSERT INTO subcategories (id, name, description, categoryId)
      VALUES (?, ?, ?, ?)
    `);

    categoryData.subcategories.forEach((sub, index) => {
      const subcategoryId = sub.id || `${categoryData.id}-sub-${index}-${Date.now()}`;
      subcategoryStmt.run(subcategoryId, sub.name, sub.description || null, categoryData.id);
    });
  }

  return getCategoryById(categoryData.id)!;
}

/**
 * Delete a category
 */
export function deleteCategory(id: string): boolean {
  const db = getDatabase();

  try {
    // Check if category has products
    const productCount = db.prepare(
      'SELECT COUNT(*) as count FROM products WHERE category IN (SELECT name FROM categories WHERE id = ?)'
    ).get(id) as { count: number };

    if (productCount.count > 0) {
      throw new Error(`Cannot delete category. It has ${productCount.count} product(s) associated with it.`);
    }

    // Delete subcategories first (CASCADE should handle this, but being explicit)
    db.prepare('DELETE FROM subcategories WHERE categoryId = ?').run(id);

    // Delete category
    const result = db.prepare('DELETE FROM categories WHERE id = ?').run(id);

    return result.changes > 0;
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
}

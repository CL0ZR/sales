import { getDatabase } from '@/lib/database';
import { Category, Subcategory } from '@/types';

// الحصول على جميع الفئات مع الفئات الفرعية
export function getAllCategories(): Category[] {
  const db = getDatabase();
  
  // الحصول على الفئات الرئيسية
  const categoriesStmt = db.prepare('SELECT * FROM categories ORDER BY name ASC');
  const categories = categoriesStmt.all() as Category[];
  
  // الحصول على الفئات الفرعية
  const subcategoriesStmt = db.prepare('SELECT * FROM subcategories ORDER BY name ASC');
  const subcategories = subcategoriesStmt.all() as Subcategory[];
  
  // ربط الفئات الفرعية بالفئات الرئيسية
  return categories.map(category => ({
    ...category,
    subcategories: subcategories.filter(sub => sub.categoryId === category.id),
  }));
}

// إضافة فئة جديدة
export function addCategory(categoryData: Omit<Category, 'id'>): Category {
  const db = getDatabase();
  const id = Date.now().toString();
  const now = new Date().toISOString();
  
  const transaction = db.transaction(() => {
    // إضافة الفئة الرئيسية
    const categoryStmt = db.prepare(`
      INSERT INTO categories (id, name, description, createdAt) 
      VALUES (?, ?, ?, ?)
    `);
    categoryStmt.run(id, categoryData.name, categoryData.description, now);
    
    // إضافة الفئات الفرعية
    const subcategoryStmt = db.prepare(`
      INSERT INTO subcategories (id, name, description, categoryId) 
      VALUES (?, ?, ?, ?)
    `);
    
    categoryData.subcategories.forEach((sub, index) => {
      const subId = `${id}-${index}`;
      subcategoryStmt.run(subId, sub.name, sub.description, id);
    });
  });
  
  transaction();
  
  return {
    id,
    name: categoryData.name,
    description: categoryData.description,
    subcategories: categoryData.subcategories.map((sub, index) => ({
      id: `${id}-${index}`,
      name: sub.name,
      description: sub.description,
      categoryId: id,
    })),
  };
}

// تحديث فئة
export function updateCategory(category: Category): Category {
  const db = getDatabase();
  
  const transaction = db.transaction(() => {
    // تحديث الفئة الرئيسية
    const categoryStmt = db.prepare(`
      UPDATE categories SET name = ?, description = ? WHERE id = ?
    `);
    categoryStmt.run(category.name, category.description, category.id);
    
    // حذف الفئات الفرعية القديمة
    const deleteSubsStmt = db.prepare('DELETE FROM subcategories WHERE categoryId = ?');
    deleteSubsStmt.run(category.id);
    
    // إضافة الفئات الفرعية الجديدة
    const subcategoryStmt = db.prepare(`
      INSERT INTO subcategories (id, name, description, categoryId) 
      VALUES (?, ?, ?, ?)
    `);
    
    category.subcategories.forEach((sub, index) => {
      const subId = `${category.id}-${index}`;
      subcategoryStmt.run(subId, sub.name, sub.description, category.id);
    });
  });
  
  transaction();
  
  return category;
}

// حذف فئة
export function deleteCategory(id: string): boolean {
  const db = getDatabase();
  
  const transaction = db.transaction(() => {
    // حذف الفئات الفرعية أولاً
    const deleteSubsStmt = db.prepare('DELETE FROM subcategories WHERE categoryId = ?');
    deleteSubsStmt.run(id);
    
    // حذف الفئة الرئيسية
    const deleteCategoryStmt = db.prepare('DELETE FROM categories WHERE id = ?');
    deleteCategoryStmt.run(id);
  });
  
  transaction();
  
  return true;
}

// الحصول على فئة بواسطة الاسم
export function getCategoryByName(name: string): Category | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM categories WHERE name = ?');
  const category = stmt.get(name) as Category | undefined;
  
  if (!category) return null;
  
  // الحصول على الفئات الفرعية
  const subsStmt = db.prepare('SELECT * FROM subcategories WHERE categoryId = ?');
  const subcategories = subsStmt.all(category.id) as Subcategory[];
  
  return {
    ...category,
    subcategories,
  };
}

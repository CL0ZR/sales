import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { addCategory } from '@/lib/queries/categories';
import { addProduct } from '@/lib/queries/products';
import { createUser } from '@/lib/queries/users';

export async function POST() {
  try {
    const db = getDatabase();

    // Check if data already exists
    const existingProducts = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
    const existingCategories = db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number };

    if (existingProducts.count > 0 || existingCategories.count > 0) {
      return NextResponse.json({
        success: false,
        message: 'قاعدة البيانات تحتوي بالفعل على بيانات. استخدم زر "إفراغ قاعدة البيانات" أولاً.',
      });
    }

    // Create Categories with Subcategories
    const categories = [
      {
        name: 'إلكترونيات',
        description: 'أجهزة إلكترونية ومستلزماتها',
        subcategories: [
          { name: 'هواتف ذكية', description: 'هواتف محمولة وإكسسواراتها' },
          { name: 'أجهزة كمبيوتر', description: 'لابتوب وسطح مكتب وملحقات' },
          { name: 'ملحقات إلكترونية', description: 'كابلات وشواحن وسماعات' },
        ],
      },
      {
        name: 'أغذية',
        description: 'مواد غذائية ومشروبات',
        subcategories: [
          { name: 'مشروبات', description: 'عصائر ومشروبات غازية' },
          { name: 'معلبات', description: 'أطعمة معلبة' },
          { name: 'حلويات', description: 'شوكولاتة وحلويات' },
        ],
      },
      {
        name: 'ملابس',
        description: 'ملابس رجالية ونسائية وأطفال',
        subcategories: [
          { name: 'رجالي', description: 'ملابس رجالية' },
          { name: 'نسائي', description: 'ملابس نسائية' },
          { name: 'أطفال', description: 'ملابس أطفال' },
        ],
      },
      {
        name: 'أدوات منزلية',
        description: 'أدوات ومستلزمات منزلية',
        subcategories: [
          { name: 'أدوات مطبخ', description: 'أواني وأدوات طبخ' },
          { name: 'أدوات تنظيف', description: 'منظفات ومعدات تنظيف' },
        ],
      },
      {
        name: 'قرطاسية',
        description: 'أدوات مكتبية ومدرسية',
        subcategories: [
          { name: 'دفاتر وكتب', description: 'دفاتر ومذكرات' },
          { name: 'أقلام وأدوات كتابة', description: 'أقلام وألوان' },
        ],
      },
    ];

    // Add categories to database
    const createdCategories = [];
    for (const cat of categories) {
      try {
        const category = addCategory({
          name: cat.name,
          description: cat.description,
          subcategories: cat.subcategories.map(sub => ({
            name: sub.name,
            description: sub.description,
          })),
        });
        createdCategories.push(category);
        // Small delay to ensure unique IDs
        await new Promise(resolve => setTimeout(resolve, 10));
      } catch (error) {
        console.error(`Error adding category ${cat.name}:`, error);
      }
    }

    // Create Products (25 products)
    const products = [
      // Electronics - Smartphones
      { name: 'iPhone 15 Pro', description: 'هاتف آيفون 15 برو 256 جيجا', category: 'إلكترونيات', subcategory: 'هواتف ذكية', wholesaleCostPrice: 1200000, wholesalePrice: 1400000, salePrice: 1600000, discount: 50000, measurementType: 'quantity', quantity: 15, minQuantity: 3, currency: 'IQD', barcode: '1001' },
      { name: 'Samsung Galaxy S24', description: 'سامسونج جالاكسي S24 128 جيجا', category: 'إلكترونيات', subcategory: 'هواتف ذكية', wholesaleCostPrice: 800000, wholesalePrice: 950000, salePrice: 1100000, discount: 30000, measurementType: 'quantity', quantity: 20, minQuantity: 5, currency: 'IQD', barcode: '1002' },
      { name: 'Xiaomi Redmi Note 13', description: 'شاومي ريدمي نوت 13 برو', category: 'إلكترونيات', subcategory: 'هواتف ذكية', wholesaleCostPrice: 300000, wholesalePrice: 380000, salePrice: 450000, discount: 20000, measurementType: 'quantity', quantity: 30, minQuantity: 5, currency: 'IQD', barcode: '1003' },

      // Electronics - Computers
      { name: 'لابتوب Dell XPS', description: 'لابتوب ديل اكس بي اس 15 انش', category: 'إلكترونيات', subcategory: 'أجهزة كمبيوتر', wholesaleCostPrice: 1500000, wholesalePrice: 1800000, salePrice: 2000000, discount: 0, measurementType: 'quantity', quantity: 8, minQuantity: 2, currency: 'IQD', barcode: '1004' },
      { name: 'كيبورد ميكانيكي', description: 'كيبورد ميكانيكي RGB إضاءة', category: 'إلكترونيات', subcategory: 'أجهزة كمبيوتر', wholesaleCostPrice: 50000, wholesalePrice: 70000, salePrice: 90000, discount: 5000, measurementType: 'quantity', quantity: 40, minQuantity: 10, currency: 'IQD', barcode: '1005' },

      // Electronics - Accessories
      { name: 'سماعات AirPods Pro', description: 'سماعات ابل اير بودز برو 2', category: 'إلكترونيات', subcategory: 'ملحقات إلكترونية', wholesaleCostPrice: 250000, wholesalePrice: 310000, salePrice: 380000, discount: 15000, measurementType: 'quantity', quantity: 25, minQuantity: 5, currency: 'IQD', barcode: '1006' },
      { name: 'كابل USB-C', description: 'كابل USB-C سريع الشحن 2 متر', category: 'إلكترونيات', subcategory: 'ملحقات إلكترونية', wholesaleCostPrice: 5000, wholesalePrice: 8000, salePrice: 12000, discount: 2000, measurementType: 'quantity', quantity: 100, minQuantity: 20, currency: 'IQD', barcode: '1007' },
      { name: 'شاحن سريع 65W', description: 'شاحن سريع متعدد المنافذ', category: 'إلكترونيات', subcategory: 'ملحقات إلكترونية', wholesaleCostPrice: 25000, wholesalePrice: 35000, salePrice: 45000, discount: 5000, measurementType: 'quantity', quantity: 50, minQuantity: 10, currency: 'IQD', barcode: '1008' },

      // Food - Beverages
      { name: 'عصير برتقال طبيعي', description: 'عصير برتقال طازج 100%', category: 'أغذية', subcategory: 'مشروبات', wholesaleCostPrice: 2000, wholesalePrice: 2500, salePrice: 3000, discount: 0, measurementType: 'quantity', quantity: 200, minQuantity: 50, currency: 'IQD', barcode: '2001' },
      { name: 'مشروب غازي', description: 'مشروب غازي علبة 330 مل', category: 'أغذية', subcategory: 'مشروبات', wholesaleCostPrice: 500, wholesalePrice: 750, salePrice: 1000, discount: 0, measurementType: 'quantity', quantity: 500, minQuantity: 100, currency: 'IQD', barcode: '2002' },

      // Food - Canned
      { name: 'تونة معلبة', description: 'تونة في زيت الزيتون', category: 'أغذية', subcategory: 'معلبات', wholesaleCostPrice: 3000, wholesalePrice: 4000, salePrice: 5000, discount: 500, measurementType: 'quantity', quantity: 150, minQuantity: 30, currency: 'IQD', barcode: '2003' },
      { name: 'رز بسمتي', description: 'رز بسمتي هندي ممتاز', category: 'أغذية', subcategory: 'معلبات', wholesaleCostPrice: 15000, wholesalePrice: 18000, salePrice: 22000, discount: 0, measurementType: 'weight', weight: 500, minWeight: 100, weightUnit: 'kg', currency: 'IQD', barcode: '2004' },

      // Food - Sweets
      { name: 'شوكولاتة جالاكسي', description: 'شوكولاتة جالاكسي بالحليب', category: 'أغذية', subcategory: 'حلويات', wholesaleCostPrice: 2000, wholesalePrice: 2800, salePrice: 3500, discount: 500, measurementType: 'quantity', quantity: 300, minQuantity: 50, currency: 'IQD', barcode: '2005' },
      { name: 'بسكويت اوريو', description: 'بسكويت اوريو بالكريمة', category: 'أغذية', subcategory: 'حلويات', wholesaleCostPrice: 3000, wholesalePrice: 4000, salePrice: 5000, discount: 0, measurementType: 'quantity', quantity: 200, minQuantity: 40, currency: 'IQD', barcode: '2006' },

      // Clothing - Men
      { name: 'قميص رجالي كلاسيكي', description: 'قميص رجالي قطن 100%', category: 'ملابس', subcategory: 'رجالي', wholesaleCostPrice: 15000, wholesalePrice: 22000, salePrice: 30000, discount: 3000, measurementType: 'quantity', quantity: 50, minQuantity: 10, currency: 'IQD', barcode: '3001' },
      { name: 'بنطلون جينز رجالي', description: 'جينز رجالي أزرق', category: 'ملابس', subcategory: 'رجالي', wholesaleCostPrice: 25000, wholesalePrice: 35000, salePrice: 45000, discount: 5000, measurementType: 'quantity', quantity: 40, minQuantity: 8, currency: 'IQD', barcode: '3002' },

      // Clothing - Women
      { name: 'فستان نسائي صيفي', description: 'فستان نسائي قطن خفيف', category: 'ملابس', subcategory: 'نسائي', wholesaleCostPrice: 30000, wholesalePrice: 42000, salePrice: 55000, discount: 5000, measurementType: 'quantity', quantity: 35, minQuantity: 7, currency: 'IQD', barcode: '3003' },

      // Clothing - Kids
      { name: 'بيجاما أطفال', description: 'بيجاما أطفال قطن ناعم', category: 'ملابس', subcategory: 'أطفال', wholesaleCostPrice: 12000, wholesalePrice: 18000, salePrice: 25000, discount: 3000, measurementType: 'quantity', quantity: 60, minQuantity: 15, currency: 'IQD', barcode: '3004' },

      // Home - Kitchen
      { name: 'طقم أواني طبخ', description: 'طقم أواني 12 قطعة ستانلس', category: 'أدوات منزلية', subcategory: 'أدوات مطبخ', wholesaleCostPrice: 80000, wholesalePrice: 110000, salePrice: 140000, discount: 10000, measurementType: 'quantity', quantity: 15, minQuantity: 3, currency: 'IQD', barcode: '4001' },
      { name: 'خلاط كهربائي', description: 'خلاط كهربائي 3 سرعات', category: 'أدوات منزلية', subcategory: 'أدوات مطبخ', wholesaleCostPrice: 35000, wholesalePrice: 48000, salePrice: 60000, discount: 5000, measurementType: 'quantity', quantity: 25, minQuantity: 5, currency: 'IQD', barcode: '4002' },

      // Home - Cleaning
      { name: 'منظف أرضيات', description: 'منظف أرضيات برائحة اللافندر', category: 'أدوات منزلية', subcategory: 'أدوات تنظيف', wholesaleCostPrice: 8000, wholesalePrice: 11000, salePrice: 15000, discount: 2000, measurementType: 'quantity', quantity: 100, minQuantity: 20, currency: 'IQD', barcode: '4003' },

      // Stationery
      { name: 'دفتر 100 ورقة', description: 'دفتر سلك A4 مسطر', category: 'قرطاسية', subcategory: 'دفاتر وكتب', wholesaleCostPrice: 3000, wholesalePrice: 4500, salePrice: 6000, discount: 500, measurementType: 'quantity', quantity: 200, minQuantity: 50, currency: 'IQD', barcode: '5001' },
      { name: 'مجموعة أقلام ملونة', description: 'علبة 24 لون', category: 'قرطاسية', subcategory: 'أقلام وأدوات كتابة', wholesaleCostPrice: 8000, wholesalePrice: 12000, salePrice: 16000, discount: 2000, measurementType: 'quantity', quantity: 80, minQuantity: 20, currency: 'IQD', barcode: '5002' },
      { name: 'قلم جاف أزرق', description: 'قلم جاف حبر أزرق', category: 'قرطاسية', subcategory: 'أقلام وأدوات كتابة', wholesaleCostPrice: 500, wholesalePrice: 800, salePrice: 1200, discount: 0, measurementType: 'quantity', quantity: 500, minQuantity: 100, currency: 'IQD', barcode: '5003' },
    ];

    // Add products to database
    let addedCount = 0;
    for (const product of products) {
      try {
        addProduct({
          name: product.name,
          description: product.description,
          category: product.category,
          subcategory: product.subcategory || '',
          wholesalePrice: product.wholesalePrice,
          wholesaleCostPrice: product.wholesaleCostPrice,
          salePrice: product.salePrice,
          discount: product.discount,
          measurementType: product.measurementType as 'quantity' | 'weight',
          quantity: product.quantity || 0,
          minQuantity: product.minQuantity || 5,
          weight: product.weight || 0,
          minWeight: product.minWeight || 0,
          weightUnit: (product.weightUnit as 'kg' | 'g') || 'kg',
          barcode: product.barcode,
          currency: product.currency as 'IQD' | 'USD',
          imageUrl: '',
        });
        addedCount++;
        // Small delay
        await new Promise(resolve => setTimeout(resolve, 5));
      } catch (error) {
        console.error(`Error adding product ${product.name}:`, error);
      }
    }

    // Create User Accounts
    const users = [
      { username: 'manager1', password: 'manager123', role: 'admin', fullName: 'أحمد المدير', email: 'manager1@store.com', phone: '07701234567' },
      { username: 'assistant1', password: 'assistant123', role: 'assistant-admin', fullName: 'سارة المساعدة', email: 'assistant1@store.com', phone: '07709876543' },
      { username: 'assistant2', password: 'assistant123', role: 'assistant-admin', fullName: 'محمد المساعد', email: 'assistant2@store.com', phone: '07708765432' },
      { username: 'cashier1', password: 'cashier123', role: 'user', fullName: 'فاطمة الصراف', email: 'cashier1@store.com', phone: '07707654321' },
      { username: 'cashier2', password: 'cashier123', role: 'user', fullName: 'علي الصراف', email: 'cashier2@store.com', phone: '07706543210' },
    ];

    let usersAdded = 0;
    for (const user of users) {
      try {
        await createUser({
          username: user.username,
          password: user.password,
          role: user.role as 'admin' | 'assistant-admin' | 'user',
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
        });
        usersAdded++;
      } catch (error) {
        console.error(`Error creating user ${user.username}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `تم إضافة البيانات بنجاح!\n\nالفئات: ${createdCategories.length}\nالمنتجات: ${addedCount}\nالمستخدمين: ${usersAdded}`,
      data: {
        categories: createdCategories.length,
        products: addedCount,
        users: usersAdded,
      },
    });
  } catch (error) {
    console.error('Error seeding database:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'فشل إضافة البيانات',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

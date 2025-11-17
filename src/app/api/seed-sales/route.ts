import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { addSale } from '@/lib/queries/sales';
import { Product } from '@/types';

export async function POST() {
  try {
    const db = getDatabase();

    // Get all products
    const products = db.prepare('SELECT * FROM products').all() as Array<Record<string, unknown>>;

    if (products.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'لا توجد منتجات في قاعدة البيانات. الرجاء إضافة بيانات تجريبية أولاً.',
      });
    }

    // Get all debt customers
    const debtCustomers = db.prepare('SELECT * FROM debt_customers').all() as Array<Record<string, unknown>>;

    if (debtCustomers.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'لا توجد عملاء في دفتر الديون. الرجاء إضافة عملاء ديون أولاً.',
      });
    }

    const saleTypes: ('retail' | 'wholesale')[] = ['retail', 'wholesale'];
    const paymentMethods: ('cash' | 'debt')[] = ['cash', 'debt'];
    const customerNames = [
      'أحمد محمد',
      'فاطمة علي',
      'محمود حسن',
      'سارة خالد',
      'علي عبدالله',
      'مريم إبراهيم',
      'حسن يوسف',
      'نور الدين',
      'ليلى أحمد',
      'عمر سعيد',
      'هدى محمود',
      'كريم عادل',
      'رنا صالح',
      'طارق فؤاد',
      'ياسمين نبيل',
      '',  // Some sales without customer name
    ];

    let salesAdded = 0;
    const createdSales = [];

    // Create 70 sales
    for (let i = 0; i < 70; i++) {
      try {
        // Pick random product
        const product = products[Math.floor(Math.random() * products.length)];

        // Random sale type
        const saleType = saleTypes[Math.floor(Math.random() * saleTypes.length)];

        // Random payment method
        const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

        // Select customer based on payment method
        let customerName = '';
        let debtCustomerId: string | undefined = undefined;

        if (paymentMethod === 'debt') {
          // For debt sales, select a random debt customer
          const debtCustomer = debtCustomers[Math.floor(Math.random() * debtCustomers.length)];
          customerName = String(debtCustomer.name);
          debtCustomerId = String(debtCustomer.id);
        } else {
          // For cash sales, use random customer name (or empty)
          customerName = customerNames[Math.floor(Math.random() * customerNames.length)];
        }

        // Determine quantity/weight based on product measurement type
        let quantity = 0;
        let weight = 0;
        let soldAmount = 0;

        if (product.measurementType === 'quantity') {
          // For quantity-based: sell 1 to 10 items
          quantity = Math.floor(Math.random() * 10) + 1;
          soldAmount = quantity;
        } else {
          // For weight-based: sell 0.5kg to 20kg
          weight = Math.round((Math.random() * 19.5 + 0.5) * 100) / 100;
          soldAmount = weight;
        }

        // Calculate prices
        let unitPrice: number;
        let discount: number;

        const wholesalePrice = Number(product.wholesalePrice) || 0;
        const salePrice = Number(product.salePrice) || 0;
        const productDiscount = Number(product.discount) || 0;

        if (saleType === 'wholesale') {
          // Wholesale: optionally apply discount (30% of sales apply discount)
          discount = Math.random() < 0.3 ? Math.floor(Math.random() * (wholesalePrice * 0.1)) : 0;
          unitPrice = wholesalePrice - discount;
        } else {
          // Retail: optionally apply discount (40% of sales apply discount)
          const priceAfterProductDiscount = salePrice - productDiscount;
          discount = Math.random() < 0.4 ? Math.floor(Math.random() * (priceAfterProductDiscount * 0.15)) : 0;
          unitPrice = priceAfterProductDiscount - discount;
        }

        const totalPrice = unitPrice * soldAmount;
        const finalPrice = totalPrice;

        // Random date within last 30 days
        const daysAgo = Math.floor(Math.random() * 30);
        const saleDate = new Date();
        saleDate.setDate(saleDate.getDate() - daysAgo);
        saleDate.setHours(Math.floor(Math.random() * 12) + 8); // Between 8 AM and 8 PM
        saleDate.setMinutes(Math.floor(Math.random() * 60));

        // Create sale
        const sale = await addSale({
          productId: String(product.id),
          product: product as unknown as Product,
          saleType,
          quantity,
          weight: weight || undefined,
          weightUnit: (product.weightUnit as 'kg' | 'g' | undefined) || undefined,
          unitPrice,
          totalPrice,
          discount,
          finalPrice,
          customerName: customerName || undefined,
          paymentMethod,
          debtCustomerId: debtCustomerId,
        });

        createdSales.push(sale);
        salesAdded++;

        // Small delay to ensure unique timestamps
        await new Promise(resolve => setTimeout(resolve, 2));
      } catch (error) {
        console.error(`Error creating sale ${i + 1}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `تم إضافة ${salesAdded} عملية بيع بنجاح!`,
      data: {
        salesCount: salesAdded,
        saleIds: createdSales.map(s => s.id),
      },
    });
  } catch (error) {
    console.error('Error seeding sales:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'فشل إضافة عمليات البيع',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

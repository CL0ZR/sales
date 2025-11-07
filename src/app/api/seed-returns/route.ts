import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { addReturn } from '@/lib/queries/returns';

export async function POST() {
  try {
    const db = getDatabase();

    // Get all sales
    const sales = db.prepare('SELECT * FROM sales ORDER BY saleDate DESC').all() as Array<Record<string, unknown>>;

    if (sales.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'لا توجد عمليات بيع في قاعدة البيانات. الرجاء إضافة مبيعات تجريبية أولاً.',
      });
    }

    if (sales.length < 30) {
      return NextResponse.json({
        success: false,
        message: `يوجد فقط ${sales.length} عملية بيع. يجب أن يكون هناك على الأقل 30 عملية بيع لإنشاء 30 إرجاع.`,
      });
    }

    const returnReasons = [
      'منتج معيب',
      'لا يناسب الحجم',
      'طلب خاطئ',
      'تغيير رأي العميل',
      'منتج تالف',
      'جودة غير مرضية',
      'وصل متأخر',
      'مواصفات غير صحيحة',
      'سعر أقل في مكان آخر',
      'غير راضي عن المنتج',
    ];

    const users = ['أحمد المدير', 'سارة المساعدة', 'محمد المساعد', 'فاطمة الصراف', 'علي الصراف'];

    let returnsAdded = 0;
    const createdReturns = [];

    // Randomly shuffle sales and take 40 to create 30 returns from them
    // This ensures returns are distributed across different product types
    const shuffledSales = sales.sort(() => 0.5 - Math.random());
    const salesToReturn = shuffledSales.slice(0, Math.min(40, sales.length));

    // Create 30 returns
    for (let i = 0; i < 30 && i < salesToReturn.length; i++) {
      try {
        const sale = salesToReturn[i];

        // Get product details
        const product = db.prepare('SELECT * FROM products WHERE id = ?').get(sale.productId) as Record<string, unknown> | undefined;

        if (!product) {
          console.error(`Product not found for sale ${sale.id}`);
          continue;
        }

        // Determine return quantity/weight
        let returnedQuantity = 0;
        let returnedWeight = 0;
        let returnedAmount = 0;

        const saleQuantity = Number(sale.quantity) || 0;
        const saleWeight = Number(sale.weight) || 0;

        if (saleQuantity > 0) {
          // Quantity-based: return 50-100% of the sold quantity
          const returnPercentage = Math.random() * 0.5 + 0.5; // 50% to 100%
          returnedQuantity = Math.max(1, Math.floor(saleQuantity * returnPercentage));
          returnedAmount = returnedQuantity;
        } else if (saleWeight > 0) {
          // Weight-based: return 50-100% of the sold weight
          const returnPercentage = Math.random() * 0.5 + 0.5; // 50% to 100%
          returnedWeight = Math.round(saleWeight * returnPercentage * 100) / 100;
          returnedAmount = returnedWeight;
        }

        // Calculate refund
        const unitPrice = Number(sale.unitPrice) || 0;
        const totalRefund = unitPrice * returnedAmount;

        // Random reason
        const reason = returnReasons[Math.floor(Math.random() * returnReasons.length)];

        // Random processor
        const processedBy = users[Math.floor(Math.random() * users.length)];

        // Return date is 1-7 days after sale date
        const saleDate = new Date(String(sale.saleDate));
        const daysAfter = Math.floor(Math.random() * 7) + 1;
        const returnDate = new Date(saleDate);
        returnDate.setDate(returnDate.getDate() + daysAfter);
        returnDate.setHours(Math.floor(Math.random() * 12) + 8);
        returnDate.setMinutes(Math.floor(Math.random() * 60));

        // Create return
        const returnRecord = await addReturn({
          saleId: String(sale.id),
          productId: String(sale.productId),
          returnedQuantity,
          returnedWeight: returnedWeight || undefined,
          weightUnit: (sale.weightUnit as 'kg' | 'g' | undefined) || undefined,
          unitPrice,
          totalRefund,
          reason,
          processedBy,
        });

        createdReturns.push(returnRecord);
        returnsAdded++;

        // Small delay
        await new Promise(resolve => setTimeout(resolve, 2));
      } catch (error) {
        console.error(`Error creating return ${i + 1}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `تم إضافة ${returnsAdded} عملية إرجاع بنجاح!`,
      data: {
        returnsCount: returnsAdded,
        returnIds: createdReturns.map(r => r.id),
      },
    });
  } catch (error) {
    console.error('Error seeding returns:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'فشل إضافة عمليات الإرجاع',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

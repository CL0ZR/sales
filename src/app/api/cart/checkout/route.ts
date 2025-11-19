import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { addSale, updateSale } from '@/lib/queries/sales';
import { createDebt } from '@/lib/queries/debts';
import { getProductById, updateProduct } from '@/lib/queries/products';
import { reduceStock } from '@/utils/measurement';
import { SaleType } from '@/types';

interface CartCheckoutItem {
  productId: string;
  quantity: number;
  weight?: number;
  unitPrice: number;
  discount: number;
  saleType: SaleType;
}

interface CheckoutRequest {
  items: CartCheckoutItem[];
  transactionId: string;
  paymentMethod: 'cash' | 'debt';
  debtCustomerId?: string;
  customerName?: string;
  currency: 'IQD' | 'USD';
}

export async function POST(request: NextRequest) {
  try {
    const checkoutData: CheckoutRequest = await request.json();
    const { items, transactionId, paymentMethod, debtCustomerId, customerName, currency } = checkoutData;

    console.log('📦 Received cart checkout:', {
      itemCount: items.length,
      transactionId,
      paymentMethod,
      debtCustomerId,
    });

    // Validate
    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'السلة فارغة' },
        { status: 400 }
      );
    }

    if (paymentMethod === 'debt' && !debtCustomerId) {
      return NextResponse.json(
        { error: 'يجب اختيار عميل من دفتر الديون للبيع الآجل' },
        { status: 400 }
      );
    }

    const db = getDatabase();

    // Use transaction for atomic operation
    const transaction = db.transaction(() => {
      const createdSales: string[] = [];
      let totalAmount = 0;

      // Process each item
      for (const item of items) {
        const product = getProductById(item.productId);

        if (!product) {
          throw new Error(`المنتج غير موجود: ${item.productId}`);
        }

        // Validate stock
        if (product.measurementType === 'quantity') {
          if (item.quantity > product.quantity) {
            throw new Error(`مخزون غير كافي للمنتج: ${product.name}`);
          }
        } else {
          if ((item.weight || 0) > (product.weight || 0)) {
            throw new Error(`مخزون غير كافي للمنتج: ${product.name}`);
          }
        }

        // Calculate prices
        const amount = product.measurementType === 'quantity' ? item.quantity : (item.weight || 0);
        const totalPrice = item.unitPrice * amount;
        const finalPrice = totalPrice - item.discount;

        // Create sale record
        const saleData = {
          productId: product.id,
          product,
          saleType: item.saleType,
          quantity: item.quantity,
          weight: item.weight,
          weightUnit: product.weightUnit,
          unitPrice: item.unitPrice,
          totalPrice,
          discount: item.discount,
          finalPrice,
          customerName: customerName || '',
          paymentMethod,
          debtCustomerId: paymentMethod === 'debt' ? debtCustomerId : undefined,
          transactionId, // Link all sales with same transaction ID
        };

        const newSale = addSale(saleData);
        createdSales.push(newSale.id);
        totalAmount += finalPrice;

        // Update product stock
        const soldAmount = product.measurementType === 'quantity' ? item.quantity : (item.weight || 0);
        const updatedProduct = reduceStock(product, soldAmount);
        updateProduct(updatedProduct);

        console.log(`✅ Sale created: ${newSale.id} for product ${product.name}`);
      }

      // If debt payment, create one debt record for total amount
      let debtId: string | undefined;
      if (paymentMethod === 'debt' && debtCustomerId) {
        const debt = createDebt({
          saleId: createdSales[0], // Link to first sale in transaction
          customerId: debtCustomerId,
          totalAmount,
          amountPaid: 0,
          amountRemaining: totalAmount,
          status: 'unpaid',
          dueDate: undefined,
        });

        debtId = debt.id;

        // Update all sales with the debt ID
        for (const saleId of createdSales) {
          updateSale(saleId, { debtId });
        }

        console.log(`💳 Debt created: ${debtId} for ${totalAmount}`);
      }

      return {
        success: true,
        transactionId,
        salesCount: createdSales.length,
        totalAmount,
        debtId,
      };
    });

    // Execute transaction
    const result = transaction();

    console.log('✅ Cart checkout completed:', result);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('❌ Error processing cart checkout:', error);
    return NextResponse.json(
      {
        error: 'فشل في معالجة عملية البيع',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

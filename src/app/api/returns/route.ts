import { NextRequest, NextResponse } from 'next/server';
import { getAllReturns, addReturn, getReturnsByDateRange } from '@/lib/queries/returns';
import { getSaleById } from '@/lib/queries/sales';
import { getProductById, updateProduct } from '@/lib/queries/products';
import { increaseStock } from '@/utils/measurement';
import { Return } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let returns;
    if (startDate && endDate) {
      returns = getReturnsByDateRange(new Date(startDate), new Date(endDate));
    } else {
      returns = getAllReturns();
    }

    return NextResponse.json(returns);
  } catch (error) {
    console.error('Error fetching returns:', error);
    return NextResponse.json({ error: 'Failed to fetch returns' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const returnData = await request.json();

    // Validate required fields
    if (!returnData.saleId || !returnData.productId) {
      return NextResponse.json(
        { error: 'Sale ID and Product ID are required' },
        { status: 400 }
      );
    }

    // Get the original sale
    const sale = getSaleById(returnData.saleId);
    if (!sale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
    }

    // Get the product
    const product = getProductById(returnData.productId);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Validate the product matches the sale
    if (sale.productId !== returnData.productId) {
      return NextResponse.json(
        { error: 'Product does not match the sale' },
        { status: 400 }
      );
    }

    // Determine returned amount based on measurement type
    const returnedAmount = product.measurementType === 'quantity'
      ? returnData.returnedQuantity
      : returnData.returnedWeight;

    const originalAmount = product.measurementType === 'quantity'
      ? sale.quantity
      : (sale.weight || 0);

    // Validate returned amount
    if (!returnedAmount || returnedAmount <= 0) {
      return NextResponse.json(
        { error: 'Return amount must be greater than zero' },
        { status: 400 }
      );
    }

    if (returnedAmount > originalAmount) {
      return NextResponse.json(
        { error: 'Cannot return more than the original sale amount' },
        { status: 400 }
      );
    }

    // Calculate refund amount
    const totalRefund = returnData.unitPrice * returnedAmount;

    // Prepare return data
    const newReturnData: Omit<Return, 'id' | 'returnDate' | 'product'> = {
      saleId: returnData.saleId,
      productId: returnData.productId,
      returnedQuantity: product.measurementType === 'quantity' ? returnedAmount : 0,
      returnedWeight: product.measurementType === 'weight' ? returnedAmount : undefined,
      weightUnit: product.measurementType === 'weight' ? product.weightUnit : undefined,
      unitPrice: returnData.unitPrice || sale.unitPrice,
      totalRefund,
      reason: returnData.reason,
      processedBy: returnData.processedBy,
    };

    // Add return to database
    const newReturn = addReturn(newReturnData);

    // Restore inventory
    const updatedProduct = increaseStock(product, returnedAmount);
    updateProduct(updatedProduct);

    return NextResponse.json(newReturn, { status: 201 });
  } catch (error) {
    console.error('Error processing return:', error);
    return NextResponse.json({ error: 'Failed to process return' }, { status: 500 });
  }
}

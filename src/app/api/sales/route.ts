import { NextRequest, NextResponse } from 'next/server';
import { getAllSales, addSale, updateSale, deleteSale } from '@/lib/queries/sales';
import { Sale } from '@/types';

export async function GET() {
  try {
    const sales = getAllSales();
    return NextResponse.json(sales);
  } catch (error) {
    console.error('Error fetching sales:', error);
    return NextResponse.json({ error: 'Failed to fetch sales' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const saleData = await request.json();

    console.log('📥 Received sale data:', {
      paymentMethod: saleData.paymentMethod,
      debtCustomerId: saleData.debtCustomerId,
      productId: saleData.productId,
    });

    // Validate debt sales have a customer ID
    if (saleData.paymentMethod === 'debt' && !saleData.debtCustomerId) {
      return NextResponse.json(
        { error: 'يجب اختيار عميل من دفتر الديون للبيع الآجل' },
        { status: 400 }
      );
    }

    const newSale = addSale(saleData);
    return NextResponse.json(newSale, { status: 201 });
  } catch (error) {
    console.error('❌ Error adding sale:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    if (error instanceof Error && 'code' in error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      console.error('Error code:', (error as any).code);
    }
    return NextResponse.json({
      error: 'Failed to add sale',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { saleId, updates } = await request.json();

    if (!saleId) {
      return NextResponse.json({ error: 'Sale ID is required' }, { status: 400 });
    }

    const updatedSale = updateSale(saleId, updates);
    if (updatedSale) {
      return NextResponse.json(updatedSale);
    } else {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error updating sale:', error);
    return NextResponse.json({ error: 'Failed to update sale' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Sale ID is required' }, { status: 400 });
    }

    const deleted = deleteSale(id);
    if (deleted) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error deleting sale:', error);
    return NextResponse.json({ error: 'Failed to delete sale' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getAllSales, addSale, deleteSale } from '@/lib/queries/sales';
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
    const newSale = addSale(saleData);
    return NextResponse.json(newSale, { status: 201 });
  } catch (error) {
    console.error('Error adding sale:', error);
    return NextResponse.json({ error: 'Failed to add sale' }, { status: 500 });
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

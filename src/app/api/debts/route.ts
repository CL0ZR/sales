import { NextRequest, NextResponse } from 'next/server';
import {
  getAllDebts,
  getDebtsByCustomer,
  createDebt,
  updateDebt,
  deleteDebt,
  getDebtStatistics,
} from '@/lib/queries/debts';
import { Debt } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const stats = searchParams.get('stats');

    if (stats === 'true') {
      const statistics = getDebtStatistics();
      return NextResponse.json(statistics);
    }

    if (customerId) {
      const debts = getDebtsByCustomer(customerId);
      return NextResponse.json(debts);
    }

    const debts = getAllDebts();
    return NextResponse.json(debts);
  } catch (error) {
    console.error('Error fetching debts:', error);
    return NextResponse.json({ error: 'Failed to fetch debts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const debt = createDebt(body);
    return NextResponse.json(debt);
  } catch (error) {
    console.error('Error creating debt:', error);
    return NextResponse.json({ error: 'Failed to create debt' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body: Debt = await request.json();
    const debt = updateDebt(body);
    return NextResponse.json(debt);
  } catch (error) {
    console.error('Error updating debt:', error);
    return NextResponse.json({ error: 'Failed to update debt' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Debt ID is required' }, { status: 400 });
    }

    const success = deleteDebt(id);
    if (!success) {
      return NextResponse.json({ error: 'Debt not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting debt:', error);
    return NextResponse.json({ error: 'Failed to delete debt' }, { status: 500 });
  }
}

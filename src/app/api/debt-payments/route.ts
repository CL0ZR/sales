import { NextRequest, NextResponse } from 'next/server';
import {
  getPaymentsByDebt,
  createDebtPayment,
} from '@/lib/queries/debts';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const debtId = searchParams.get('debtId');

    if (!debtId) {
      return NextResponse.json({ error: 'Debt ID is required' }, { status: 400 });
    }

    const payments = getPaymentsByDebt(debtId);
    return NextResponse.json(payments);
  } catch (error) {
    console.error('Error fetching debt payments:', error);
    return NextResponse.json({ error: 'Failed to fetch debt payments' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const payment = createDebtPayment(body);
    return NextResponse.json(payment);
  } catch (error) {
    console.error('Error creating debt payment:', error);
    return NextResponse.json({ error: 'Failed to create debt payment' }, { status: 500 });
  }
}

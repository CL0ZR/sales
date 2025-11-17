import { NextRequest, NextResponse } from 'next/server';
import {
  getAllDebtCustomers,
  createDebtCustomer,
  updateDebtCustomer,
  deleteDebtCustomer,
} from '@/lib/queries/debts';
import { DebtCustomer } from '@/types';

export async function GET() {
  try {
    const customers = getAllDebtCustomers();
    return NextResponse.json(customers);
  } catch (error) {
    console.error('Error fetching debt customers:', error);
    return NextResponse.json({ error: 'Failed to fetch debt customers' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const customer = createDebtCustomer(body);
    return NextResponse.json(customer);
  } catch (error) {
    console.error('Error creating debt customer:', error);
    return NextResponse.json({ error: 'Failed to create debt customer' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body: DebtCustomer = await request.json();
    const customer = updateDebtCustomer(body);
    return NextResponse.json(customer);
  } catch (error) {
    console.error('Error updating debt customer:', error);
    return NextResponse.json({ error: 'Failed to update debt customer' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
    }

    const success = deleteDebtCustomer(id);
    if (!success) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete debt customer';
    console.error('Error deleting debt customer:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

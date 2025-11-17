import { getDatabase } from '@/lib/database';
import { DebtCustomer, Debt, DebtPayment, DebtStatus } from '@/types';

// ==================== Debt Customers ====================

// Get all debt customers
export function getAllDebtCustomers(): DebtCustomer[] {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM debt_customers ORDER BY createdAt DESC');
  const rows = stmt.all() as Record<string, unknown>[];

  return rows.map(row => ({
    ...(row as object),
    createdAt: new Date(row.createdAt as string),
    updatedAt: new Date(row.updatedAt as string),
  })) as DebtCustomer[];
}

// Get debt customer by ID
export function getDebtCustomerById(id: string): DebtCustomer | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM debt_customers WHERE id = ?');
  const row = stmt.get(id) as Record<string, unknown> | undefined;

  if (!row) return null;

  return {
    ...(row as object),
    createdAt: new Date(row.createdAt as string),
    updatedAt: new Date(row.updatedAt as string),
  } as DebtCustomer;
}

// Create debt customer
export function createDebtCustomer(customer: Omit<DebtCustomer, 'id' | 'createdAt' | 'updatedAt'>): DebtCustomer {
  const db = getDatabase();
  const id = Date.now().toString();
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO debt_customers (id, name, phone, address, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  stmt.run(id, customer.name, customer.phone, customer.address || null, now, now);

  return {
    ...customer,
    id,
    createdAt: new Date(now),
    updatedAt: new Date(now),
  };
}

// Update debt customer
export function updateDebtCustomer(customer: DebtCustomer): DebtCustomer {
  const db = getDatabase();
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    UPDATE debt_customers
    SET name = ?, phone = ?, address = ?, updatedAt = ?
    WHERE id = ?
  `);

  stmt.run(customer.name, customer.phone, customer.address || null, now, customer.id);

  return {
    ...customer,
    updatedAt: new Date(now),
  };
}

// Delete debt customer
export function deleteDebtCustomer(id: string): boolean {
  const db = getDatabase();

  // Check if customer has any debts
  const checkStmt = db.prepare('SELECT COUNT(*) as count FROM debts WHERE customerId = ?');
  const result = checkStmt.get(id) as { count: number };

  if (result.count > 0) {
    throw new Error('Cannot delete customer with existing debts');
  }

  const stmt = db.prepare('DELETE FROM debt_customers WHERE id = ?');
  const info = stmt.run(id);

  return info.changes > 0;
}

// ==================== Debts ====================

// Get all debts
export function getAllDebts(): Debt[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT
      d.*,
      dc.name as customerName,
      dc.phone as customerPhone,
      s.productId, s.customerName as saleCustomerName, s.finalPrice as saleFinalPrice
    FROM debts d
    LEFT JOIN debt_customers dc ON d.customerId = dc.id
    LEFT JOIN sales s ON d.saleId = s.id
    ORDER BY d.createdAt DESC
  `);
  const rows = stmt.all() as Record<string, unknown>[];

  return rows.map(row => ({
    id: row.id,
    saleId: row.saleId,
    customerId: row.customerId,
    totalAmount: row.totalAmount,
    amountPaid: row.amountPaid,
    amountRemaining: row.amountRemaining,
    status: row.status,
    dueDate: row.dueDate ? new Date(row.dueDate as string) : undefined,
    createdAt: new Date(row.createdAt as string),
    updatedAt: new Date(row.updatedAt as string),
    customer: row.customerName ? {
      id: row.customerId as string,
      name: row.customerName as string,
      phone: row.customerPhone as string,
      address: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    } : undefined,
  })) as Debt[];
}

// Get debt by ID
export function getDebtById(id: string): Debt | null {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT
      d.*,
      dc.name as customerName,
      dc.phone as customerPhone,
      dc.address as customerAddress
    FROM debts d
    LEFT JOIN debt_customers dc ON d.customerId = dc.id
    WHERE d.id = ?
  `);
  const row = stmt.get(id) as Record<string, unknown> | undefined;

  if (!row) return null;

  return {
    id: row.id,
    saleId: row.saleId,
    customerId: row.customerId,
    totalAmount: row.totalAmount,
    amountPaid: row.amountPaid,
    amountRemaining: row.amountRemaining,
    status: row.status,
    dueDate: row.dueDate ? new Date(row.dueDate as string) : undefined,
    createdAt: new Date(row.createdAt as string),
    updatedAt: new Date(row.updatedAt as string),
    customer: row.customerName ? {
      id: row.customerId as string,
      name: row.customerName as string,
      phone: row.customerPhone as string,
      address: row.customerAddress as string | undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    } : undefined,
  } as Debt;
}

// Get debts by customer ID
export function getDebtsByCustomer(customerId: string): Debt[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT * FROM debts
    WHERE customerId = ?
    ORDER BY createdAt DESC
  `);
  const rows = stmt.all(customerId) as Record<string, unknown>[];

  return rows.map(row => ({
    ...(row as object),
    dueDate: row.dueDate ? new Date(row.dueDate as string) : undefined,
    createdAt: new Date(row.createdAt as string),
    updatedAt: new Date(row.updatedAt as string),
  })) as Debt[];
}

// Get debt by sale ID
export function getDebtBySaleId(saleId: string): Debt | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM debts WHERE saleId = ?');
  const row = stmt.get(saleId) as Record<string, unknown> | undefined;

  if (!row) return null;

  return {
    ...(row as object),
    dueDate: row.dueDate ? new Date(row.dueDate as string) : undefined,
    createdAt: new Date(row.createdAt as string),
    updatedAt: new Date(row.updatedAt as string),
  } as Debt;
}

// Create debt
export function createDebt(debt: Omit<Debt, 'id' | 'createdAt' | 'updatedAt' | 'customer' | 'sale'>): Debt {
  const db = getDatabase();
  const id = Date.now().toString();
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO debts (
      id, saleId, customerId, totalAmount, amountPaid, amountRemaining,
      status, dueDate, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    debt.saleId,
    debt.customerId,
    debt.totalAmount,
    debt.amountPaid,
    debt.amountRemaining,
    debt.status,
    debt.dueDate ? debt.dueDate.toISOString() : null,
    now,
    now
  );

  return {
    ...debt,
    id,
    createdAt: new Date(now),
    updatedAt: new Date(now),
  };
}

// Update debt
export function updateDebt(debt: Omit<Debt, 'customer' | 'sale'>): Debt {
  const db = getDatabase();
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    UPDATE debts
    SET amountPaid = ?, amountRemaining = ?, status = ?, dueDate = ?, updatedAt = ?
    WHERE id = ?
  `);

  stmt.run(
    debt.amountPaid,
    debt.amountRemaining,
    debt.status,
    debt.dueDate ? debt.dueDate.toISOString() : null,
    now,
    debt.id
  );

  return {
    ...debt,
    updatedAt: new Date(now),
  };
}

// Delete debt
export function deleteDebt(id: string): boolean {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM debts WHERE id = ?');
  const info = stmt.run(id);

  return info.changes > 0;
}

// ==================== Debt Payments ====================

// Get all payments for a debt
export function getPaymentsByDebt(debtId: string): DebtPayment[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT * FROM debt_payments
    WHERE debtId = ?
    ORDER BY paymentDate DESC
  `);
  const rows = stmt.all(debtId) as Record<string, unknown>[];

  return rows.map(row => ({
    ...(row as object),
    paymentDate: new Date(row.paymentDate as string),
  })) as DebtPayment[];
}

// Create debt payment
export function createDebtPayment(payment: Omit<DebtPayment, 'id'>): DebtPayment {
  const db = getDatabase();
  const id = Date.now().toString();
  const now = new Date().toISOString();

  // Start transaction
  const insertPayment = db.prepare(`
    INSERT INTO debt_payments (id, debtId, amount, paymentDate, paymentMethod, notes, createdBy)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const updateDebt = db.prepare(`
    UPDATE debts
    SET amountPaid = amountPaid + ?,
        amountRemaining = amountRemaining - ?,
        status = CASE
          WHEN amountRemaining - ? <= 0 THEN 'paid'
          WHEN amountPaid + ? > 0 THEN 'partial'
          ELSE 'unpaid'
        END,
        updatedAt = ?
    WHERE id = ?
  `);

  const transaction = db.transaction(() => {
    insertPayment.run(
      id,
      payment.debtId,
      payment.amount,
      payment.paymentDate ? payment.paymentDate.toISOString() : now,
      payment.paymentMethod,
      payment.notes || null,
      payment.createdBy || null
    );

    updateDebt.run(
      payment.amount,
      payment.amount,
      payment.amount,
      payment.amount,
      now,
      payment.debtId
    );
  });

  transaction();

  return {
    ...payment,
    id,
    paymentDate: payment.paymentDate || new Date(now),
  };
}

// ==================== Statistics ====================

// Get debt statistics
export function getDebtStatistics() {
  const db = getDatabase();

  // Total debts and amounts
  const totalsStmt = db.prepare(`
    SELECT
      COUNT(*) as totalDebts,
      COUNT(DISTINCT customerId) as totalDebtors,
      SUM(totalAmount) as totalAmount,
      SUM(amountPaid) as totalPaid,
      SUM(amountRemaining) as totalRemaining
    FROM debts
  `);
  const totals = totalsStmt.get() as {
    totalDebts: number;
    totalDebtors: number;
    totalAmount: number;
    totalPaid: number;
    totalRemaining: number;
  };

  // Status breakdown
  const statusStmt = db.prepare(`
    SELECT
      status,
      COUNT(*) as count,
      SUM(amountRemaining) as totalRemaining
    FROM debts
    GROUP BY status
  `);
  const statusBreakdown = statusStmt.all() as Array<{
    status: DebtStatus;
    count: number;
    totalRemaining: number;
  }>;

  // Overdue debts (if dueDate is in the past and status is not 'paid')
  const overdueStmt = db.prepare(`
    SELECT COUNT(*) as count, SUM(amountRemaining) as totalRemaining
    FROM debts
    WHERE dueDate < datetime('now') AND status != 'paid'
  `);
  const overdue = overdueStmt.get() as {
    count: number;
    totalRemaining: number;
  };

  return {
    totalDebts: totals.totalDebts,
    totalDebtors: totals.totalDebtors,
    totalAmount: totals.totalAmount || 0,
    totalPaid: totals.totalPaid || 0,
    totalRemaining: totals.totalRemaining || 0,
    statusBreakdown,
    overdueCount: overdue.count || 0,
    overdueAmount: overdue.totalRemaining || 0,
  };
}

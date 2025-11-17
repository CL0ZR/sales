import { Sale, Product, Return } from '@/types';

/**
 * Validate if a return amount is valid for a given sale
 */
export function validateReturnAmount(
  sale: Sale,
  returnAmount: number,
  existingReturns: Return[] = []
): { valid: boolean; error?: string; maxAllowed?: number } {
  if (returnAmount <= 0) {
    return { valid: false, error: 'يجب أن تكون كمية الإرجاع أكبر من الصفر' };
  }

  // Get the original sale amount
  const originalAmount = sale.product.measurementType === 'quantity'
    ? sale.quantity
    : sale.weight || 0;

  // Calculate already returned amount for this sale
  const alreadyReturned = existingReturns
    .filter(r => r.saleId === sale.id)
    .reduce((total, r) => {
      const returnedAmt = sale.product.measurementType === 'quantity'
        ? r.returnedQuantity
        : r.returnedWeight || 0;
      return total + returnedAmt;
    }, 0);

  const maxAllowed = originalAmount - alreadyReturned;

  if (returnAmount > maxAllowed) {
    return {
      valid: false,
      error: `لا يمكن إرجاع أكثر من ${maxAllowed} ${sale.product.measurementType === 'quantity' ? 'قطعة' : sale.product.weightUnit}. (تم إرجاع ${alreadyReturned} من هذه المبيعة)`,
      maxAllowed,
    };
  }

  // Additional validation for quantity-based products
  if (sale.product.measurementType === 'quantity' && !Number.isInteger(returnAmount)) {
    return { valid: false, error: 'يجب أن تكون الكمية رقماً صحيحاً' };
  }

  return { valid: true, maxAllowed };
}

/**
 * Calculate refund amount for a return
 */
export function calculateReturnRefund(
  sale: Sale,
  returnAmount: number
): number {
  return sale.unitPrice * returnAmount;
}

/**
 * Get returnable sales for a product
 * Filters sales that haven't been fully returned
 */
export function getReturnableSales(
  sales: Sale[],
  productId: string,
  allReturns: Return[] = []
): Sale[] {
  return sales
    .filter(sale => sale.productId === productId)
    .filter(sale => {
      // Calculate how much has been returned from this sale
      const alreadyReturned = allReturns
        .filter(r => r.saleId === sale.id)
        .reduce((total, r) => {
          const returnedAmt = sale.product.measurementType === 'quantity'
            ? r.returnedQuantity
            : r.returnedWeight || 0;
          return total + returnedAmt;
        }, 0);

      const originalAmount = sale.product.measurementType === 'quantity'
        ? sale.quantity
        : sale.weight || 0;

      // Only include sales that haven't been fully returned
      return alreadyReturned < originalAmount;
    })
    .sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime()); // Most recent first
}

/**
 * Get remaining returnable amount for a specific sale
 */
export function getRemainingSaleAmount(
  sale: Sale,
  allReturns: Return[] = []
): number {
  const originalAmount = sale.product.measurementType === 'quantity'
    ? sale.quantity
    : sale.weight || 0;

  const alreadyReturned = allReturns
    .filter(r => r.saleId === sale.id)
    .reduce((total, r) => {
      const returnedAmt = sale.product.measurementType === 'quantity'
        ? r.returnedQuantity
        : r.returnedWeight || 0;
      return total + returnedAmt;
    }, 0);

  return originalAmount - alreadyReturned;
}

/**
 * Check if a sale can be returned
 */
export function canReturnSale(
  sale: Sale,
  allReturns: Return[] = []
): boolean {
  return getRemainingSaleAmount(sale, allReturns) > 0;
}

/**
 * Format return amount with unit
 */
export function formatReturnAmount(product: Product, amount: number): string {
  if (product.measurementType === 'quantity') {
    return `${amount} قطعة`;
  } else {
    return `${amount} ${product.weightUnit}`;
  }
}

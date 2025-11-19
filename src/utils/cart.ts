import { CartItem, Product, SaleType } from '@/types';

const CART_STORAGE_KEY = 'shopping_cart_session';

/**
 * Generate a unique transaction ID for batch checkout
 */
export function generateTransactionId(): string {
  return `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
}

/**
 * Generate a unique cart item ID
 */
export function generateCartItemId(): string {
  return `CART-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Calculate the total price for a single cart item
 */
export function calculateItemTotal(item: CartItem): number {
  const amount = item.product.measurementType === 'quantity'
    ? item.quantity
    : (item.weight || 0);

  const subtotal = item.unitPrice * amount;
  const total = subtotal - item.discount;

  return Math.max(0, total); // Ensure never negative
}

/**
 * Calculate the grand total for all items in cart
 */
export function calculateCartTotal(items: CartItem[]): number {
  return items.reduce((total, item) => total + calculateItemTotal(item), 0);
}

/**
 * Validate cart item data
 */
export function validateCartItem(item: CartItem): { valid: boolean; error?: string } {
  // Check if product exists
  if (!item.product) {
    return { valid: false, error: 'المنتج مطلوب' };
  }

  // Check quantity/weight based on measurement type
  if (item.product.measurementType === 'quantity') {
    if (!item.quantity || item.quantity <= 0) {
      return { valid: false, error: 'الكمية يجب أن تكون أكبر من صفر' };
    }
    if (!Number.isInteger(item.quantity)) {
      return { valid: false, error: 'الكمية يجب أن تكون رقم صحيح' };
    }
    // Check if enough stock
    if (item.quantity > item.product.quantity) {
      return { valid: false, error: 'المخزون غير كافي' };
    }
  } else {
    // Weight-based product
    if (!item.weight || item.weight <= 0) {
      return { valid: false, error: 'الوزن يجب أن يكون أكبر من صفر' };
    }
    // Check if enough stock
    if (item.weight > (item.product.weight || 0)) {
      return { valid: false, error: 'المخزون غير كافي' };
    }
  }

  // Check unit price
  if (!item.unitPrice || item.unitPrice < 0) {
    return { valid: false, error: 'سعر الوحدة غير صحيح' };
  }

  // Check discount
  if (item.discount < 0) {
    return { valid: false, error: 'الخصم لا يمكن أن يكون سالب' };
  }

  const subtotal = item.unitPrice * (item.quantity || item.weight || 0);
  if (item.discount > subtotal) {
    return { valid: false, error: 'الخصم لا يمكن أن يكون أكبر من المجموع الفرعي' };
  }

  return { valid: true };
}

/**
 * Validate all items have sufficient stock
 */
export function validateAllStock(items: CartItem[]): { valid: boolean; error?: string } {
  for (const item of items) {
    const validation = validateCartItem(item);
    if (!validation.valid) {
      return { valid: false, error: `${item.product.name}: ${validation.error}` };
    }
  }
  return { valid: true };
}

/**
 * Check if cart is empty
 */
export function isCartEmpty(items: CartItem[]): boolean {
  return items.length === 0;
}

/**
 * Get total item count in cart
 */
export function getCartItemCount(items: CartItem[]): number {
  return items.length;
}

/**
 * Find item in cart by cart item ID
 */
export function findCartItem(items: CartItem[], cartItemId: string): CartItem | undefined {
  return items.find(item => item.id === cartItemId);
}

/**
 * Check if product already exists in cart
 */
export function isProductInCart(items: CartItem[], productId: string): boolean {
  return items.some(item => item.product.id === productId);
}

/**
 * Save cart to sessionStorage
 */
export function saveCartToStorage(items: CartItem[]): void {
  try {
    sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Failed to save cart to sessionStorage:', error);
  }
}

/**
 * Load cart from sessionStorage
 */
export function loadCartFromStorage(): CartItem[] {
  try {
    const saved = sessionStorage.getItem(CART_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Failed to load cart from sessionStorage:', error);
  }
  return [];
}

/**
 * Clear cart from sessionStorage
 */
export function clearCartStorage(): void {
  try {
    sessionStorage.removeItem(CART_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear cart from sessionStorage:', error);
  }
}

/**
 * Add product to cart with default values
 */
export function createCartItem(
  product: Product,
  saleType: SaleType,
  quantity: number = 1,
  weight?: number,
  discount: number = 0
): CartItem {
  const unitPrice = saleType === 'retail' ? product.salePrice : product.wholesalePrice;

  return {
    id: generateCartItemId(),
    product,
    quantity,
    weight,
    unitPrice,
    discount,
    saleType,
  };
}

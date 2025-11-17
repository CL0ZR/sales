import { Product, MeasurementType, WeightUnit, WEIGHT_UNITS, MEASUREMENT_TYPES } from '@/types';

/**
 * تنسيق القيمة القياسية (كمية أو وزن) للعرض
 */
export function formatMeasurement(
  product: Product,
  value?: number,
  showUnit: boolean = true
): string {
  if (product.measurementType === 'quantity') {
    const qty = value ?? product.quantity;
    return showUnit ? `${qty} قطعة` : `${qty}`;
  } else {
    const weight = value ?? product.weight ?? 0;
    const unit = product.weightUnit || 'kg';
    const unitSymbol = WEIGHT_UNITS[unit].symbol;
    return showUnit ? `${weight} ${unitSymbol}` : `${weight}`;
  }
}

/**
 * الحصول على رمز الوحدة
 */
export function getMeasurementUnit(product: Product): string {
  if (product.measurementType === 'quantity') {
    return 'pcs';
  } else {
    return WEIGHT_UNITS[product.weightUnit || 'kg'].symbol;
  }
}

/**
 * تحويل الوزن من وحدة إلى أخرى
 */
export function convertWeight(
  value: number,
  fromUnit: WeightUnit,
  toUnit: WeightUnit
): number {
  if (fromUnit === toUnit) return value;

  // Convert to grams first
  const inGrams = fromUnit === 'kg' ? value * 1000 : value;

  // Convert to target unit
  return toUnit === 'kg' ? inGrams / 1000 : inGrams;
}

/**
 * مقارنة القيمة الحالية مع الحد الأدنى
 */
export function isLowStock(product: Product): boolean {
  if (product.measurementType === 'quantity') {
    return product.quantity <= product.minQuantity;
  } else {
    const currentWeight = product.weight ?? 0;
    const minWeight = product.minWeight ?? 0;
    return currentWeight <= minWeight;
  }
}

/**
 * التحقق من نفاد المخزون
 */
export function isOutOfStock(product: Product): boolean {
  if (product.measurementType === 'quantity') {
    return product.quantity === 0;
  } else {
    return (product.weight ?? 0) === 0;
  }
}

/**
 * الحصول على القيمة الحالية (كمية أو وزن)
 */
export function getCurrentStock(product: Product): number {
  return product.measurementType === 'quantity'
    ? product.quantity
    : product.weight ?? 0;
}

/**
 * الحصول على الحد الأدنى (كمية أو وزن)
 */
export function getMinStock(product: Product): number {
  return product.measurementType === 'quantity'
    ? product.minQuantity
    : product.minWeight ?? 0;
}

/**
 * التحقق من توفر الكمية/الوزن المطلوب
 */
export function isStockAvailable(product: Product, requestedAmount: number): boolean {
  const currentStock = getCurrentStock(product);
  return currentStock >= requestedAmount;
}

/**
 * التحقق من صحة القيمة المدخلة
 */
export function validateMeasurementValue(
  value: number,
  measurementType: MeasurementType
): { valid: boolean; error?: string } {
  if (value < 0) {
    return { valid: false, error: 'Value must be positive' };
  }

  if (measurementType === 'quantity' && !Number.isInteger(value)) {
    return { valid: false, error: 'Quantity must be a whole number' };
  }

  if (measurementType === 'weight' && value === 0) {
    return { valid: false, error: 'Weight must be greater than zero' };
  }

  return { valid: true };
}

/**
 * تقليل المخزون بعد البيع
 */
export function reduceStock(product: Product, soldAmount: number): Product {
  if (product.measurementType === 'quantity') {
    return {
      ...product,
      quantity: product.quantity - soldAmount,
      updatedAt: new Date(),
    };
  } else {
    return {
      ...product,
      weight: (product.weight ?? 0) - soldAmount,
      updatedAt: new Date(),
    };
  }
}

/**
 * زيادة المخزون (عند إضافة كمية جديدة)
 */
export function increaseStock(product: Product, addedAmount: number): Product {
  if (product.measurementType === 'quantity') {
    return {
      ...product,
      quantity: product.quantity + addedAmount,
      updatedAt: new Date(),
    };
  } else {
    return {
      ...product,
      weight: (product.weight ?? 0) + addedAmount,
      updatedAt: new Date(),
    };
  }
}

/**
 * الحصول على نص حالة المخزون
 */
export function getStockStatus(product: Product): {
  text: string;
  color: 'success' | 'warning' | 'danger';
} {
  if (isOutOfStock(product)) {
    return { text: 'إنتهى من المخزون', color: 'danger' };
  }

  if (isLowStock(product)) {
    return { text: 'قليل من المخزون', color: 'warning' };
  }

  return { text: 'متوفر', color: 'success' };
}

/**
 * الحصول على خطوة الإدخال (step) المناسبة
 */
export function getInputStep(measurementType: MeasurementType, weightUnit?: WeightUnit): string {
  if (measurementType === 'quantity') {
    return '1'; // Whole numbers only
  } else {
    // For weight, allow any decimal or whole number
    return 'any'; // Flexible input - allows 5, 5.5, 5.25, etc.
  }
}

/**
 * تنسيق رقم الوزن بدقة مناسبة
 */
export function formatWeight(weight: number, unit: WeightUnit): string {
  const precision = unit === 'g' ? 1 : 2;
  return weight.toFixed(precision);
}

export type Currency = 'IQD' | 'USD';

export interface CurrencyInfo {
  code: Currency;
  name: string;
  symbol: string;
  locale: string;
}

export type MeasurementType = 'quantity' | 'weight';
export type WeightUnit = 'kg' | 'g';

export interface MeasurementInfo {
  type: MeasurementType;
  unit?: WeightUnit;
  name: string;
  nameAr: string;
  symbol: string;
}

export const MEASUREMENT_TYPES: Record<MeasurementType, Omit<MeasurementInfo, 'unit' | 'type'>> = {
  quantity: {
    name: 'Quantity',
    nameAr: 'pcs',
    symbol: 'pcs',
  },
  weight: {
    name: 'Weight',
    nameAr: 'weight',
    symbol: '',
  },
};

export const WEIGHT_UNITS: Record<WeightUnit, MeasurementInfo> = {
  kg: {
    type: 'weight',
    unit: 'kg',
    name: 'Kilogram',
    nameAr: 'kg',
    symbol: 'kg',
  },
  g: {
    type: 'weight',
    unit: 'g',
    name: 'Gram',
    nameAr: 'g',
    symbol: 'g',
  },
};

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  wholesalePrice: number;
  wholesaleCostPrice?: number; // Purchase cost price for wholesale (profit = wholesalePrice - wholesaleCostPrice)
  salePrice: number;
  discount: number; // Fixed discount amount (not percentage)
  // Measurement fields
  measurementType: MeasurementType;
  // For quantity-based products
  quantity: number;
  minQuantity: number;
  // For weight-based products
  weightUnit?: WeightUnit;
  weight?: number;
  minWeight?: number;
  // Other fields
  barcode?: string;
  imageUrl?: string;
  currency: Currency;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  subcategories: Subcategory[];
}

export interface Subcategory {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
}

export type SaleType = 'retail' | 'wholesale';

export interface Sale {
  id: string;
  productId: string;
  product: Product;
  saleType: SaleType; // Type of sale: retail or wholesale
  // Quantity or weight sold
  quantity: number;
  weight?: number;
  weightUnit?: WeightUnit;
  // Pricing
  unitPrice: number;
  totalPrice: number;
  discount: number; // Fixed discount amount (not percentage)
  finalPrice: number;
  // Customer info
  customerName?: string;
  saleDate: Date;
  paymentMethod: 'cash' | 'debt';
  // Debt tracking
  debtCustomerId?: string;
  debtId?: string;
  transactionId?: string; // Links multiple sales from same cart checkout
}

// Shopping Cart Types
export interface CartItem {
  id: string; // Unique cart item ID
  product: Product;
  quantity: number;
  weight?: number;
  unitPrice: number;
  discount: number;
  saleType: SaleType; // retail or wholesale
}

export interface Cart {
  items: CartItem[];
  createdAt: number;
}

export interface Return {
  id: string;
  saleId: string;
  productId: string;
  product: Product;
  // Quantity or weight returned
  returnedQuantity: number;
  returnedWeight?: number;
  weightUnit?: WeightUnit;
  // Pricing
  unitPrice: number;
  totalRefund: number;
  // Additional info
  reason?: string;
  returnDate: Date;
  processedBy?: string;
}

export interface DebtCustomer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type DebtStatus = 'unpaid' | 'partial' | 'paid';

export interface Debt {
  id: string;
  saleId: string;
  customerId: string;
  customer?: DebtCustomer;
  sale?: Sale;
  totalAmount: number;
  amountPaid: number;
  amountRemaining: number;
  status: DebtStatus;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface DebtPayment {
  id: string;
  debtId: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: 'cash' | 'card' | 'transfer';
  notes?: string;
  createdBy?: string;
}

export interface DashboardStats {
  totalProducts: number;
  lowStockProducts: number;
  totalSales: number;
  totalRevenue: number;
  totalProfit: number;
  todaySales: number;
  todayRevenue: number;
  monthlyRevenue: number;
  // Retail/Wholesale breakdown
  retailSales: number;
  wholesaleSales: number;
  retailRevenue: number;
  wholesaleRevenue: number;
  retailProfit: number;
  wholesaleProfit: number;
  todayRetailSales: number;
  todayWholesaleSales: number;
  todayRetailRevenue: number;
  todayWholesaleRevenue: number;
  topSellingProducts: Array<{
    product: Product;
    totalSold: number;
    revenue: number;
  }>;
}

export interface ReportData {
  salesReport: {
    daily: Array<{ date: string; sales: number; revenue: number }>;
    monthly: Array<{ month: string; sales: number; revenue: number }>;
    yearly: Array<{ year: string; sales: number; revenue: number }>;
  };
  productReport: {
    topSelling: Array<{ product: Product; quantity: number; revenue: number }>;
    lowStock: Product[];
    categoryPerformance: Array<{ category: string; sales: number; revenue: number }>;
  };
  profitReport: {
    totalProfit: number;
    profitMargin: number;
    profitByCategory: Array<{ category: string; profit: number }>;
    profitTrend: Array<{ date: string; profit: number }>;
  };
}

export type NavigationItem = {
  id: string;
  name: string;
  icon: string;
  path: string;
  active?: boolean;
};

export const CURRENCIES: Record<Currency, CurrencyInfo> = {
  IQD: {
    code: 'IQD',
    name: 'Iraqi Dinar',
    symbol: 'IQD',
    locale: 'en-US',
  },
  USD: {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    locale: 'en-US',
  },
};

export type UserRole = 'admin' | 'assistant-admin' | 'user';

export interface User {
  id: string;
  username: string;
  password: string; // في التطبيق الحقيقي يجب تشفيرها
  role: UserRole;
  fullName?: string;
  email?: string;
  phone?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}

export interface AuthUser {
  id: string;
  username: string;
  role: UserRole;
  fullName?: string;
  email?: string;
}

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
    nameAr: 'قطعة',
    symbol: 'قطعة',
  },
  weight: {
    name: 'Weight',
    nameAr: 'وزن',
    symbol: '',
  },
};

export const WEIGHT_UNITS: Record<WeightUnit, MeasurementInfo> = {
  kg: {
    type: 'weight',
    unit: 'kg',
    name: 'Kilogram',
    nameAr: 'كيلوجرام',
    symbol: 'كجم',
  },
  g: {
    type: 'weight',
    unit: 'g',
    name: 'Gram',
    nameAr: 'جرام',
    symbol: 'جم',
  },
};

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  wholesalePrice: number;
  salePrice: number;
  discount: number;
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

export interface Sale {
  id: string;
  productId: string;
  product: Product;
  // Quantity or weight sold
  quantity: number;
  weight?: number;
  weightUnit?: WeightUnit;
  // Pricing
  unitPrice: number;
  totalPrice: number;
  discount: number;
  finalPrice: number;
  // Customer info
  customerName?: string;
  customerPhone?: string;
  saleDate: Date;
  paymentMethod: 'cash' | 'card' | 'transfer';
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
    name: 'الدينار العراقي',
    symbol: 'د.ع',
    locale: 'ar-IQ',
  },
  USD: {
    code: 'USD',
    name: 'الدولار الأمريكي',
    symbol: '$',
    locale: 'en-US',
  },
};

export type UserRole = 'admin' | 'user';

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

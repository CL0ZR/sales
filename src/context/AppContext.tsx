'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useAutoSetup } from '@/hooks/useAutoSetup';
import { Product, Category, Sale, DashboardStats } from '@/types';
import { isLowStock, reduceStock } from '@/utils/measurement';

interface AppState {
  products: Product[];
  categories: Category[];
  sales: Sale[];
  stats: DashboardStats | null;
  loading: boolean;
}

type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_PRODUCTS'; payload: Product[] }
  | { type: 'ADD_PRODUCT'; payload: Product }
  | { type: 'UPDATE_PRODUCT'; payload: Product }
  | { type: 'DELETE_PRODUCT'; payload: string }
  | { type: 'SET_CATEGORIES'; payload: Category[] }
  | { type: 'ADD_CATEGORY'; payload: Category }
  | { type: 'UPDATE_CATEGORY'; payload: Category }
  | { type: 'DELETE_CATEGORY'; payload: string }
  | { type: 'SET_SALES'; payload: Sale[] }
  | { type: 'ADD_SALE'; payload: Sale }
  | { type: 'SET_STATS'; payload: DashboardStats };

const initialState: AppState = {
  products: [],
  categories: [],
  sales: [],
  stats: null,
  loading: false,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_PRODUCTS':
      return { ...state, products: action.payload };
    case 'ADD_PRODUCT':
      return { ...state, products: [...state.products, action.payload] };
    case 'UPDATE_PRODUCT':
      return {
        ...state,
        products: state.products.map(p =>
          p.id === action.payload.id ? action.payload : p
        ),
      };
    case 'DELETE_PRODUCT':
      return {
        ...state,
        products: state.products.filter(p => p.id !== action.payload),
      };
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };
    case 'ADD_CATEGORY':
      return { ...state, categories: [...state.categories, action.payload] };
    case 'UPDATE_CATEGORY':
      return {
        ...state,
        categories: state.categories.map(c =>
          c.id === action.payload.id ? action.payload : c
        ),
      };
    case 'DELETE_CATEGORY':
      return {
        ...state,
        categories: state.categories.filter(c => c.id !== action.payload),
      };
    case 'SET_SALES':
      return { ...state, sales: action.payload };
    case 'ADD_SALE':
      return { ...state, sales: [...state.sales, action.payload] };
    case 'SET_STATS':
      return { ...state, stats: action.payload };
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  // Helper functions
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (category: Category) => void;
  deleteCategory: (id: string) => void;
  addSale: (sale: Omit<Sale, 'id' | 'saleDate'>) => void;
  calculateStats: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  useAutoSetup(); // استدعاء hook للتهيئة التلقائية

  // Helper functions - Now using API instead of localStorage
  const addProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });

      if (!response.ok) throw new Error('Failed to add product');

      const newProduct = await response.json();
      dispatch({ type: 'ADD_PRODUCT', payload: newProduct });
      return newProduct;
    } catch (error) {
      console.error('❌ Error adding product:', error);
      throw error;
    }
  };

  const updateProduct = async (product: Product) => {
    try {
      const response = await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });

      if (!response.ok) throw new Error('Failed to update product');

      const updatedProduct = await response.json();
      dispatch({ type: 'UPDATE_PRODUCT', payload: updatedProduct });
      return updatedProduct;
    } catch (error) {
      console.error('❌ Error updating product:', error);
      throw error;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const response = await fetch(`/api/products?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete product');

      dispatch({ type: 'DELETE_PRODUCT', payload: id });
      return true;
    } catch (error) {
      console.error('❌ Error deleting product:', error);
      throw error;
    }
  };

  const addCategory = async (categoryData: Omit<Category, 'id'>) => {
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryData),
      });

      if (!response.ok) throw new Error('Failed to add category');

      const newCategory = await response.json();
      dispatch({ type: 'ADD_CATEGORY', payload: newCategory });
      return newCategory;
    } catch (error) {
      console.error('❌ Error adding category:', error);
      throw error;
    }
  };

  const updateCategory = async (category: Category) => {
    try {
      const response = await fetch('/api/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(category),
      });

      if (!response.ok) throw new Error('Failed to update category');

      const updatedCategory = await response.json();
      dispatch({ type: 'UPDATE_CATEGORY', payload: updatedCategory });
      return updatedCategory;
    } catch (error) {
      console.error('❌ Error updating category:', error);
      throw error;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      const response = await fetch(`/api/categories?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete category');

      dispatch({ type: 'DELETE_CATEGORY', payload: id });
      return true;
    } catch (error) {
      console.error('❌ Error deleting category:', error);
      throw error;
    }
  };

  const addSale = async (saleData: Omit<Sale, 'id' | 'saleDate'>) => {
    try {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData),
      });

      if (!response.ok) throw new Error('Failed to add sale');

      const newSale = await response.json();
      dispatch({ type: 'ADD_SALE', payload: newSale });

      // Update product quantity or weight
      const product = state.products.find(p => p.id === newSale.productId);
      if (product) {
        const soldAmount = product.measurementType === 'quantity'
          ? newSale.quantity
          : newSale.weight || 0;

        const updatedProduct = reduceStock(product, soldAmount);
        await updateProduct(updatedProduct);
      }

      return newSale;
    } catch (error) {
      console.error('❌ Error adding sale:', error);
      throw error;
    }
  };

  const calculateStats = () => {
    const totalProducts = state.products.length;
    const lowStockProducts = state.products.filter(p => isLowStock(p)).length;
    const totalSales = state.sales.length;
    const totalRevenue = state.sales.reduce((sum, sale) => sum + sale.finalPrice, 0);
    const totalProfit = state.sales.reduce((sum, sale) => {
      const product = state.products.find(p => p.id === sale.productId);
      if (product) {
        const profit = (sale.unitPrice - product.wholesalePrice) * sale.quantity;
        return sum + profit;
      }
      return sum;
    }, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaySales = state.sales.filter(sale => 
      new Date(sale.saleDate) >= today
    ).length;
    const todayRevenue = state.sales
      .filter(sale => new Date(sale.saleDate) >= today)
      .reduce((sum, sale) => sum + sale.finalPrice, 0);

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyRevenue = state.sales
      .filter(sale => {
        const saleDate = new Date(sale.saleDate);
        return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
      })
      .reduce((sum, sale) => sum + sale.finalPrice, 0);

    // Calculate top selling products
    const productSales = state.sales.reduce((acc, sale) => {
      const productId = sale.productId;
      if (!acc[productId]) {
        acc[productId] = { totalSold: 0, revenue: 0 };
      }
      acc[productId].totalSold += sale.quantity;
      acc[productId].revenue += sale.finalPrice;
      return acc;
    }, {} as Record<string, { totalSold: number; revenue: number }>);

    const topSellingProducts = Object.entries(productSales)
      .map(([productId, data]) => ({
        product: state.products.find(p => p.id === productId)!,
        ...data,
      }))
      .filter(item => item.product)
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, 5);

    const stats: DashboardStats = {
      totalProducts,
      lowStockProducts,
      totalSales,
      totalRevenue,
      totalProfit,
      todaySales,
      todayRevenue,
      monthlyRevenue,
      topSellingProducts,
    };

    dispatch({ type: 'SET_STATS', payload: stats });
  };

  // Load data from API on mount
  useEffect(() => {
    const loadData = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });

      try {
        // Fetch products from API
        const productsRes = await fetch('/api/products');
        if (productsRes.ok) {
          const products = await productsRes.json();
          dispatch({ type: 'SET_PRODUCTS', payload: products });
        }

        // Fetch categories from API
        const categoriesRes = await fetch('/api/categories');
        if (categoriesRes.ok) {
          const categories = await categoriesRes.json();
          dispatch({ type: 'SET_CATEGORIES', payload: categories });
        }

        // Fetch sales from API
        const salesRes = await fetch('/api/sales');
        if (salesRes.ok) {
          const sales = await salesRes.json();
          dispatch({ type: 'SET_SALES', payload: sales });
        }
      } catch (error) {
        console.error('❌ Error loading data from database:', error);

        // Fallback to localStorage if API fails
        console.log('⚠️ Falling back to localStorage...');
        const savedProducts = localStorage.getItem('warehouse_products');
        const savedCategories = localStorage.getItem('warehouse_categories');
        const savedSales = localStorage.getItem('warehouse_sales');

        if (savedProducts) {
          dispatch({ type: 'SET_PRODUCTS', payload: JSON.parse(savedProducts) });
        }
        if (savedCategories) {
          dispatch({ type: 'SET_CATEGORIES', payload: JSON.parse(savedCategories) });
        }
        if (savedSales) {
          dispatch({ type: 'SET_SALES', payload: JSON.parse(savedSales) });
        }
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    loadData();
  }, []);

  // Recalculate stats when data changes
  useEffect(() => {
    calculateStats();
  }, [state.products, state.sales]);

  const contextValue: AppContextType = {
    state,
    dispatch,
    addProduct,
    updateProduct,
    deleteProduct,
    addCategory,
    updateCategory,
    deleteCategory,
    addSale,
    calculateStats,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

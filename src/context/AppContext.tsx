'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useAutoSetup } from '@/hooks/useAutoSetup';
import { Product, Category, Sale, Return, DashboardStats, DebtCustomer, Debt, DebtPayment } from '@/types';
import { isLowStock, reduceStock, increaseStock } from '@/utils/measurement';

interface AppState {
  products: Product[];
  categories: Category[];
  sales: Sale[];
  returns: Return[];
  debtCustomers: DebtCustomer[];
  debts: Debt[];
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
  | { type: 'SET_RETURNS'; payload: Return[] }
  | { type: 'ADD_RETURN'; payload: Return }
  | { type: 'SET_DEBT_CUSTOMERS'; payload: DebtCustomer[] }
  | { type: 'ADD_DEBT_CUSTOMER'; payload: DebtCustomer }
  | { type: 'UPDATE_DEBT_CUSTOMER'; payload: DebtCustomer }
  | { type: 'DELETE_DEBT_CUSTOMER'; payload: string }
  | { type: 'SET_DEBTS'; payload: Debt[] }
  | { type: 'ADD_DEBT'; payload: Debt }
  | { type: 'UPDATE_DEBT'; payload: Debt }
  | { type: 'DELETE_DEBT'; payload: string }
  | { type: 'SET_STATS'; payload: DashboardStats };

const initialState: AppState = {
  products: [],
  categories: [],
  sales: [],
  returns: [],
  debtCustomers: [],
  debts: [],
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
    case 'SET_RETURNS':
      return { ...state, returns: action.payload };
    case 'ADD_RETURN':
      return { ...state, returns: [...state.returns, action.payload] };
    case 'SET_DEBT_CUSTOMERS':
      return { ...state, debtCustomers: action.payload };
    case 'ADD_DEBT_CUSTOMER':
      return { ...state, debtCustomers: [...state.debtCustomers, action.payload] };
    case 'UPDATE_DEBT_CUSTOMER':
      return {
        ...state,
        debtCustomers: state.debtCustomers.map(c =>
          c.id === action.payload.id ? action.payload : c
        ),
      };
    case 'DELETE_DEBT_CUSTOMER':
      return {
        ...state,
        debtCustomers: state.debtCustomers.filter(c => c.id !== action.payload),
      };
    case 'SET_DEBTS':
      return { ...state, debts: action.payload };
    case 'ADD_DEBT':
      return { ...state, debts: [...state.debts, action.payload] };
    case 'UPDATE_DEBT':
      return {
        ...state,
        debts: state.debts.map(d =>
          d.id === action.payload.id ? action.payload : d
        ),
      };
    case 'DELETE_DEBT':
      return {
        ...state,
        debts: state.debts.filter(d => d.id !== action.payload),
      };
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
  processReturn: (returnData: Omit<Return, 'id' | 'returnDate' | 'product'>) => Promise<Return>;
  calculateStats: () => void;
  refreshData: () => Promise<void>;
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete product');
      }

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

      // If payment method is debt, create a debt record
      if (newSale.paymentMethod === 'debt' && newSale.debtCustomerId) {
        try {
          const debtResponse = await fetch('/api/debts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              saleId: newSale.id,
              customerId: newSale.debtCustomerId,
              totalAmount: newSale.finalPrice,
              amountPaid: 0,
              amountRemaining: newSale.finalPrice,
              status: 'unpaid',
            }),
          });

          if (debtResponse.ok) {
            const newDebt = await debtResponse.json();
            dispatch({ type: 'ADD_DEBT', payload: newDebt });

            // Update the sale with the debt ID
            await fetch('/api/sales', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...newSale, debtId: newDebt.id }),
            });
          }
        } catch (debtError) {
          console.error('❌ Error creating debt:', debtError);
        }
      }

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

  const processReturn = async (returnData: Omit<Return, 'id' | 'returnDate' | 'product'>): Promise<Return> => {
    try {
      const response = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(returnData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process return');
      }

      const newReturn = await response.json();
      dispatch({ type: 'ADD_RETURN', payload: newReturn });

      // Update product quantity or weight (restore inventory)
      const product = state.products.find(p => p.id === newReturn.productId);
      if (product) {
        const returnedAmount = product.measurementType === 'quantity'
          ? newReturn.returnedQuantity
          : newReturn.returnedWeight || 0;

        const updatedProduct = increaseStock(product, returnedAmount);
        await updateProduct(updatedProduct);
      }

      return newReturn;
    } catch (error) {
      console.error('❌ Error processing return:', error);
      throw error;
    }
  };

  const calculateStats = () => {
    const totalProducts = state.products.length;
    const lowStockProducts = state.products.filter(p => isLowStock(p)).length;
    const totalSales = state.sales.length;

    // Calculate total revenue (subtract returns)
    const grossRevenue = state.sales.reduce((sum, sale) => sum + sale.finalPrice, 0);
    const totalRefunds = state.returns.reduce((sum, returnItem) => sum + returnItem.totalRefund, 0);
    const totalRevenue = grossRevenue - totalRefunds;

    // Calculate total profit (subtract returns)
    const totalProfit = state.sales.reduce((sum, sale) => {
      const product = state.products.find(p => p.id === sale.productId);
      if (product) {
        // Handle both quantity and weight-based products
        const soldAmount = product.measurementType === 'quantity'
          ? sale.quantity
          : sale.weight || 0;
        // Use wholesaleCostPrice for wholesale sales, wholesalePrice for retail sales
        const costPrice = sale.saleType === 'wholesale'
          ? (product.wholesaleCostPrice || product.wholesalePrice)
          : product.wholesalePrice;
        const profit = (sale.unitPrice - costPrice) * soldAmount;
        return sum + profit;
      }
      return sum;
    }, 0) - state.returns.reduce((sum, returnItem) => {
      const product = state.products.find(p => p.id === returnItem.productId);
      const sale = state.sales.find(s => s.id === returnItem.saleId);
      if (product && sale) {
        const returnAmount = product.measurementType === 'quantity'
          ? returnItem.returnedQuantity
          : returnItem.returnedWeight || 0;
        // Use wholesaleCostPrice for wholesale sales, wholesalePrice for retail sales
        const costPrice = sale.saleType === 'wholesale'
          ? (product.wholesaleCostPrice || product.wholesalePrice)
          : product.wholesalePrice;
        const lostProfit = (returnItem.unitPrice - costPrice) * returnAmount;
        return sum + lostProfit;
      }
      return sum;
    }, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaySales = state.sales.filter(sale =>
      new Date(sale.saleDate) >= today
    ).length;
    const todayGrossRevenue = state.sales
      .filter(sale => new Date(sale.saleDate) >= today)
      .reduce((sum, sale) => sum + sale.finalPrice, 0);
    const todayRefunds = state.returns
      .filter(returnItem => new Date(returnItem.returnDate) >= today)
      .reduce((sum, returnItem) => sum + returnItem.totalRefund, 0);
    const todayRevenue = todayGrossRevenue - todayRefunds;

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyGrossRevenue = state.sales
      .filter(sale => {
        const saleDate = new Date(sale.saleDate);
        return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
      })
      .reduce((sum, sale) => sum + sale.finalPrice, 0);
    const monthlyRefunds = state.returns
      .filter(returnItem => {
        const returnDate = new Date(returnItem.returnDate);
        return returnDate.getMonth() === currentMonth && returnDate.getFullYear() === currentYear;
      })
      .reduce((sum, returnItem) => sum + returnItem.totalRefund, 0);
    const monthlyRevenue = monthlyGrossRevenue - monthlyRefunds;

    // Calculate retail vs wholesale breakdown
    const retailSales = state.sales.filter(s => !s.saleType || s.saleType === 'retail').length;
    const wholesaleSales = state.sales.filter(s => s.saleType === 'wholesale').length;

    // Retail revenue
    const retailGrossRevenue = state.sales
      .filter(s => !s.saleType || s.saleType === 'retail')
      .reduce((sum, sale) => sum + sale.finalPrice, 0);
    const retailRefunds = state.returns
      .filter(returnItem => {
        const sale = state.sales.find(s => s.id === returnItem.saleId);
        return sale && (!sale.saleType || sale.saleType === 'retail');
      })
      .reduce((sum, returnItem) => sum + returnItem.totalRefund, 0);
    const retailRevenue = retailGrossRevenue - retailRefunds;

    // Wholesale revenue
    const wholesaleGrossRevenue = state.sales
      .filter(s => s.saleType === 'wholesale')
      .reduce((sum, sale) => sum + sale.finalPrice, 0);
    const wholesaleRefunds = state.returns
      .filter(returnItem => {
        const sale = state.sales.find(s => s.id === returnItem.saleId);
        return sale && sale.saleType === 'wholesale';
      })
      .reduce((sum, returnItem) => sum + returnItem.totalRefund, 0);
    const wholesaleRevenue = wholesaleGrossRevenue - wholesaleRefunds;

    // Retail profit
    const retailProfit = state.sales
      .filter(s => !s.saleType || s.saleType === 'retail')
      .reduce((sum, sale) => {
        const product = state.products.find(p => p.id === sale.productId);
        if (product) {
          const soldAmount = product.measurementType === 'quantity'
            ? sale.quantity
            : sale.weight || 0;
          const profit = (sale.unitPrice - product.wholesalePrice) * soldAmount;
          return sum + profit;
        }
        return sum;
      }, 0) - state.returns
      .filter(returnItem => {
        const sale = state.sales.find(s => s.id === returnItem.saleId);
        return sale && (!sale.saleType || sale.saleType === 'retail');
      })
      .reduce((sum, returnItem) => {
        const product = state.products.find(p => p.id === returnItem.productId);
        if (product) {
          const returnAmount = product.measurementType === 'quantity'
            ? returnItem.returnedQuantity
            : returnItem.returnedWeight || 0;
          const lostProfit = (returnItem.unitPrice - product.wholesalePrice) * returnAmount;
          return sum + lostProfit;
        }
        return sum;
      }, 0);

    // Wholesale profit
    const wholesaleProfit = state.sales
      .filter(s => s.saleType === 'wholesale')
      .reduce((sum, sale) => {
        const product = state.products.find(p => p.id === sale.productId);
        if (product) {
          const soldAmount = product.measurementType === 'quantity'
            ? sale.quantity
            : sale.weight || 0;
          // Use wholesaleCostPrice as cost for wholesale sales
          const costPrice = product.wholesaleCostPrice || product.wholesalePrice;
          const profit = (sale.unitPrice - costPrice) * soldAmount;
          return sum + profit;
        }
        return sum;
      }, 0) - state.returns
      .filter(returnItem => {
        const sale = state.sales.find(s => s.id === returnItem.saleId);
        return sale && sale.saleType === 'wholesale';
      })
      .reduce((sum, returnItem) => {
        const product = state.products.find(p => p.id === returnItem.productId);
        if (product) {
          const returnAmount = product.measurementType === 'quantity'
            ? returnItem.returnedQuantity
            : returnItem.returnedWeight || 0;
          // Use wholesaleCostPrice as cost for wholesale sales
          const costPrice = product.wholesaleCostPrice || product.wholesalePrice;
          const lostProfit = (returnItem.unitPrice - costPrice) * returnAmount;
          return sum + lostProfit;
        }
        return sum;
      }, 0);

    // Today's retail vs wholesale
    const todayRetailSales = state.sales.filter(sale =>
      new Date(sale.saleDate) >= today && (!sale.saleType || sale.saleType === 'retail')
    ).length;
    const todayWholesaleSales = state.sales.filter(sale =>
      new Date(sale.saleDate) >= today && sale.saleType === 'wholesale'
    ).length;

    const todayRetailRevenue = state.sales
      .filter(sale => new Date(sale.saleDate) >= today && (!sale.saleType || sale.saleType === 'retail'))
      .reduce((sum, sale) => sum + sale.finalPrice, 0) - state.returns
      .filter(returnItem => {
        const sale = state.sales.find(s => s.id === returnItem.saleId);
        return sale && new Date(returnItem.returnDate) >= today && (!sale.saleType || sale.saleType === 'retail');
      })
      .reduce((sum, returnItem) => sum + returnItem.totalRefund, 0);

    const todayWholesaleRevenue = state.sales
      .filter(sale => new Date(sale.saleDate) >= today && sale.saleType === 'wholesale')
      .reduce((sum, sale) => sum + sale.finalPrice, 0) - state.returns
      .filter(returnItem => {
        const sale = state.sales.find(s => s.id === returnItem.saleId);
        return sale && new Date(returnItem.returnDate) >= today && sale.saleType === 'wholesale';
      })
      .reduce((sum, returnItem) => sum + returnItem.totalRefund, 0);

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
      retailSales,
      wholesaleSales,
      retailRevenue,
      wholesaleRevenue,
      retailProfit,
      wholesaleProfit,
      todayRetailSales,
      todayWholesaleSales,
      todayRetailRevenue,
      todayWholesaleRevenue,
      topSellingProducts,
    };

    dispatch({ type: 'SET_STATS', payload: stats });
  };

  // Load data from API
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

      // Fetch returns from API
      const returnsRes = await fetch('/api/returns');
      if (returnsRes.ok) {
        const returns = await returnsRes.json();
        dispatch({ type: 'SET_RETURNS', payload: returns });
      }

      // Fetch debt customers from API
      const debtCustomersRes = await fetch('/api/debt-customers');
      if (debtCustomersRes.ok) {
        const debtCustomers = await debtCustomersRes.json();
        dispatch({ type: 'SET_DEBT_CUSTOMERS', payload: debtCustomers });
      }

      // Fetch debts from API
      const debtsRes = await fetch('/api/debts');
      if (debtsRes.ok) {
        const debts = await debtsRes.json();
        dispatch({ type: 'SET_DEBTS', payload: debts });
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

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Recalculate stats when data changes
  useEffect(() => {
    calculateStats();
  }, [state.products, state.sales, state.returns]);

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
    processReturn,
    calculateStats,
    refreshData: loadData,
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

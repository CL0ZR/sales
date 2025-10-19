import { useState } from 'react';
import { Product, Category, Sale } from '@/types';

/**
 * Custom hook for database operations via API
 * This replaces direct localStorage usage
 */
export function useDatabase() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function for API calls
  const apiCall = async <T,>(
    url: string,
    method: string = 'GET',
    body?: unknown
  ): Promise<T> => {
    setLoading(true);
    setError(null);

    try {
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (body) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(url, options);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Products API
  const products = {
    getAll: () => apiCall<Product[]>('/api/products'),

    create: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) =>
      apiCall<Product>('/api/products', 'POST', product),

    update: (product: Product) =>
      apiCall<Product>('/api/products', 'PUT', product),

    delete: (id: string) =>
      apiCall<{ success: boolean }>(`/api/products?id=${id}`, 'DELETE'),
  };

  // Categories API
  const categories = {
    getAll: () => apiCall<Category[]>('/api/categories'),

    create: (category: Omit<Category, 'id'>) =>
      apiCall<Category>('/api/categories', 'POST', category),

    update: (category: Category) =>
      apiCall<Category>('/api/categories', 'PUT', category),

    delete: (id: string) =>
      apiCall<{ success: boolean }>(`/api/categories?id=${id}`, 'DELETE'),
  };

  // Sales API
  const sales = {
    getAll: () => apiCall<Sale[]>('/api/sales'),

    create: (sale: Omit<Sale, 'id' | 'saleDate'>) =>
      apiCall<Sale>('/api/sales', 'POST', sale),

    delete: (id: string) =>
      apiCall<{ success: boolean }>(`/api/sales?id=${id}`, 'DELETE'),
  };

  // Migration
  const migration = {
    migrate: () => apiCall<{ success: boolean; message: string }>('/api/migrate', 'POST'),

    cleanup: () => apiCall<{ success: boolean; message: string }>('/api/migrate', 'DELETE'),
  };

  return {
    products,
    categories,
    sales,
    migration,
    loading,
    error,
  };
}

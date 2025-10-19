'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { useCurrency } from '@/context/CurrencyContext';
import { Product } from '@/types';

export default function Reports() {
  const { state } = useApp();
  const { products, sales, categories } = state;
  const { formatCurrency } = useCurrency();
  
  const [activeReport, setActiveReport] = useState<'sales' | 'products' | 'profit' | 'inventory'>('sales');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  // Currency formatting is now handled by useCurrency hook

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ar-SA').format(date);
  };

  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const saleDate = new Date(sale.saleDate);
      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);
      endDate.setHours(23, 59, 59, 999);
      return saleDate >= startDate && saleDate <= endDate;
    });
  }, [sales, dateRange]);

  const salesReport = useMemo(() => {
    const totalSales = filteredSales.length;
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.finalPrice, 0);
    const totalProfit = filteredSales.reduce((sum, sale) => {
      const product = products.find(p => p.id === sale.productId);
      if (product) {
        const profit = (sale.unitPrice - product.wholesalePrice) * sale.quantity;
        return sum + profit;
      }
      return sum;
    }, 0);

    // Daily sales
    const dailySales = filteredSales.reduce((acc, sale) => {
      const date = new Date(sale.saleDate).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { sales: 0, revenue: 0, profit: 0 };
      }
      acc[date].sales += 1;
      acc[date].revenue += sale.finalPrice;
      
      const product = products.find(p => p.id === sale.productId);
      if (product) {
        acc[date].profit += (sale.unitPrice - product.wholesalePrice) * sale.quantity;
      }
      
      return acc;
    }, {} as Record<string, { sales: number; revenue: number; profit: number }>);

    // Payment methods
    const paymentMethods = filteredSales.reduce((acc, sale) => {
      if (!acc[sale.paymentMethod]) {
        acc[sale.paymentMethod] = { count: 0, amount: 0 };
      }
      acc[sale.paymentMethod].count += 1;
      acc[sale.paymentMethod].amount += sale.finalPrice;
      return acc;
    }, {} as Record<string, { count: number; amount: number }>);

    return {
      totalSales,
      totalRevenue,
      totalProfit,
      averageSaleValue: totalSales > 0 ? totalRevenue / totalSales : 0,
      dailySales: Object.entries(dailySales).map(([date, data]) => ({
        date,
        ...data,
      })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      paymentMethods,
    };
  }, [filteredSales, products]);

  const productReport = useMemo(() => {
    // Top selling products
    const productSales = filteredSales.reduce((acc, sale) => {
      if (!acc[sale.productId]) {
        acc[sale.productId] = {
          product: sale.product,
          quantity: 0,
          revenue: 0,
          profit: 0,
          sales: 0,
        };
      }
      acc[sale.productId].quantity += sale.quantity;
      acc[sale.productId].revenue += sale.finalPrice;
      acc[sale.productId].sales += 1;
      
      const product = products.find(p => p.id === sale.productId);
      if (product) {
        acc[sale.productId].profit += (sale.unitPrice - product.wholesalePrice) * sale.quantity;
      }
      
      return acc;
    }, {} as Record<string, { product: Product; quantity: number; revenue: number; profit: number; sales: number }>);

    const topSelling = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    const topRevenue = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Low stock products
    const lowStock = products.filter(p => p.quantity <= p.minQuantity);

    // Out of stock products
    const outOfStock = products.filter(p => p.quantity === 0);

    // Category performance
    const categoryPerformance = categories.map(category => {
      const categoryProducts = products.filter(p => p.category === category.name);
      const categorySales = filteredSales.filter(sale => 
        categoryProducts.some(p => p.id === sale.productId)
      );
      
      return {
        category: category.name,
        totalProducts: categoryProducts.length,
        sales: categorySales.length,
        revenue: categorySales.reduce((sum, sale) => sum + sale.finalPrice, 0),
        profit: categorySales.reduce((sum, sale) => {
          const product = products.find(p => p.id === sale.productId);
          if (product) {
            return sum + (sale.unitPrice - product.wholesalePrice) * sale.quantity;
          }
          return sum;
        }, 0),
      };
    });

    return {
      topSelling,
      topRevenue,
      lowStock,
      outOfStock,
      categoryPerformance,
    };
  }, [filteredSales, products, categories]);

  const inventoryReport = useMemo(() => {
    const totalProducts = products.length;
    const totalInventoryValue = products.reduce((sum, product) => 
      sum + (product.wholesalePrice * product.quantity), 0
    );
    const totalRetailValue = products.reduce((sum, product) => 
      sum + (product.salePrice * product.quantity), 0
    );
    const potentialProfit = totalRetailValue - totalInventoryValue;

    const categoryInventory = categories.map(category => {
      const categoryProducts = products.filter(p => p.category === category.name);
      return {
        category: category.name,
        productCount: categoryProducts.length,
        totalQuantity: categoryProducts.reduce((sum, p) => sum + p.quantity, 0),
        inventoryValue: categoryProducts.reduce((sum, p) => sum + (p.wholesalePrice * p.quantity), 0),
        retailValue: categoryProducts.reduce((sum, p) => sum + (p.salePrice * p.quantity), 0),
      };
    });

    return {
      totalProducts,
      totalInventoryValue,
      totalRetailValue,
      potentialProfit,
      categoryInventory,
      lowStockCount: products.filter(p => p.quantity <= p.minQuantity).length,
      outOfStockCount: products.filter(p => p.quantity === 0).length,
    };
  }, [products, categories]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">التقارير</h1>
          <p className="">تحليل مفصل للمبيعات والمنتجات والأرباح</p>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              من تاريخ
            </label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              إلى تاريخ
            </label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="bg-card border border-border rounded-lg p-1 flex flex-wrap gap-1">
        <button
          onClick={() => setActiveReport('sales')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            activeReport === 'sales'
              ? 'bg-primary text-white'
              : 'text-foreground hover:bg-secondary'
          }`}
        >
          تقرير المبيعات
        </button>
        <button
          onClick={() => setActiveReport('products')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            activeReport === 'products'
              ? 'bg-primary text-white'
              : 'text-foreground hover:bg-secondary'
          }`}
        >
          تقرير المنتجات
        </button>
        <button
          onClick={() => setActiveReport('inventory')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            activeReport === 'inventory'
              ? 'bg-primary text-white'
              : 'text-foreground hover:bg-secondary'
          }`}
        >
          تقرير المخزون
        </button>
      </div>

      {/* Sales Report */}
      {activeReport === 'sales' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm  mb-1">إجمالي المبيعات</p>
                  <p className="text-2xl font-bold text-foreground">{salesReport.totalSales}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-[#1446A0] text-white flex items-center justify-center">
                  🛒
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm  mb-1">إجمالي الإيرادات</p>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(salesReport.totalRevenue)}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-[#DB3069] text-white flex items-center justify-center">
                  💰
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm  mb-1">إجمالي الأرباح</p>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(salesReport.totalProfit)}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-[#F5D547] text-white flex items-center justify-center">
                  📈
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm  mb-1">متوسط قيمة البيعة</p>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(salesReport.averageSaleValue)}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-[#1799b4] text-white flex items-center justify-center">
                  📊
                </div>
              </div>
            </div>
          </div>

          {/* Daily Sales Table */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">المبيعات اليومية</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary">
                  <tr>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">التاريخ</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">عدد المبيعات</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">الإيرادات</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">الأرباح</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {salesReport.dailySales.map((day) => (
                    <tr key={day.date} className="hover:bg-secondary/50">
                      <td className="px-4 py-3 text-foreground">{formatDate(new Date(day.date))}</td>
                      <td className="px-4 py-3 text-foreground">{day.sales}</td>
                      <td className="px-4 py-3 text-foreground">{formatCurrency(day.revenue)}</td>
                      <td className="px-4 py-3 text-foreground">{formatCurrency(day.profit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {salesReport.dailySales.length === 0 && (
                <div className="text-center py-8 text-muted">
                  <p>لا توجد مبيعات في هذه الفترة</p>
                </div>
              )}
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">طرق الدفع</h3>
            <div className="space-y-3">
              {Object.entries(salesReport.paymentMethods).map(([method, data]) => {
                const methodNames = {
                  cash: 'نقداً',
                  card: 'بطاقة',
                  transfer: 'تحويل',
                };
                return (
                  <div key={method} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                    <span className="font-medium text-foreground">
                      {methodNames[method as keyof typeof methodNames] || method}
                    </span>
                    <div className="text-left">
                      <p className="font-semibold text-foreground">{formatCurrency(data.amount)}</p>
                      <p className="text-sm text-muted">{data.count} مبيعة</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Products Report */}
      {activeReport === 'products' && (
        <div className="space-y-6">
          {/* Top Selling Products */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">أكثر المنتجات مبيعاً (حسب الكمية)</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary">
                  <tr>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">المنتج</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">الكمية المباعة</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">عدد المبيعات</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">الإيرادات</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">الأرباح</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {productReport.topSelling.map((item, index) => (
                    <tr key={item.product.id} className="hover:bg-secondary/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </span>
                          <div>
                            <p className="font-medium text-foreground">{item.product.name}</p>
                            <p className="text-sm text-muted">{item.product.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-foreground">{item.quantity}</td>
                      <td className="px-4 py-3 text-foreground">{item.sales}</td>
                      <td className="px-4 py-3 text-foreground">{formatCurrency(item.revenue)}</td>
                      <td className="px-4 py-3 text-foreground">{formatCurrency(item.profit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {productReport.topSelling.length === 0 && (
                <div className="text-center py-8 text-muted">
                  <p>لا توجد مبيعات في هذه الفترة</p>
                </div>
              )}
            </div>
          </div>

          {/* Category Performance */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">أداء الفئات</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary">
                  <tr>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">الفئة</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">عدد المنتجات</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">المبيعات</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">الإيرادات</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">الأرباح</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {productReport.categoryPerformance.map((category) => (
                    <tr key={category.category} className="hover:bg-secondary/50">
                      <td className="px-4 py-3 font-medium text-foreground">{category.category}</td>
                      <td className="px-4 py-3 text-foreground">{category.totalProducts}</td>
                      <td className="px-4 py-3 text-foreground">{category.sales}</td>
                      <td className="px-4 py-3 text-foreground">{formatCurrency(category.revenue)}</td>
                      <td className="px-4 py-3 text-foreground">{formatCurrency(category.profit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Stock Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">منتجات قليلة المخزون</h3>
              <div className="space-y-3">
                {productReport.lowStock.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-warning/10 border border-warning/20 rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">{product.name}</p>
                      <p className="text-sm text-muted">الحد الأدنى: {product.minQuantity}</p>
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-warning">{product.quantity} متبقي</p>
                    </div>
                  </div>
                ))}
                {productReport.lowStock.length === 0 && (
                  <div className="text-center py-8 text-muted">
                    <p>جميع المنتجات متوفرة بكمية كافية</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">منتجات نفد مخزونها</h3>
              <div className="space-y-3">
                {productReport.outOfStock.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-danger/10 border border-danger/20 rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">{product.name}</p>
                      <p className="text-sm text-muted">{product.category}</p>
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-danger">نفد المخزون</p>
                    </div>
                  </div>
                ))}
                {productReport.outOfStock.length === 0 && (
                  <div className="text-center py-8 text-muted">
                    <p>جميع المنتجات متوفرة</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inventory Report */}
      {activeReport === 'inventory' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted mb-1">إجمالي المنتجات</p>
                  <p className="text-2xl font-bold text-foreground">{inventoryReport.totalProducts}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-primary text-white flex items-center justify-center">
                  📦
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted mb-1">قيمة المخزون</p>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(inventoryReport.totalInventoryValue)}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-success text-white flex items-center justify-center">
                  💰
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted mb-1">القيمة بسعر التجزئة</p>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(inventoryReport.totalRetailValue)}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-warning text-white flex items-center justify-center">
                  🏪
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted mb-1">الربح المحتمل</p>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(inventoryReport.potentialProfit)}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-danger text-white flex items-center justify-center">
                  📈
                </div>
              </div>
            </div>
          </div>

          {/* Category Inventory */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">مخزون الفئات</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary">
                  <tr>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">الفئة</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">عدد المنتجات</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">إجمالي الكمية</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">قيمة المخزون</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">قيمة التجزئة</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">الربح المحتمل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {inventoryReport.categoryInventory.map((category) => (
                    <tr key={category.category} className="hover:bg-secondary/50">
                      <td className="px-4 py-3 font-medium text-foreground">{category.category}</td>
                      <td className="px-4 py-3 text-foreground">{category.productCount}</td>
                      <td className="px-4 py-3 text-foreground">{category.totalQuantity}</td>
                      <td className="px-4 py-3 text-foreground">{formatCurrency(category.inventoryValue)}</td>
                      <td className="px-4 py-3 text-foreground">{formatCurrency(category.retailValue)}</td>
                      <td className="px-4 py-3 text-foreground">{formatCurrency(category.retailValue - category.inventoryValue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Stock Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">حالة المخزون</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-success/10 border border-success/20 rounded-lg">
                  <span className="font-medium text-foreground">منتجات متوفرة</span>
                  <span className="font-bold text-success">
                    {inventoryReport.totalProducts - inventoryReport.lowStockCount - inventoryReport.outOfStockCount}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-warning/10 border border-warning/20 rounded-lg">
                  <span className="font-medium text-foreground">منتجات قليلة المخزون</span>
                  <span className="font-bold text-warning">{inventoryReport.lowStockCount}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-danger/10 border border-danger/20 rounded-lg">
                  <span className="font-medium text-foreground">منتجات نفد مخزونها</span>
                  <span className="font-bold text-danger">{inventoryReport.outOfStockCount}</span>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">ملخص الأرقام</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted">متوسط قيمة المنتج:</span>
                  <span className="font-semibold text-foreground">
                    {formatCurrency(inventoryReport.totalProducts > 0 ? inventoryReport.totalInventoryValue / inventoryReport.totalProducts : 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">هامش الربح المتوقع:</span>
                  <span className="font-semibold text-foreground">
                    {inventoryReport.totalInventoryValue > 0 
                      ? ((inventoryReport.potentialProfit / inventoryReport.totalInventoryValue) * 100).toFixed(1)
                      : 0}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">معدل دوران المخزون:</span>
                  <span className="font-semibold text-foreground">
                    {inventoryReport.totalInventoryValue > 0 
                      ? (salesReport.totalRevenue / inventoryReport.totalInventoryValue).toFixed(2)
                      : 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

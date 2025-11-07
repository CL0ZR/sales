"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { useCurrency } from "@/context/CurrencyContext";
import { useAuth } from "@/context/AuthContext";
import { Product, Sale, Return } from "@/types";
import { formatGregorianDate } from "@/utils/dateFormat";
import { isLowStock, isOutOfStock, getStockStatus } from "@/utils/measurement";
import { AlertTriangle, Eye, Printer } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

export default function Reports() {
  const { state, refreshData } = useApp();
  const { products, sales, categories, returns } = state;
  const { formatCurrency } = useCurrency();
  const { user } = useAuth();

  // Refresh data when the reports page mounts
  useEffect(() => {
    refreshData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [activeReport, setActiveReport] = useState<
    "sales" | "products" | "profit" | "inventory" | "returns"
  >("sales");
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30))
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });

  // Modal states
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedReturn, setSelectedReturn] = useState<Return | null>(null);

  // Print preview state
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [previewType, setPreviewType] = useState<'sales' | 'inventory' | 'returns'>('sales');

  // Print settings state
  const [printSettings, setPrintSettings] = useState({
    // Common settings
    textSize: 14,
    orientation: 'portrait' as 'portrait' | 'landscape',
    showTitle: true,
    // Sales columns
    salesColumns: {
      date: true,
      product: true,
      type: true,
      quantity: true,
      price: true,
      total: true,
      payment: true,
      customer: false,
    },
    // Sales filters
    salesFilters: {
      showRetail: true,
      showWholesale: true,
      showCash: true,
      showDebt: true,
    },
    // Inventory columns
    inventoryColumns: {
      product: true,
      category: true,
      status: true,
      quantity: true,
      wholesaleValue: true,
      retailValue: true,
      barcode: false,
    },
    // Inventory filters
    inventoryFilters: {
      showLowStock: true,
      showAvailable: true,
      showOutOfStock: true,
    },
    // Inventory notes
    inventoryNotes: '',
    // Returns columns
    returnsColumns: {
      date: true,
      product: true,
      quantity: true,
      refund: true,
      reason: true,
      processor: false,
    },
  });

  // All useMemo hooks must be called before any conditional returns
  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const saleDate = new Date(sale.saleDate);
      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);
      endDate.setHours(23, 59, 59, 999);
      return saleDate >= startDate && saleDate <= endDate;
    });
  }, [sales, dateRange]);

  const filteredReturns = useMemo(() => {
    return returns.filter((returnItem) => {
      const returnDate = new Date(returnItem.returnDate);
      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);
      endDate.setHours(23, 59, 59, 999);
      return returnDate >= startDate && returnDate <= endDate;
    });
  }, [returns, dateRange]);

  const salesReport = useMemo(() => {
    const totalSales = filteredSales.length;
    const totalRevenue = filteredSales.reduce(
      (sum, sale) => sum + sale.finalPrice,
      0
    );
    const totalProfit = filteredSales.reduce((sum, sale) => {
      const product = products.find((p) => p.id === sale.productId);
      if (product) {
        const soldAmount = product.measurementType === 'quantity'
          ? sale.quantity
          : (sale.weight || 0);
        // Use wholesaleCostPrice for wholesale sales, wholesalePrice for retail sales
        const costPrice = sale.saleType === 'wholesale'
          ? (product.wholesaleCostPrice || product.wholesalePrice)
          : product.wholesalePrice;
        const profit = (sale.unitPrice - costPrice) * soldAmount;
        return sum + profit;
      }
      return sum;
    }, 0);

    // Daily sales
    const dailySales = filteredSales.reduce((acc, sale) => {
      const date = new Date(sale.saleDate).toISOString().split("T")[0];
      if (!acc[date]) {
        acc[date] = {
          sales: 0,
          revenue: 0,
          profit: 0,
          retailSales: 0,
          wholesaleSales: 0,
          retailRevenue: 0,
          wholesaleRevenue: 0
        };
      }
      acc[date].sales += 1;
      acc[date].revenue += sale.finalPrice;

      // Track retail vs wholesale
      const saleType = sale.saleType || 'retail';
      if (saleType === 'retail') {
        acc[date].retailSales += 1;
        acc[date].retailRevenue += sale.finalPrice;
      } else {
        acc[date].wholesaleSales += 1;
        acc[date].wholesaleRevenue += sale.finalPrice;
      }

      const product = products.find((p) => p.id === sale.productId);
      if (product) {
        const soldAmount = product.measurementType === 'quantity'
          ? sale.quantity
          : (sale.weight || 0);
        // Use wholesaleCostPrice for wholesale sales, wholesalePrice for retail sales
        const costPrice = sale.saleType === 'wholesale'
          ? (product.wholesaleCostPrice || product.wholesalePrice)
          : product.wholesalePrice;
        acc[date].profit += (sale.unitPrice - costPrice) * soldAmount;
      }

      return acc;
    }, {} as Record<string, { sales: number; revenue: number; profit: number; retailSales: number; wholesaleSales: number; retailRevenue: number; wholesaleRevenue: number }>);

    // Payment methods
    const paymentMethods = filteredSales.reduce((acc, sale) => {
      if (!acc[sale.paymentMethod]) {
        acc[sale.paymentMethod] = {
          count: 0,
          amount: 0,
          retailCount: 0,
          retailAmount: 0,
          wholesaleCount: 0,
          wholesaleAmount: 0
        };
      }
      acc[sale.paymentMethod].count += 1;
      acc[sale.paymentMethod].amount += sale.finalPrice;

      // Track retail vs wholesale
      const saleType = sale.saleType || 'retail';
      if (saleType === 'retail') {
        acc[sale.paymentMethod].retailCount += 1;
        acc[sale.paymentMethod].retailAmount += sale.finalPrice;
      } else {
        acc[sale.paymentMethod].wholesaleCount += 1;
        acc[sale.paymentMethod].wholesaleAmount += sale.finalPrice;
      }

      return acc;
    }, {} as Record<string, { count: number; amount: number; retailCount: number; retailAmount: number; wholesaleCount: number; wholesaleAmount: number }>);

    return {
      totalSales,
      totalRevenue,
      totalProfit,
      averageSaleValue: totalSales > 0 ? totalRevenue / totalSales : 0,
      dailySales: Object.entries(dailySales)
        .map(([date, data]) => ({
          date,
          ...data,
        }))
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        ),
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
          retailSales: 0,
          wholesaleSales: 0,
          retailRevenue: 0,
          wholesaleRevenue: 0,
        };
      }
      acc[sale.productId].quantity += sale.quantity;
      acc[sale.productId].revenue += sale.finalPrice;
      acc[sale.productId].sales += 1;

      // Track retail vs wholesale
      const saleType = sale.saleType || 'retail';
      if (saleType === 'retail') {
        acc[sale.productId].retailSales += 1;
        acc[sale.productId].retailRevenue += sale.finalPrice;
      } else {
        acc[sale.productId].wholesaleSales += 1;
        acc[sale.productId].wholesaleRevenue += sale.finalPrice;
      }

      const product = products.find((p) => p.id === sale.productId);
      if (product) {
        const soldAmount = product.measurementType === 'quantity'
          ? sale.quantity
          : (sale.weight || 0);
        // Use wholesaleCostPrice for wholesale sales, wholesalePrice for retail sales
        const costPrice = sale.saleType === 'wholesale'
          ? (product.wholesaleCostPrice || product.wholesalePrice)
          : product.wholesalePrice;
        acc[sale.productId].profit += (sale.unitPrice - costPrice) * soldAmount;
      }

      return acc;
    }, {} as Record<string, { product: Product; quantity: number; revenue: number; profit: number; sales: number; retailSales: number; wholesaleSales: number; retailRevenue: number; wholesaleRevenue: number }>);

    const topSelling = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    const topRevenue = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Low stock products
    const lowStock = products.filter((p) => p.quantity <= p.minQuantity);

    // Out of stock products
    const outOfStock = products.filter((p) => p.quantity === 0);

    // Category performance
    const categoryPerformance = categories.map((category) => {
      const categoryProducts = products.filter(
        (p) => p.category === category.name
      );
      const categorySales = filteredSales.filter((sale) =>
        categoryProducts.some((p) => p.id === sale.productId)
      );

      // Calculate retail vs wholesale
      const retailSales = categorySales.filter(s => !s.saleType || s.saleType === 'retail');
      const wholesaleSales = categorySales.filter(s => s.saleType === 'wholesale');

      return {
        category: category.name,
        totalProducts: categoryProducts.length,
        sales: categorySales.length,
        retailSales: retailSales.length,
        wholesaleSales: wholesaleSales.length,
        revenue: categorySales.reduce((sum, sale) => sum + sale.finalPrice, 0),
        retailRevenue: retailSales.reduce((sum, sale) => sum + sale.finalPrice, 0),
        wholesaleRevenue: wholesaleSales.reduce((sum, sale) => sum + sale.finalPrice, 0),
        profit: categorySales.reduce((sum, sale) => {
          const product = products.find((p) => p.id === sale.productId);
          if (product) {
            const soldAmount = product.measurementType === 'quantity'
              ? sale.quantity
              : (sale.weight || 0);
            // Use wholesaleCostPrice for wholesale sales, wholesalePrice for retail sales
            const costPrice = sale.saleType === 'wholesale'
              ? (product.wholesaleCostPrice || product.wholesalePrice)
              : product.wholesalePrice;
            return sum + (sale.unitPrice - costPrice) * soldAmount;
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
    const totalInventoryValue = products.reduce(
      (sum, product) => sum + product.wholesalePrice * product.quantity,
      0
    );
    const totalRetailValue = products.reduce(
      (sum, product) => sum + product.salePrice * product.quantity,
      0
    );
    const potentialProfit = totalRetailValue - totalInventoryValue;

    const categoryInventory = categories.map((category) => {
      const categoryProducts = products.filter(
        (p) => p.category === category.name
      );
      return {
        category: category.name,
        productCount: categoryProducts.length,
        totalQuantity: categoryProducts.reduce((sum, p) => sum + p.quantity, 0),
        inventoryValue: categoryProducts.reduce(
          (sum, p) => sum + p.wholesalePrice * p.quantity,
          0
        ),
        retailValue: categoryProducts.reduce(
          (sum, p) => sum + p.salePrice * p.quantity,
          0
        ),
      };
    });

    return {
      totalProducts,
      totalInventoryValue,
      totalRetailValue,
      potentialProfit,
      categoryInventory,
      lowStockCount: products.filter((p) => isLowStock(p)).length,
      outOfStockCount: products.filter((p) => isOutOfStock(p)).length,
    };
  }, [products, categories]);

  // Filtered products for print preview based on stock status
  const filteredProductsForPrint = useMemo(() => {
    return products.filter((product) => {
      const isOut = isOutOfStock(product);
      const isLow = isLowStock(product);
      const isAvailable = !isOut && !isLow;

      // Include product if its status filter is enabled (mutually exclusive categories)
      if (isOut && printSettings.inventoryFilters.showOutOfStock) return true;
      if (isLow && !isOut && printSettings.inventoryFilters.showLowStock) return true;
      if (isAvailable && printSettings.inventoryFilters.showAvailable) return true;

      return false;
    });
  }, [products, printSettings.inventoryFilters]);

  const filteredSalesForPrint = useMemo(() => {
    return filteredSales.filter((sale) => {
      // Check sale type filter
      const saleType = sale.saleType || 'retail';
      const saleTypeMatch =
        (saleType === 'retail' && printSettings.salesFilters.showRetail) ||
        (saleType === 'wholesale' && printSettings.salesFilters.showWholesale);

      if (!saleTypeMatch) return false;

      // Check payment method filter
      const paymentMatch =
        (sale.paymentMethod === 'cash' && printSettings.salesFilters.showCash) ||
        (sale.paymentMethod === 'debt' && printSettings.salesFilters.showDebt);

      return paymentMatch;
    });
  }, [filteredSales, printSettings.salesFilters]);

  const returnsReport = useMemo(() => {
    const totalReturns = filteredReturns.length;
    const totalRefunds = filteredReturns.reduce(
      (sum, returnItem) => sum + returnItem.totalRefund,
      0
    );

    // Group returns by product
    const returnsByProduct = filteredReturns.reduce((acc, returnItem) => {
      const productId = returnItem.productId;
      if (!acc[productId]) {
        acc[productId] = {
          product: returnItem.product,
          returnCount: 0,
          totalReturned: 0,
          totalRefund: 0,
        };
      }
      acc[productId].returnCount += 1;
      acc[productId].totalReturned +=
        returnItem.returnedQuantity || returnItem.returnedWeight || 0;
      acc[productId].totalRefund += returnItem.totalRefund;
      return acc;
    }, {} as Record<string, { product: Product; returnCount: number; totalReturned: number; totalRefund: number }>);

    const mostReturnedProducts = Object.values(returnsByProduct)
      .sort((a, b) => b.returnCount - a.returnCount)
      .slice(0, 10);

    // Group returns by reason
    const returnsByReason = filteredReturns.reduce((acc, returnItem) => {
      const reason = returnItem.reason || "No reason provided";
      if (!acc[reason]) {
        acc[reason] = { count: 0, refund: 0 };
      }
      acc[reason].count += 1;
      acc[reason].refund += returnItem.totalRefund;
      return acc;
    }, {} as Record<string, { count: number; refund: number }>);

    // Daily returns
    const dailyReturns = filteredReturns.reduce((acc, returnItem) => {
      const date = new Date(returnItem.returnDate).toISOString().split("T")[0];
      if (!acc[date]) {
        acc[date] = { returns: 0, refund: 0 };
      }
      acc[date].returns += 1;
      acc[date].refund += returnItem.totalRefund;
      return acc;
    }, {} as Record<string, { returns: number; refund: number }>);

    return {
      totalReturns,
      totalRefunds,
      averageRefund: totalReturns > 0 ? totalRefunds / totalReturns : 0,
      mostReturnedProducts,
      returnsByReason: Object.entries(returnsByReason)
        .map(([reason, data]) => ({
          reason,
          ...data,
        }))
        .sort((a, b) => b.count - a.count),
      dailyReturns: Object.entries(dailyReturns)
        .map(([date, data]) => ({
          date,
          ...data,
        }))
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        ),
    };
  }, [filteredReturns, products]);

  // Access control: Users cannot access reports
  if (user?.role === "user") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="max-w-md border border-amber-200 bg-amber-50 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-semibold mb-2 text-amber-900">
                غير مصرح بالدخول
              </p>
              <p className="text-amber-800">
                ليس لديك صلاحية الوصول إلى التقارير. هذه الصفحة متاحة للمدراء
                ومساعديهم فقط.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Print handler - opens preview
  const handlePrintPreview = (type: 'sales' | 'inventory' | 'returns') => {
    setPreviewType(type);
    setShowPrintPreview(true);
  };

  // Actual print handler
  const handlePrint = () => {
    // Get the preview content
    const previewContent = document.querySelector('.print-preview-content');
    const printContainer = document.getElementById('print-only-container');

    if (previewContent && printContainer) {
      // Clone the content into the print container
      printContainer.innerHTML = previewContent.innerHTML;

      // Trigger print
      window.print();

      // Clean up after printing
      setTimeout(() => {
        printContainer.innerHTML = '';
      }, 100);
    }
  };

  return (
    <>
      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          /* Page setup */
          @page {
            size: A4 ${printSettings.orientation === 'landscape' ? 'landscape' : 'portrait'};
            margin: 1cm;
          }

          /* Hide everything */
          body * {
            visibility: hidden !important;
          }

          /* Hide the dialog completely */
          [role="dialog"],
          [data-radix-dialog-overlay],
          [data-slot="dialog-overlay"],
          [data-slot="dialog-content"],
          .print-preview-content,
          .space-y-6 {
            display: none !important;
            visibility: hidden !important;
          }

          /* Show ONLY the print-only container */
          #print-only-container,
          #print-only-container * {
            visibility: visible !important;
            display: block !important;
          }

          #print-only-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0.5cm !important;
          }

          /* Ensure tables display properly */
          #print-only-container table {
            display: table !important;
            width: 100% !important;
            border-collapse: collapse !important;
            page-break-inside: auto !important;
            page-break-before: auto !important;
            page-break-after: auto !important;
          }

          #print-only-container thead {
            display: table-header-group !important;
          }

          #print-only-container tbody {
            display: table-row-group !important;
          }

          #print-only-container tr {
            display: table-row !important;
            page-break-inside: avoid !important;
            page-break-after: auto !important;
          }

          #print-only-container th,
          #print-only-container td {
            display: table-cell !important;
            border: 1px solid #333 !important;
            padding: 8px !important;
            text-align: right !important;
            color: #000 !important;
          }

          #print-only-container th {
            background-color: #e5e5e5 !important;
            font-weight: bold !important;
          }

          #print-only-container td {
            background-color: white !important;
          }

          /* Stock status color overrides for print */
          #print-only-container td.bg-red-100 {
            background-color: #fee2e2 !important;
            color: #991b1b !important;
          }

          #print-only-container td.bg-amber-100 {
            background-color: #fef3c7 !important;
            color: #92400e !important;
          }

          #print-only-container td.bg-green-100 {
            background-color: #dcfce7 !important;
            color: #14532d !important;
          }

          /* Title and text styling */
          #print-only-container h2 {
            font-size: 20px !important;
            font-weight: bold !important;
            text-align: center !important;
            margin-bottom: 10px !important;
            padding-bottom: 10px !important;
            border-bottom: 2px solid #333 !important;
          }

          #print-only-container p {
            text-align: center !important;
            margin-bottom: 15px !important;
            color: #333 !important;
          }

          #print-only-container .text-center {
            text-align: center !important;
          }

          #print-only-container .border-b-2 {
            border-bottom: 2px solid #333 !important;
          }

          /* Ensure print quality */
          body {
            print-color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
            background: white !important;
          }
        }
      `}</style>

      {/* Print-only container - hidden on screen, visible during print */}
      <div
        id="print-only-container"
        style={{
          display: 'none',
          width: '210mm',
          minHeight: '297mm',
          padding: '1.5cm',
          background: 'white',
          color: 'black',
          fontSize: `${printSettings.textSize}px`
        }}
      />

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
              onChange={(e) =>
                setDateRange({ ...dateRange, startDate: e.target.value })
              }
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
              onChange={(e) =>
                setDateRange({ ...dateRange, endDate: e.target.value })
              }
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="bg-card border border-border rounded-lg p-1 flex flex-wrap gap-1">
        <button
          onClick={() => setActiveReport("sales")}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            activeReport === "sales"
              ? "bg-primary text-white"
              : "text-foreground hover:bg-secondary"
          }`}
        >
          تقرير المبيعات
        </button>
        <button
          onClick={() => setActiveReport("inventory")}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            activeReport === "inventory"
              ? "bg-primary text-white"
              : "text-foreground hover:bg-secondary"
          }`}
        >
          تقارير المخزون
        </button>
        <button
          onClick={() => setActiveReport("returns")}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            activeReport === "returns"
              ? "bg-primary text-white"
              : "text-foreground hover:bg-secondary"
          }`}
        >
          تقرير المرتجعات
        </button>
      </div>

      {/* Sales Report */}
      {activeReport === "sales" && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm  mb-1">إجمالي المبيعات</p>
                  <p className="text-2xl font-bold text-foreground">
                    {salesReport.totalSales}
                  </p>
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
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(salesReport.totalRevenue)}
                  </p>
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
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(salesReport.totalProfit)}
                  </p>
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
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(salesReport.averageSaleValue)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-[#1799b4] text-white flex items-center justify-center">
                  📊
                </div>
              </div>
            </div>
          </div>

          {/* Wholesale vs Retail Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Retail Sales Card */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-500 text-white flex items-center justify-center font-bold text-lg">
                  🏪
                </div>
                <h3 className="text-lg font-semibold text-blue-900">مبيعات التجزئة</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-700">عدد المبيعات:</span>
                  <span className="text-xl font-bold text-blue-900">
                    {filteredSales.filter(s => !s.saleType || s.saleType === 'retail').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-700">الإيرادات:</span>
                  <span className="text-lg font-semibold text-blue-900">
                    {formatCurrency(
                      filteredSales
                        .filter(s => !s.saleType || s.saleType === 'retail')
                        .reduce((sum, s) => sum + s.finalPrice, 0)
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-blue-300">
                  <span className="text-sm text-blue-700">الأرباح:</span>
                  <span className="text-lg font-semibold text-blue-900">
                    {formatCurrency(
                      filteredSales
                        .filter(s => !s.saleType || s.saleType === 'retail')
                        .reduce((sum, s) => {
                          const product = products.find(p => p.id === s.productId);
                          if (product) {
                            const soldAmount = product.measurementType === 'quantity' ? s.quantity : (s.weight || 0);
                            return sum + (s.unitPrice - product.wholesalePrice) * soldAmount;
                          }
                          return sum;
                        }, 0)
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Wholesale Sales Card */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-green-500 text-white flex items-center justify-center font-bold text-lg">
                  📦
                </div>
                <h3 className="text-lg font-semibold text-green-900">مبيعات الجملة</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-700">عدد المبيعات:</span>
                  <span className="text-xl font-bold text-green-900">
                    {filteredSales.filter(s => s.saleType === 'wholesale').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-700">الإيرادات:</span>
                  <span className="text-lg font-semibold text-green-900">
                    {formatCurrency(
                      filteredSales
                        .filter(s => s.saleType === 'wholesale')
                        .reduce((sum, s) => sum + s.finalPrice, 0)
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-green-300">
                  <span className="text-sm text-green-700">الأرباح:</span>
                  <span className="text-lg font-semibold text-green-900">
                    {formatCurrency(
                      filteredSales
                        .filter(s => s.saleType === 'wholesale')
                        .reduce((sum, s) => {
                          const product = products.find(p => p.id === s.productId);
                          if (product) {
                            const soldAmount = product.measurementType === 'quantity' ? s.quantity : (s.weight || 0);
                            // Calculate wholesale profit: selling price - cost price
                            const costPrice = product.wholesaleCostPrice || product.wholesalePrice;
                            return sum + (s.unitPrice - costPrice) * soldAmount;
                          }
                          return sum;
                        }, 0)
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              طرق الدفع
            </h3>
            <div className="space-y-3">
              {Object.entries(salesReport.paymentMethods).map(
                ([method, data]) => {
                  const methodNames = {
                    cash: "نقداً",
                    debt: "آجل",
                  };
                  return (
                    <div
                      key={method}
                      className="p-4 bg-secondary rounded-lg space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground text-lg">
                          {methodNames[method as keyof typeof methodNames] ||
                            method}
                        </span>
                        <div className="text-left">
                          <p className="font-bold text-foreground text-lg">
                            {formatCurrency(data.amount)}
                          </p>
                          <p className="text-sm text-muted-foreground">{data.count} مبيعة</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
                        <div className="bg-blue-50 p-2 rounded">
                          <p className="text-xs text-blue-600 font-medium">🏪 تجزئة</p>
                          <p className="text-sm font-semibold text-blue-700">
                            {formatCurrency(data.retailAmount)}
                          </p>
                          <p className="text-xs text-blue-600">{data.retailCount} مبيعة</p>
                        </div>
                        <div className="bg-green-50 p-2 rounded">
                          <p className="text-xs text-green-600 font-medium">📦 جملة</p>
                          <p className="text-sm font-semibold text-green-700">
                            {formatCurrency(data.wholesaleAmount)}
                          </p>
                          <p className="text-xs text-green-600">{data.wholesaleCount} مبيعة</p>
                        </div>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>

          {/* Sales Report Table */}
          <div className="bg-card border border-border rounded-lg p-6 print-table-container">
            {/* Print Header - Only visible when printing */}
            <div className="print-title hidden">
              تقرير المبيعات التفصيلي
            </div>
            <div className="print-date-range hidden">
              من {formatGregorianDate(dateRange.startDate)} إلى {formatGregorianDate(dateRange.endDate)}
            </div>

            <div className="flex items-center justify-between mb-4 no-print">
              <h3 className="text-lg font-semibold text-foreground">
                تفاصيل المبيعات
              </h3>
              <Button
                onClick={() => handlePrintPreview('sales')}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                طباعة التقرير
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary">
                  <tr>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">
                      المنتج
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">
                      النوع
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">
                      الكمية
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">
                      سعر الوحدة
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">
                      الإجمالي
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">
                      طريقة الدفع
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">
                      التاريخ والوقت
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-foreground no-print">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-secondary/50">
                      <td className="px-4 py-3 text-foreground">
                        <div className="font-medium">{sale.product.name}</div>
                        <div className="text-xs text-muted-foreground">{sale.product.category}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          className={
                            sale.saleType === "wholesale"
                              ? "bg-green-100 text-green-700 border-green-200"
                              : "bg-blue-100 text-blue-700 border-blue-200"
                          }
                        >
                          {sale.saleType === "wholesale" ? "📦 جملة" : "🏪 تجزئة"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {sale.product.measurementType === "quantity"
                          ? `${sale.quantity} قطعة`
                          : `${sale.weight} ${sale.weightUnit}`}
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {formatCurrency(sale.unitPrice)}
                      </td>
                      <td className="px-4 py-3 text-foreground font-semibold">
                        {formatCurrency(sale.finalPrice)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline">
                          {sale.paymentMethod === "cash" && "💵 نقداً"}
                          {sale.paymentMethod === "debt" && "📝 آجل"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {formatGregorianDate(new Date(sale.saleDate).toISOString().split("T")[0])}
                        <br />
                        <span className="text-xs text-muted-foreground">
                          {new Date(sale.saleDate).toLocaleTimeString('ar-IQ', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </td>
                      <td className="px-4 py-3 no-print">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedSale(sale)}
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          عرض
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredSales.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>لا توجد مبيعات في هذه الفترة</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Inventory Report */}
      {activeReport === "inventory" && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-black mb-1">إجمالي المنتجات</p>
                  <p className="text-2xl font-bold text-foreground">
                    {inventoryReport.totalProducts}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-primary text-white flex items-center justify-center">
                  📦
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-black mb-1">قيمة المخزون</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(inventoryReport.totalInventoryValue)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-success text-white flex items-center justify-center">
                  💰
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-black mb-1">القيمة بسعر التجزئة</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(inventoryReport.totalRetailValue)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-warning text-white flex items-center justify-center">
                  🏪
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-black mb-1">الربح المحتمل</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(inventoryReport.potentialProfit)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-danger text-white flex items-center justify-center">
                  📈
                </div>
              </div>
            </div>
          </div>

          {/* Stock Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                حالة المخزون
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-success/10 border border-success/20 rounded-lg">
                  <span className="font-medium text-foreground">
                    منتجات متوفرة
                  </span>
                  <span className="font-bold text-success">
                    {inventoryReport.totalProducts -
                      inventoryReport.lowStockCount -
                      inventoryReport.outOfStockCount}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-warning/10 border border-warning/20 rounded-lg">
                  <span className="font-medium text-foreground">
                    منتجات قليلة المخزون
                  </span>
                  <span className="font-bold text-warning">
                    {inventoryReport.lowStockCount}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-danger/10 border border-danger/20 rounded-lg">
                  <span className="font-medium text-foreground">
                    منتجات نفد مخزونها
                  </span>
                  <span className="font-bold text-danger">
                    {inventoryReport.outOfStockCount}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                ملخص الأرقام
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">متوسط قيمة المنتج:</span>
                  <span className="font-semibold text-foreground">
                    {formatCurrency(
                      inventoryReport.totalProducts > 0
                        ? inventoryReport.totalInventoryValue /
                            inventoryReport.totalProducts
                        : 0
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">هامش الربح المتوقع:</span>
                  <span className="font-semibold text-foreground">
                    {inventoryReport.totalInventoryValue > 0
                      ? (
                          (inventoryReport.potentialProfit /
                            inventoryReport.totalInventoryValue) *
                          100
                        ).toFixed(1)
                      : 0}
                    %
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">معدل دوران المخزون:</span>
                  <span className="font-semibold text-foreground">
                    {inventoryReport.totalInventoryValue > 0
                      ? (
                          salesReport.totalRevenue /
                          inventoryReport.totalInventoryValue
                        ).toFixed(2)
                      : 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Inventory Products Table */}
          <div className="bg-card border border-border rounded-lg p-6 print-table-container">
            {/* Print Header - Only visible when printing */}
            <div className="print-title hidden">
              تقرير المخزون التفصيلي
            </div>
            <div className="print-date-range hidden">
              تقرير محدث بتاريخ: {formatGregorianDate(new Date().toISOString().split("T")[0])}
            </div>

            <div className="flex items-center justify-between mb-4 no-print">
              <h3 className="text-lg font-semibold text-foreground">
                تفاصيل المخزون
              </h3>
              <Button
                onClick={() => handlePrintPreview('inventory')}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                طباعة التقرير
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary">
                  <tr>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">
                      المنتج
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">
                      الفئة
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">
                      حالة المخزون
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">
                      الكمية الحالية
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">
                      الحد الأدنى
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">
                      قيمة الجملة
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">
                      قيمة التجزئة
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-foreground no-print">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {products.map((product) => {
                    const stockStatusInfo = getStockStatus(product);
                    const isOut = isOutOfStock(product);
                    const isLow = isLowStock(product);

                    const wholesaleValue = product.wholesalePrice * product.quantity;
                    const retailValue = product.salePrice * product.quantity;

                    return (
                      <tr key={product.id} className="hover:bg-secondary/50">
                        <td className="px-4 py-3 text-foreground">
                          <div className="font-medium">{product.name}</div>
                          {product.barcode && (
                            <div className="text-xs text-muted-foreground font-mono">{product.barcode}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-foreground">
                          <div>{product.category}</div>
                          {product.subcategory && (
                            <div className="text-xs text-muted-foreground">{product.subcategory}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {isOut && (
                            <Badge className="bg-red-100 text-red-700 border-red-200">
                              ❌ {stockStatusInfo.text}
                            </Badge>
                          )}
                          {isLow && !isOut && (
                            <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                              ⚠️ {stockStatusInfo.text}
                            </Badge>
                          )}
                          {!isOut && !isLow && (
                            <Badge className="bg-green-100 text-green-700 border-green-200">
                              ✅ {stockStatusInfo.text}
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-foreground font-semibold">
                          {product.measurementType === "quantity"
                            ? `${product.quantity} قطعة`
                            : product.weight
                            ? `${product.weight} ${product.weightUnit}`
                            : `${product.quantity} ${product.weightUnit}`}
                        </td>
                        <td className="px-4 py-3 text-foreground">
                          {product.measurementType === "quantity"
                            ? `${product.minQuantity} قطعة`
                            : product.minWeight
                            ? `${product.minWeight} ${product.weightUnit}`
                            : `${product.minQuantity} ${product.weightUnit}`}
                        </td>
                        <td className="px-4 py-3 text-foreground">
                          {formatCurrency(wholesaleValue)}
                        </td>
                        <td className="px-4 py-3 text-foreground font-semibold">
                          {formatCurrency(retailValue)}
                        </td>
                        <td className="px-4 py-3 no-print">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedProduct(product)}
                            className="flex items-center gap-1"
                          >
                            <Eye className="h-4 w-4" />
                            عرض
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {products.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>لا توجد منتجات في المخزون</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Returns Report */}
      {activeReport === "returns" && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm mb-1">إجمالي المرتجعات</p>
                  <p className="text-2xl font-bold text-foreground">
                    {returnsReport.totalReturns}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-orange-500 text-white flex items-center justify-center">
                  ↩️
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm mb-1">إجمالي المبالغ المستردة</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(returnsReport.totalRefunds)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-red-500 text-white flex items-center justify-center">
                  💰
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm mb-1">متوسط المبلغ المسترد</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(returnsReport.averageRefund)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-amber-500 text-white flex items-center justify-center">
                  📊
                </div>
              </div>
            </div>
          </div>

          {/* Returns Report Table */}
          <div className="bg-card border border-border rounded-lg p-6 print-table-container">
            {/* Print Header - Only visible when printing */}
            <div className="print-title hidden">
              تقرير المرتجعات التفصيلي
            </div>
            <div className="print-date-range hidden">
              من {formatGregorianDate(dateRange.startDate)} إلى {formatGregorianDate(dateRange.endDate)}
            </div>

            <div className="flex items-center justify-between mb-4 no-print">
              <h3 className="text-lg font-semibold text-foreground">
                تفاصيل المرتجعات
              </h3>
              <Button
                onClick={() => handlePrintPreview('returns')}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                طباعة التقرير
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary">
                  <tr>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">
                      المنتج
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">
                      رقم البيعة
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">
                      الكمية المرتجعة
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">
                      المبلغ المسترد
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">
                      السبب
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">
                      التاريخ والوقت
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-foreground no-print">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredReturns.map((returnItem) => (
                    <tr key={returnItem.id} className="hover:bg-secondary/50">
                      <td className="px-4 py-3 text-foreground">
                        <div className="font-medium">{returnItem.product.name}</div>
                        <div className="text-xs text-muted-foreground">{returnItem.product.category}</div>
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        <span className="font-mono text-sm">{returnItem.saleId.slice(0, 8)}</span>
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {returnItem.product.measurementType === "quantity"
                          ? `${returnItem.returnedQuantity} قطعة`
                          : `${returnItem.returnedWeight} ${returnItem.weightUnit}`}
                      </td>
                      <td className="px-4 py-3 text-foreground font-semibold text-red-600">
                        -{formatCurrency(returnItem.totalRefund)}
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        <span className="text-sm">
                          {returnItem.reason ? (
                            returnItem.reason.length > 30
                              ? `${returnItem.reason.substring(0, 30)}...`
                              : returnItem.reason
                          ) : (
                            <span className="text-muted-foreground italic">لا يوجد سبب</span>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {formatGregorianDate(new Date(returnItem.returnDate).toISOString().split("T")[0])}
                        <br />
                        <span className="text-xs text-muted-foreground">
                          {new Date(returnItem.returnDate).toLocaleTimeString('ar-IQ', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </td>
                      <td className="px-4 py-3 no-print">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedReturn(returnItem)}
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          عرض
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredReturns.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>لا توجد مرتجعات في هذه الفترة</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sale Details Modal */}
      <Dialog open={selectedSale !== null} onOpenChange={() => setSelectedSale(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تفاصيل المبيعة</DialogTitle>
            <DialogDescription>
              معلومات كاملة عن المبيعة #{selectedSale?.id.slice(0, 8)}
            </DialogDescription>
          </DialogHeader>

          {selectedSale && (
            <div className="space-y-4">
              {/* Sale Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-secondary rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">رقم المبيعة</p>
                  <p className="font-semibold">{selectedSale.id.slice(0, 13)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">التاريخ والوقت</p>
                  <p className="font-semibold">
                    {formatGregorianDate(new Date(selectedSale.saleDate).toISOString().split("T")[0])}
                    {" "}
                    {new Date(selectedSale.saleDate).toLocaleTimeString('ar-IQ', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>

              {/* Product Info */}
              <div>
                <h4 className="font-semibold mb-2">معلومات المنتج</h4>
                <div className="grid grid-cols-2 gap-4 p-4 bg-secondary rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">اسم المنتج</p>
                    <p className="font-semibold">{selectedSale.product.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">الفئة</p>
                    <p className="font-semibold">{selectedSale.product.category}</p>
                  </div>
                  {selectedSale.product.barcode && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">الباركود</p>
                      <p className="font-mono text-sm">{selectedSale.product.barcode}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Sale Type */}
              <div>
                <h4 className="font-semibold mb-2">نوع المبيعة</h4>
                <Badge
                  className={
                    selectedSale.saleType === "wholesale"
                      ? "bg-green-100 text-green-700 border-green-200 text-lg px-4 py-2"
                      : "bg-blue-100 text-blue-700 border-blue-200 text-lg px-4 py-2"
                  }
                >
                  {selectedSale.saleType === "wholesale" ? "📦 مبيعة جملة" : "🏪 مبيعة تجزئة"}
                </Badge>
              </div>

              {/* Quantity */}
              <div>
                <h4 className="font-semibold mb-2">الكمية المباعة</h4>
                <div className="p-4 bg-secondary rounded-lg">
                  <p className="text-xl font-bold">
                    {selectedSale.product.measurementType === "quantity"
                      ? `${selectedSale.quantity} قطعة`
                      : `${selectedSale.weight} ${selectedSale.weightUnit}`}
                  </p>
                </div>
              </div>

              {/* Pricing Breakdown */}
              <div>
                <h4 className="font-semibold mb-2">تفاصيل السعر</h4>
                <div className="space-y-2 p-4 bg-secondary rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">سعر الوحدة:</span>
                    <span className="font-semibold">{formatCurrency(selectedSale.unitPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">السعر الإجمالي:</span>
                    <span className="font-semibold">{formatCurrency(selectedSale.totalPrice)}</span>
                  </div>
                  {selectedSale.discount > 0 && (
                    <div className="flex justify-between text-orange-600">
                      <span>الخصم:</span>
                      <span className="font-semibold">-{formatCurrency(selectedSale.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-border">
                    <span className="font-bold">المبلغ النهائي:</span>
                    <span className="font-bold text-lg text-primary">
                      {formatCurrency(selectedSale.finalPrice)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Profit Calculation */}
              <div>
                <h4 className="font-semibold mb-2">الربح</h4>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-xl font-bold text-green-700">
                    {formatCurrency(
                      (() => {
                        const product = products.find(p => p.id === selectedSale.productId);
                        if (product) {
                          const soldAmount = product.measurementType === 'quantity'
                            ? selectedSale.quantity
                            : (selectedSale.weight || 0);
                          // Use wholesaleCostPrice for wholesale sales, wholesalePrice for retail sales
                          const costPrice = selectedSale.saleType === 'wholesale'
                            ? (product.wholesaleCostPrice || product.wholesalePrice)
                            : product.wholesalePrice;
                          return (selectedSale.unitPrice - costPrice) * soldAmount;
                        }
                        return 0;
                      })()
                    )}
                  </p>
                </div>
              </div>

              {/* Customer & Payment */}
              <div>
                <h4 className="font-semibold mb-2">معلومات إضافية</h4>
                <div className="grid grid-cols-2 gap-4 p-4 bg-secondary rounded-lg">
                  {selectedSale.customerName && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">اسم العميل</p>
                      <p className="font-semibold">{selectedSale.customerName}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">طريقة الدفع</p>
                    <Badge variant="outline">
                      {selectedSale.paymentMethod === "cash" && "💵 نقداً"}
                      {selectedSale.paymentMethod === "debt" && "📝 آجل"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Product Details Modal */}
      <Dialog open={selectedProduct !== null} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تفاصيل المنتج</DialogTitle>
            <DialogDescription>
              معلومات كاملة عن المنتج #{selectedProduct?.id.slice(0, 8)}
            </DialogDescription>
          </DialogHeader>

          {selectedProduct && (
            <div className="space-y-4">
              {/* Product Image */}
              {selectedProduct.imageUrl && (
                <div className="flex justify-center">
                  <img
                    src={selectedProduct.imageUrl}
                    alt={selectedProduct.name}
                    className="w-48 h-48 object-cover rounded-lg border border-border"
                  />
                </div>
              )}

              {/* Basic Info */}
              <div>
                <h4 className="font-semibold mb-2">المعلومات الأساسية</h4>
                <div className="grid grid-cols-2 gap-4 p-4 bg-secondary rounded-lg">
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground mb-1">اسم المنتج</p>
                    <p className="font-semibold text-lg">{selectedProduct.name}</p>
                  </div>
                  {selectedProduct.description && (
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground mb-1">الوصف</p>
                      <p className="text-foreground">{selectedProduct.description}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">الفئة</p>
                    <p className="font-semibold">{selectedProduct.category}</p>
                  </div>
                  {selectedProduct.subcategory && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">الفئة الفرعية</p>
                      <p className="font-semibold">{selectedProduct.subcategory}</p>
                    </div>
                  )}
                  {selectedProduct.barcode && (
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground mb-1">الباركود</p>
                      <p className="font-mono text-lg">{selectedProduct.barcode}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Measurement Details */}
              <div>
                <h4 className="font-semibold mb-2">نوع القياس</h4>
                <div className="p-4 bg-secondary rounded-lg">
                  <Badge className="text-lg px-4 py-2">
                    {selectedProduct.measurementType === "quantity" ? "📦 عدد القطع" : "⚖️ الوزن"}
                  </Badge>
                  {selectedProduct.measurementType === "weight" && selectedProduct.weightUnit && (
                    <p className="mt-2 text-muted-foreground">
                      الوحدة: {selectedProduct.weightUnit === "kg" ? "كيلوجرام" : "جرام"}
                    </p>
                  )}
                </div>
              </div>

              {/* Stock Information */}
              <div>
                <h4 className="font-semibold mb-2">معلومات المخزون</h4>
                <div className="grid grid-cols-2 gap-4 p-4 bg-secondary rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">الكمية الحالية</p>
                    <p className="font-semibold text-xl">
                      {selectedProduct.measurementType === "quantity"
                        ? `${selectedProduct.quantity} قطعة`
                        : selectedProduct.weight
                        ? `${selectedProduct.weight} ${selectedProduct.weightUnit}`
                        : `${selectedProduct.quantity} ${selectedProduct.weightUnit}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">الحد الأدنى</p>
                    <p className="font-semibold text-xl">
                      {selectedProduct.measurementType === "quantity"
                        ? `${selectedProduct.minQuantity} قطعة`
                        : selectedProduct.minWeight
                        ? `${selectedProduct.minWeight} ${selectedProduct.weightUnit}`
                        : `${selectedProduct.minQuantity} ${selectedProduct.weightUnit}`}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground mb-2">حالة المخزون</p>
                    {selectedProduct.quantity === 0 && (
                      <Badge className="bg-red-100 text-red-700 border-red-200 text-lg px-4 py-2">
                        ❌ نفد المخزون
                      </Badge>
                    )}
                    {selectedProduct.quantity > 0 && selectedProduct.quantity <= selectedProduct.minQuantity && (
                      <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-lg px-4 py-2">
                        ⚠️ مخزون قليل
                      </Badge>
                    )}
                    {selectedProduct.quantity > selectedProduct.minQuantity && (
                      <Badge className="bg-green-100 text-green-700 border-green-200 text-lg px-4 py-2">
                        ✅ مخزون جيد
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Pricing Information */}
              <div>
                <h4 className="font-semibold mb-2">معلومات التسعير</h4>
                <div className="space-y-3 p-4 bg-secondary rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">سعر الجملة (شراء):</span>
                    <span className="font-semibold text-lg">{formatCurrency(selectedProduct.wholesalePrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">سعر التجزئة (بيع):</span>
                    <span className="font-semibold text-lg">{formatCurrency(selectedProduct.salePrice)}</span>
                  </div>
                  {selectedProduct.wholesaleCostPrice && selectedProduct.wholesaleCostPrice > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>سعر الشراء (جملة):</span>
                      <span className="font-semibold">{formatCurrency(selectedProduct.wholesaleCostPrice)}</span>
                    </div>
                  )}
                  {selectedProduct.discount > 0 && (
                    <div className="flex justify-between text-orange-600">
                      <span>الخصم الثابت:</span>
                      <span className="font-semibold">{formatCurrency(selectedProduct.discount)}</span>
                    </div>
                  )}
                  <div className="pt-3 border-t border-border">
                    <div className="flex justify-between">
                      <span className="font-bold">هامش الربح:</span>
                      <span className="font-bold text-lg text-green-600">
                        {formatCurrency(selectedProduct.salePrice - selectedProduct.wholesalePrice)}
                      </span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-sm text-muted-foreground">نسبة الربح:</span>
                      <span className="text-sm font-semibold text-green-600">
                        {selectedProduct.wholesalePrice > 0
                          ? (((selectedProduct.salePrice - selectedProduct.wholesalePrice) / selectedProduct.wholesalePrice) * 100).toFixed(1)
                          : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Inventory Value */}
              <div>
                <h4 className="font-semibold mb-2">قيمة المخزون</h4>
                <div className="grid grid-cols-2 gap-4 p-4 bg-secondary rounded-lg">
                  <div className="p-3 bg-blue-50 rounded">
                    <p className="text-sm text-blue-600 mb-1">قيمة الشراء الإجمالية</p>
                    <p className="font-bold text-lg text-blue-700">
                      {formatCurrency(selectedProduct.wholesalePrice * selectedProduct.quantity)}
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 rounded">
                    <p className="text-sm text-green-600 mb-1">قيمة البيع المحتملة</p>
                    <p className="font-bold text-lg text-green-700">
                      {formatCurrency(selectedProduct.salePrice * selectedProduct.quantity)}
                    </p>
                  </div>
                  <div className="col-span-2 p-3 bg-purple-50 rounded">
                    <p className="text-sm text-purple-600 mb-1">الربح المحتمل</p>
                    <p className="font-bold text-xl text-purple-700">
                      {formatCurrency((selectedProduct.salePrice - selectedProduct.wholesalePrice) * selectedProduct.quantity)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Currency */}
              <div>
                <h4 className="font-semibold mb-2">العملة</h4>
                <div className="p-4 bg-secondary rounded-lg">
                  <Badge variant="outline" className="text-lg px-4 py-2">
                    {selectedProduct.currency === "IQD" ? "🇮🇶 دينار عراقي (IQD)" : "🇺🇸 دولار أمريكي (USD)"}
                  </Badge>
                </div>
              </div>

              {/* Timestamps */}
              <div>
                <h4 className="font-semibold mb-2">التواريخ</h4>
                <div className="grid grid-cols-2 gap-4 p-4 bg-secondary rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">تاريخ الإضافة</p>
                    <p className="font-semibold">
                      {formatGregorianDate(new Date(selectedProduct.createdAt).toISOString().split("T")[0])}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(selectedProduct.createdAt).toLocaleTimeString('ar-IQ', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">آخر تحديث</p>
                    <p className="font-semibold">
                      {formatGregorianDate(new Date(selectedProduct.updatedAt).toISOString().split("T")[0])}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(selectedProduct.updatedAt).toLocaleTimeString('ar-IQ', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Return Details Modal */}
      <Dialog open={selectedReturn !== null} onOpenChange={() => setSelectedReturn(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تفاصيل المرتجع</DialogTitle>
            <DialogDescription>
              معلومات كاملة عن المرتجع #{selectedReturn?.id.slice(0, 8)}
            </DialogDescription>
          </DialogHeader>

          {selectedReturn && (
            <div className="space-y-4">
              {/* Return Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-secondary rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">رقم المرتجع</p>
                  <p className="font-semibold font-mono">{selectedReturn.id.slice(0, 13)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">التاريخ والوقت</p>
                  <p className="font-semibold">
                    {formatGregorianDate(new Date(selectedReturn.returnDate).toISOString().split("T")[0])}
                    {" "}
                    {new Date(selectedReturn.returnDate).toLocaleTimeString('ar-IQ', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">رقم البيعة الأصلية</p>
                  <p className="font-semibold font-mono">{selectedReturn.saleId.slice(0, 13)}</p>
                </div>
              </div>

              {/* Product Info */}
              <div>
                <h4 className="font-semibold mb-2">معلومات المنتج</h4>
                <div className="grid grid-cols-2 gap-4 p-4 bg-secondary rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">اسم المنتج</p>
                    <p className="font-semibold">{selectedReturn.product.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">الفئة</p>
                    <p className="font-semibold">{selectedReturn.product.category}</p>
                  </div>
                  {selectedReturn.product.subcategory && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">الفئة الفرعية</p>
                      <p className="font-semibold">{selectedReturn.product.subcategory}</p>
                    </div>
                  )}
                  {selectedReturn.product.barcode && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">الباركود</p>
                      <p className="font-mono text-sm">{selectedReturn.product.barcode}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Returned Quantity */}
              <div>
                <h4 className="font-semibold mb-2">الكمية المرتجعة</h4>
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-2xl font-bold text-orange-700">
                    {selectedReturn.product.measurementType === "quantity"
                      ? `${selectedReturn.returnedQuantity} قطعة`
                      : `${selectedReturn.returnedWeight} ${selectedReturn.weightUnit}`}
                  </p>
                </div>
              </div>

              {/* Pricing */}
              <div>
                <h4 className="font-semibold mb-2">تفاصيل الاسترداد</h4>
                <div className="space-y-2 p-4 bg-secondary rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">سعر الوحدة:</span>
                    <span className="font-semibold">{formatCurrency(selectedReturn.unitPrice)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-border">
                    <span className="font-bold">المبلغ المسترد:</span>
                    <span className="font-bold text-xl text-red-600">
                      -{formatCurrency(selectedReturn.totalRefund)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div>
                <h4 className="font-semibold mb-2">سبب الإرجاع</h4>
                <div className="p-4 bg-secondary rounded-lg">
                  {selectedReturn.reason ? (
                    <p className="text-foreground">{selectedReturn.reason}</p>
                  ) : (
                    <p className="text-muted-foreground italic">لم يتم تحديد سبب للإرجاع</p>
                  )}
                </div>
              </div>

              {/* Processed By */}
              {selectedReturn.processedBy && (
                <div>
                  <h4 className="font-semibold mb-2">تمت المعالجة بواسطة</h4>
                  <div className="p-4 bg-secondary rounded-lg">
                    <p className="font-semibold text-foreground">{selectedReturn.processedBy}</p>
                  </div>
                </div>
              )}

              {/* Additional Info Alert */}
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5">⚠️</span>
                  <div className="text-sm text-amber-800">
                    <p className="font-semibold mb-1">ملاحظة</p>
                    <p>
                      تم إعادة المنتج إلى المخزون وتم خصم المبلغ المسترد من إجمالي المبيعات.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Print Preview Dialog */}
      <Dialog open={showPrintPreview} onOpenChange={setShowPrintPreview}>
        <DialogContent size="full" className="w-full h-[90vh] p-0 overflow-hidden !flex !flex-row !gap-0" data-print-active="true">
          <DialogHeader className="sr-only">
            <DialogTitle>إعدادات الطباعة</DialogTitle>
          </DialogHeader>
            {/* Left Side - Print Settings (30%) */}
            <div className="w-[30%] border-l border-border overflow-y-auto p-6 flex-shrink-0 bg-gray-50">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-foreground mb-2">إعدادات الطباعة</h3>
                <p className="text-sm text-muted-foreground">خصص التقرير حسب احتياجاتك</p>
              </div>

              {/* Common Settings */}
              <div className="space-y-6">
                {/* Text Size */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    حجم النص (بكسل)
                  </label>
                  <input
                    type="number"
                    value={printSettings.textSize}
                    onChange={(e) => setPrintSettings({...printSettings, textSize: parseInt(e.target.value) || 14})}
                    min="8"
                    max="32"
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="14"
                  />
                </div>

                {/* Orientation */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    اتجاه الصفحة
                  </label>
                  <select
                    value={printSettings.orientation}
                    onChange={(e) => setPrintSettings({...printSettings, orientation: e.target.value as 'portrait' | 'landscape'})}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="portrait">عمودي (Portrait)</option>
                    <option value="landscape">أفقي (Landscape)</option>
                  </select>
                </div>

                {/* Show Title */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="showTitle"
                    checked={printSettings.showTitle}
                    onChange={(e) => setPrintSettings({...printSettings, showTitle: e.target.checked})}
                    className="w-4 h-4 rounded border-border"
                  />
                  <label htmlFor="showTitle" className="text-sm font-medium text-foreground">
                    إظهار عنوان التقرير والتاريخ
                  </label>
                </div>

                <div className="border-t border-border pt-4" />

                {/* Column Selection - Sales Report */}
                {previewType === 'sales' && (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-3">الأعمدة المعروضة</h4>
                    <div className="space-y-2">
                      {[
                        { key: 'date', label: 'التاريخ' },
                        { key: 'product', label: 'المنتج' },
                        { key: 'type', label: 'النوع (تجزئة/جملة)' },
                        { key: 'quantity', label: 'الكمية' },
                        { key: 'price', label: 'سعر الوحدة' },
                        { key: 'total', label: 'الإجمالي' },
                        { key: 'payment', label: 'طريقة الدفع' },
                        { key: 'customer', label: 'اسم العميل' },
                      ].map(({key, label}) => (
                        <div key={key} className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id={`sales-${key}`}
                            checked={printSettings.salesColumns[key as keyof typeof printSettings.salesColumns]}
                            onChange={(e) => setPrintSettings({
                              ...printSettings,
                              salesColumns: {...printSettings.salesColumns, [key]: e.target.checked}
                            })}
                            className="w-4 h-4 rounded border-border"
                          />
                          <label htmlFor={`sales-${key}`} className="text-sm text-foreground">
                            {label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sale Type and Payment Method Filters - Sales Report */}
                {previewType === 'sales' && (
                  <div className="pt-4 border-t border-border">
                    <h4 className="text-sm font-semibold text-foreground mb-3">تصفية المبيعات</h4>
                    <div className="space-y-3">
                      {/* Sale Type Filters */}
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">نوع البيع</p>
                        <div className="space-y-2 pl-2">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              id="filter-retail"
                              checked={printSettings.salesFilters.showRetail}
                              onChange={(e) => setPrintSettings({
                                ...printSettings,
                                salesFilters: {...printSettings.salesFilters, showRetail: e.target.checked}
                              })}
                              className="w-4 h-4 rounded border-border"
                            />
                            <label htmlFor="filter-retail" className="text-sm text-foreground flex items-center gap-2">
                              🏪 تجزئة (Retail)
                            </label>
                          </div>
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              id="filter-wholesale"
                              checked={printSettings.salesFilters.showWholesale}
                              onChange={(e) => setPrintSettings({
                                ...printSettings,
                                salesFilters: {...printSettings.salesFilters, showWholesale: e.target.checked}
                              })}
                              className="w-4 h-4 rounded border-border"
                            />
                            <label htmlFor="filter-wholesale" className="text-sm text-foreground flex items-center gap-2">
                              📦 جملة (Wholesale)
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Payment Method Filters */}
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">طريقة الدفع</p>
                        <div className="space-y-2 pl-2">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              id="filter-cash"
                              checked={printSettings.salesFilters.showCash}
                              onChange={(e) => setPrintSettings({
                                ...printSettings,
                                salesFilters: {...printSettings.salesFilters, showCash: e.target.checked}
                              })}
                              className="w-4 h-4 rounded border-border"
                            />
                            <label htmlFor="filter-cash" className="text-sm text-foreground flex items-center gap-2">
                              💵 نقداً (Cash)
                            </label>
                          </div>
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              id="filter-debt"
                              checked={printSettings.salesFilters.showDebt}
                              onChange={(e) => setPrintSettings({
                                ...printSettings,
                                salesFilters: {...printSettings.salesFilters, showDebt: e.target.checked}
                              })}
                              className="w-4 h-4 rounded border-border"
                            />
                            <label htmlFor="filter-debt" className="text-sm text-foreground flex items-center gap-2">
                              📝 آجل (Debt)
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Column Selection - Inventory Report */}
                {previewType === 'inventory' && (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-3">الأعمدة المعروضة</h4>
                    <div className="space-y-2">
                      {[
                        { key: 'product', label: 'المنتج' },
                        { key: 'category', label: 'الفئة' },
                        { key: 'status', label: 'حالة المخزون' },
                        { key: 'quantity', label: 'الكمية' },
                        { key: 'wholesaleValue', label: 'قيمة الجملة' },
                        { key: 'retailValue', label: 'قيمة التجزئة' },
                        { key: 'barcode', label: 'الباركود' },
                      ].map(({key, label}) => (
                        <div key={key} className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id={`inventory-${key}`}
                            checked={printSettings.inventoryColumns[key as keyof typeof printSettings.inventoryColumns]}
                            onChange={(e) => setPrintSettings({
                              ...printSettings,
                              inventoryColumns: {...printSettings.inventoryColumns, [key]: e.target.checked}
                            })}
                            className="w-4 h-4 rounded border-border"
                          />
                          <label htmlFor={`inventory-${key}`} className="text-sm text-foreground">
                            {label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stock Status Filters - Inventory Report */}
                {previewType === 'inventory' && (
                  <div className="pt-4 border-t border-border">
                    <h4 className="text-sm font-semibold text-foreground mb-3">تصفية المنتجات</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="filter-out-of-stock"
                          checked={printSettings.inventoryFilters.showOutOfStock}
                          onChange={(e) => setPrintSettings({
                            ...printSettings,
                            inventoryFilters: {...printSettings.inventoryFilters, showOutOfStock: e.target.checked}
                          })}
                          className="w-4 h-4 rounded border-border"
                        />
                        <label htmlFor="filter-out-of-stock" className="text-sm text-foreground flex items-center gap-2">
                          ❌ عرض منتجات نفد المخزون
                        </label>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="filter-low-stock"
                          checked={printSettings.inventoryFilters.showLowStock}
                          onChange={(e) => setPrintSettings({
                            ...printSettings,
                            inventoryFilters: {...printSettings.inventoryFilters, showLowStock: e.target.checked}
                          })}
                          className="w-4 h-4 rounded border-border"
                        />
                        <label htmlFor="filter-low-stock" className="text-sm text-foreground flex items-center gap-2">
                          ⚠️ عرض منتجات قليلة المخزون
                        </label>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="filter-available"
                          checked={printSettings.inventoryFilters.showAvailable}
                          onChange={(e) => setPrintSettings({
                            ...printSettings,
                            inventoryFilters: {...printSettings.inventoryFilters, showAvailable: e.target.checked}
                          })}
                          className="w-4 h-4 rounded border-border"
                        />
                        <label htmlFor="filter-available" className="text-sm text-foreground flex items-center gap-2">
                          ✅ عرض منتجات متوفرة
                        </label>
                      </div>
                    </div>

                    {/* Notes Section */}
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold text-foreground mb-3">ملاحظات</h4>
                      <Textarea
                        id="inventory-notes"
                        placeholder="أدخل أي ملاحظات تريد طباعتها مع التقرير..."
                        value={printSettings.inventoryNotes}
                        onChange={(e) => setPrintSettings({
                          ...printSettings,
                          inventoryNotes: e.target.value
                        })}
                        className="min-h-[100px] text-sm"
                        dir="rtl"
                      />
                    </div>
                  </div>
                )}

                {/* Column Selection - Returns Report */}
                {previewType === 'returns' && (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-3">الأعمدة المعروضة</h4>
                    <div className="space-y-2">
                      {[
                        { key: 'date', label: 'التاريخ' },
                        { key: 'product', label: 'المنتج' },
                        { key: 'quantity', label: 'الكمية المرتجعة' },
                        { key: 'refund', label: 'المبلغ المسترد' },
                        { key: 'reason', label: 'السبب' },
                        { key: 'processor', label: 'المعالج' },
                      ].map(({key, label}) => (
                        <div key={key} className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id={`returns-${key}`}
                            checked={printSettings.returnsColumns[key as keyof typeof printSettings.returnsColumns]}
                            onChange={(e) => setPrintSettings({
                              ...printSettings,
                              returnsColumns: {...printSettings.returnsColumns, [key]: e.target.checked}
                            })}
                            className="w-4 h-4 rounded border-border"
                          />
                          <label htmlFor={`returns-${key}`} className="text-sm text-foreground">
                            {label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Side - Print Preview */}
            <div className="w-[70%] bg-gray-100 overflow-hidden flex flex-col flex-shrink-0">
              <div className="p-4 bg-white border-b border-border flex items-center justify-between">
                <h3 className="text-xl font-bold text-foreground">معاينة الطباعة</h3>
                <div className="flex gap-2">
                  <Button onClick={() => setShowPrintPreview(false)} variant="outline">
                    إلغاء
                  </Button>
                  <Button onClick={handlePrint} className="flex items-center gap-2">
                    <Printer className="h-4 w-4" />
                    طباعة
                  </Button>
                </div>
              </div>

              {/* Print Preview Content */}
              <div className="flex-1 overflow-auto p-6">
                <div className="bg-white shadow-lg mx-auto print-preview-content" style={{ width: '210mm', minHeight: '297mm', padding: '1.5cm' }}>
                  {/* Preview Title */}
                  {printSettings.showTitle && (
                    <>
                      <div className="text-center mb-6 pb-4 border-b-2 border-gray-800">
                        <h2 className="text-2xl font-bold">
                          {previewType === 'sales' && 'تقرير المبيعات التفصيلي'}
                          {previewType === 'inventory' && 'تقرير المخزون التفصيلي'}
                          {previewType === 'returns' && 'تقرير المرتجعات التفصيلي'}
                        </h2>
                      </div>

                      {/* Preview Date Range */}
                      <div className="text-center mb-4 text-gray-600">
                        {previewType === 'inventory' ? (
                          <p>تقرير محدث بتاريخ: {formatGregorianDate(new Date().toISOString().split("T")[0])}</p>
                        ) : (
                          <p>من {formatGregorianDate(dateRange.startDate)} إلى {formatGregorianDate(dateRange.endDate)}</p>
                        )}
                      </div>
                    </>
                  )}

                  {/* Preview Table */}
                  <div style={{ fontSize: `${printSettings.textSize}px` }}>
                    {previewType === 'sales' && (
                      <table className="w-full border-collapse">
                        <thead className="bg-gray-200">
                          <tr>
                            {printSettings.salesColumns.product && (
                              <th className="px-2 py-2 text-right font-semibold border border-gray-800">المنتج</th>
                            )}
                            {printSettings.salesColumns.type && (
                              <th className="px-2 py-2 text-right font-semibold border border-gray-800">النوع</th>
                            )}
                            {printSettings.salesColumns.quantity && (
                              <th className="px-2 py-2 text-right font-semibold border border-gray-800">الكمية</th>
                            )}
                            {printSettings.salesColumns.price && (
                              <th className="px-2 py-2 text-right font-semibold border border-gray-800">السعر</th>
                            )}
                            {printSettings.salesColumns.total && (
                              <th className="px-2 py-2 text-right font-semibold border border-gray-800">الإجمالي</th>
                            )}
                            {printSettings.salesColumns.payment && (
                              <th className="px-2 py-2 text-right font-semibold border border-gray-800">طريقة الدفع</th>
                            )}
                            {printSettings.salesColumns.customer && (
                              <th className="px-2 py-2 text-right font-semibold border border-gray-800">العميل</th>
                            )}
                            {printSettings.salesColumns.date && (
                              <th className="px-2 py-2 text-right font-semibold border border-gray-800">التاريخ</th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredSalesForPrint.map((sale) => (
                            <tr key={sale.id}>
                              {printSettings.salesColumns.product && (
                                <td className="px-2 py-1 border border-gray-800">{sale.product.name}</td>
                              )}
                              {printSettings.salesColumns.type && (
                                <td className="px-2 py-1 border border-gray-800">
                                  {sale.saleType === "wholesale" ? "جملة" : "تجزئة"}
                                </td>
                              )}
                              {printSettings.salesColumns.quantity && (
                                <td className="px-2 py-1 border border-gray-800">
                                  {sale.product.measurementType === "quantity"
                                    ? `${sale.quantity} قطعة`
                                    : `${sale.weight} ${sale.weightUnit}`}
                                </td>
                              )}
                              {printSettings.salesColumns.price && (
                                <td className="px-2 py-1 border border-gray-800">{formatCurrency(sale.unitPrice)}</td>
                              )}
                              {printSettings.salesColumns.total && (
                                <td className="px-2 py-1 border border-gray-800 font-semibold">{formatCurrency(sale.finalPrice)}</td>
                              )}
                              {printSettings.salesColumns.payment && (
                                <td className="px-2 py-1 border border-gray-800">
                                  {sale.paymentMethod === 'cash' ? 'نقداً' : 'آجل'}
                                </td>
                              )}
                              {printSettings.salesColumns.customer && (
                                <td className="px-2 py-1 border border-gray-800">{sale.customerName || '-'}</td>
                              )}
                              {printSettings.salesColumns.date && (
                                <td className="px-2 py-1 border border-gray-800">
                                  {formatGregorianDate(new Date(sale.saleDate).toISOString().split("T")[0])}
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    {previewType === 'inventory' && (
                      <table className="w-full border-collapse">
                        <thead className="bg-gray-200">
                          <tr>
                            {printSettings.inventoryColumns.product && (
                              <th className="px-2 py-2 text-right font-semibold border border-gray-800">المنتج</th>
                            )}
                            {printSettings.inventoryColumns.category && (
                              <th className="px-2 py-2 text-right font-semibold border border-gray-800">الفئة</th>
                            )}
                            {printSettings.inventoryColumns.status && (
                              <th className="px-2 py-2 text-right font-semibold border border-gray-800">الحالة</th>
                            )}
                            {printSettings.inventoryColumns.quantity && (
                              <th className="px-2 py-2 text-right font-semibold border border-gray-800">الكمية</th>
                            )}
                            {printSettings.inventoryColumns.wholesaleValue && (
                              <th className="px-2 py-2 text-right font-semibold border border-gray-800">قيمة الجملة</th>
                            )}
                            {printSettings.inventoryColumns.retailValue && (
                              <th className="px-2 py-2 text-right font-semibold border border-gray-800">قيمة التجزئة</th>
                            )}
                            {printSettings.inventoryColumns.barcode && (
                              <th className="px-2 py-2 text-right font-semibold border border-gray-800">الباركود</th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredProductsForPrint.map((product) => {
                            const stockStatusInfo = getStockStatus(product);
                            const isOut = isOutOfStock(product);
                            const isLow = isLowStock(product);

                            // Determine background color class based on status
                            const statusBgClass = isOut
                              ? 'bg-red-100 text-red-800'
                              : isLow
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-green-100 text-green-800';

                            // Determine icon
                            const statusIcon = isOut ? '❌' : isLow ? '⚠️' : '✅';

                            return (
                              <tr key={product.id}>
                                {printSettings.inventoryColumns.product && (
                                  <td className="px-2 py-1 border border-gray-800">{product.name}</td>
                                )}
                                {printSettings.inventoryColumns.category && (
                                  <td className="px-2 py-1 border border-gray-800">{product.category}</td>
                                )}
                                {printSettings.inventoryColumns.status && (
                                  <td className={`px-2 py-1 border border-gray-800 font-medium ${statusBgClass}`}>
                                    {statusIcon} {stockStatusInfo.text}
                                  </td>
                                )}
                                {printSettings.inventoryColumns.quantity && (
                                  <td className="px-2 py-1 border border-gray-800">
                                    {product.measurementType === "quantity"
                                      ? `${product.quantity} قطعة`
                                      : `${product.weight || product.quantity} ${product.weightUnit}`}
                                  </td>
                                )}
                                {printSettings.inventoryColumns.wholesaleValue && (
                                  <td className="px-2 py-1 border border-gray-800">
                                    {formatCurrency(product.wholesalePrice * product.quantity)}
                                  </td>
                                )}
                                {printSettings.inventoryColumns.retailValue && (
                                  <td className="px-2 py-1 border border-gray-800 font-semibold">
                                    {formatCurrency(product.salePrice * product.quantity)}
                                  </td>
                                )}
                                {printSettings.inventoryColumns.barcode && (
                                  <td className="px-2 py-1 border border-gray-800">{product.barcode || '-'}</td>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}

                    {/* Inventory Notes Display */}
                    {previewType === 'inventory' && printSettings.inventoryNotes && (
                      <div className="mt-6 p-4 border border-gray-300 rounded bg-gray-50">
                        <h3 className="text-base font-semibold mb-2">ملاحظات:</h3>
                        <p className="text-sm whitespace-pre-wrap" dir="rtl">
                          {printSettings.inventoryNotes}
                        </p>
                      </div>
                    )}

                    {previewType === 'returns' && (
                      <table className="w-full border-collapse">
                        <thead className="bg-gray-200">
                          <tr>
                            {printSettings.returnsColumns.product && (
                              <th className="px-2 py-2 text-right font-semibold border border-gray-800">المنتج</th>
                            )}
                            {printSettings.returnsColumns.quantity && (
                              <th className="px-2 py-2 text-right font-semibold border border-gray-800">الكمية</th>
                            )}
                            {printSettings.returnsColumns.refund && (
                              <th className="px-2 py-2 text-right font-semibold border border-gray-800">المبلغ المسترد</th>
                            )}
                            {printSettings.returnsColumns.reason && (
                              <th className="px-2 py-2 text-right font-semibold border border-gray-800">السبب</th>
                            )}
                            {printSettings.returnsColumns.processor && (
                              <th className="px-2 py-2 text-right font-semibold border border-gray-800">المعالج</th>
                            )}
                            {printSettings.returnsColumns.date && (
                              <th className="px-2 py-2 text-right font-semibold border border-gray-800">التاريخ</th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredReturns.map((returnItem) => (
                            <tr key={returnItem.id}>
                              {printSettings.returnsColumns.product && (
                                <td className="px-2 py-1 border border-gray-800">{returnItem.product.name}</td>
                              )}
                              {printSettings.returnsColumns.quantity && (
                                <td className="px-2 py-1 border border-gray-800">
                                  {returnItem.product.measurementType === "quantity"
                                    ? `${returnItem.returnedQuantity} قطعة`
                                    : `${returnItem.returnedWeight} ${returnItem.weightUnit}`}
                                </td>
                              )}
                              {printSettings.returnsColumns.refund && (
                                <td className="px-2 py-1 border border-gray-800 font-semibold text-red-600">
                                  -{formatCurrency(returnItem.totalRefund)}
                                </td>
                              )}
                              {printSettings.returnsColumns.reason && (
                                <td className="px-2 py-1 border border-gray-800">
                                  {returnItem.reason || 'لا يوجد سبب'}
                                </td>
                              )}
                              {printSettings.returnsColumns.processor && (
                                <td className="px-2 py-1 border border-gray-800">{returnItem.processedBy || '-'}</td>
                              )}
                              {printSettings.returnsColumns.date && (
                                <td className="px-2 py-1 border border-gray-800">
                                  {formatGregorianDate(new Date(returnItem.returnDate).toISOString().split("T")[0])}
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            </div>
        </DialogContent>
      </Dialog>
      </div>
    </>
  );
}

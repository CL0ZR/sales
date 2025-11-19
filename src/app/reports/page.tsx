'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { Sale, Product, Return } from '@/types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import ReportFilters from './components/shared/ReportFilters';
import ReportTabs from './components/ReportTabs';
import PrintPreviewDialog from './components/shared/PrintPreviewDialog';

export default function Reports() {
  const { state, refreshData } = useApp();
  const { products, sales, returns } = state;
  const { user } = useAuth();

  // Refresh data when the reports page mounts
  useEffect(() => {
    refreshData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Date range state (default: last 30 days)
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30))
      .toISOString()
      .split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  // Print preview state
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [previewType, setPreviewType] = useState<'sales' | 'inventory' | 'returns'>('sales');
  const [printSales, setPrintSales] = useState<Sale[]>([]);
  const [printProducts, setPrintProducts] = useState<Product[]>([]);
  const [printReturns, setPrintReturns] = useState<Return[]>([]);

  // Print settings state
  const [printSettings, setPrintSettings] = useState({
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
      customer: true,
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
      barcode: true,
    },

    // Inventory filters
    inventoryFilters: {
      showLowStock: true,
      showAvailable: true,
      showOutOfStock: true,
    },
    inventoryNotes: '',

    // Returns columns
    returnsColumns: {
      date: true,
      product: true,
      quantity: true,
      refund: true,
      reason: true,
      processor: true,
    },
  });

  // Print handlers
  const handlePrintPreview = (type: 'sales' | 'inventory' | 'returns', filteredData: Sale[] | Product[] | Return[]) => {
    setPreviewType(type);

    // Store the filtered data based on type
    if (type === 'sales') {
      setPrintSales(filteredData as Sale[]);
    } else if (type === 'inventory') {
      setPrintProducts(filteredData as Product[]);
    } else if (type === 'returns') {
      setPrintReturns(filteredData as Return[]);
    }

    setShowPrintPreview(true);
  };

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

  // Filter sales and returns by date range
  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const saleDate = new Date(sale.saleDate).toISOString().split('T')[0];
      return saleDate >= dateRange.startDate && saleDate <= dateRange.endDate;
    });
  }, [sales, dateRange]);

  const filteredReturns = useMemo(() => {
    return returns.filter((ret) => {
      const returnDate = new Date(ret.returnDate).toISOString().split('T')[0];
      return returnDate >= dateRange.startDate && returnDate <= dateRange.endDate;
    });
  }, [returns, dateRange]);

  // Access control: Only admins and assistant admins can view reports
  if (user?.role === 'user') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Alert className="max-w-md border-amber-200 bg-amber-50">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <AlertDescription className="text-amber-800 text-lg">
            <p className="font-semibold mb-2">غير مصرح بالدخول</p>
            <p>
              ليس لديك صلاحية الوصول إلى التقارير. هذه الصفحة متاحة للمدراء فقط.
            </p>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          التقارير
        </h1>
        <p className="text-gray-600 mt-1">
          تقارير شاملة عن المبيعات، المخزون، والإرجاعات
        </p>
      </div>

      {/* Date Range Filters */}
      <ReportFilters
        startDate={dateRange.startDate}
        endDate={dateRange.endDate}
        onStartDateChange={(date) =>
          setDateRange((prev) => ({ ...prev, startDate: date }))
        }
        onEndDateChange={(date) =>
          setDateRange((prev) => ({ ...prev, endDate: date }))
        }
      />

      {/* Report Tabs */}
      <ReportTabs
        sales={filteredSales}
        products={products}
        returns={filteredReturns}
        onPrintClick={handlePrintPreview}
      />

      {/* Print Preview Dialog */}
      <PrintPreviewDialog
        open={showPrintPreview}
        onClose={() => setShowPrintPreview(false)}
        previewType={previewType}
        sales={printSales}
        products={printProducts}
        returns={printReturns}
        dateRange={dateRange}
        printSettings={printSettings}
        onPrintSettingsChange={setPrintSettings}
        onPrint={handlePrint}
      />

      {/* Print-only container (hidden, used only during printing) */}
      <div
        id="print-only-container"
        style={{
          display: 'none',
          width: '210mm',
          minHeight: '297mm',
          padding: '1.5cm',
          background: 'white',
          color: 'black',
          fontSize: `${printSettings.textSize}px`,
        }}
      />

      {/* Print CSS Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: ${printSettings.orientation === 'portrait' ? 'A4 portrait' : 'A4 landscape'};
            margin: 0;
          }

          /* Hide everything except print container */
          body * {
            visibility: hidden;
          }

          #print-only-container,
          #print-only-container * {
            visibility: visible;
          }

          #print-only-container {
            display: block !important;
            position: absolute;
            left: 0;
            top: 0;
          }

          /* Print table styles */
          #print-only-container table {
            width: 100%;
            border-collapse: collapse;
            page-break-inside: auto;
          }

          #print-only-container tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }

          #print-only-container th,
          #print-only-container td {
            border: 1px solid #000;
            padding: 8px;
            text-align: right;
          }

          #print-only-container th {
            background-color: #f3f4f6 !important;
            font-weight: bold;
          }

          /* Color preservation for status indicators */
          #print-only-container .bg-red-50 {
            background-color: #fef2f2 !important;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          #print-only-container .bg-amber-50 {
            background-color: #fffbeb !important;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          #print-only-container .bg-green-50 {
            background-color: #f0fdf4 !important;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          #print-only-container .bg-gray-100 {
            background-color: #f3f4f6 !important;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}

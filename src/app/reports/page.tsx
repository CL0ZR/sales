'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import ReportFilters from './components/shared/ReportFilters';
import ReportTabs from './components/ReportTabs';

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
      />
    </div>
  );
}

'use client';

import React, { useState, useMemo } from 'react';
import { ShoppingCart, TrendingUp, Package, Printer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sale } from '@/types';
import { useCurrency } from '@/context/CurrencyContext';
import { useDebounce } from '@/hooks/useDebounce';
import { usePagination } from '@/hooks/usePagination';
import TableSearch from './shared/TableSearch';
import TablePagination from './shared/TablePagination';
import { formatMeasurement } from '@/utils/measurement';

interface SalesReportProps {
  sales: Sale[];
  onPrintClick: (filteredSales: Sale[]) => void;
}

export default function SalesReport({ sales, onPrintClick }: SalesReportProps) {
  const { formatCurrency } = useCurrency();
  const [searchTerm, setSearchTerm] = useState('');
  const [saleTypeFilter, setSaleTypeFilter] = useState<'all' | 'retail' | 'wholesale'>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'cash' | 'debt'>('all');

  const debouncedSearch = useDebounce(searchTerm, 300);

  // Filter and search sales
  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      // Sale type filter
      if (saleTypeFilter !== 'all' && sale.saleType !== saleTypeFilter) {
        return false;
      }

      // Payment filter
      if (paymentFilter !== 'all' && sale.paymentMethod !== paymentFilter) {
        return false;
      }

      // Search filter
      if (debouncedSearch) {
        const searchLower = debouncedSearch.toLowerCase();
        const matchesCustomer = sale.customerName?.toLowerCase().includes(searchLower);
        const matchesProduct = sale.product.name.toLowerCase().includes(searchLower);
        return matchesCustomer || matchesProduct;
      }

      return true;
    });
  }, [sales, saleTypeFilter, paymentFilter, debouncedSearch]);

  // Pagination
  const {
    currentPage,
    totalPages,
    paginatedData,
    goToPage,
    nextPage,
    previousPage,
    canGoNext,
    canGoPrevious,
    startIndex,
    endIndex,
    totalItems,
  } = usePagination({
    data: filteredSales,
    itemsPerPage: 50,
  });

  // Calculate stats
  const stats = useMemo(() => {
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.finalPrice, 0);
    const totalProfit = filteredSales.reduce((sum, sale) => {
      const costPrice = sale.product.wholesaleCostPrice || 0;
      const profit = sale.finalPrice - (costPrice * (sale.product.measurementType === 'quantity' ? sale.quantity : (sale.weight || 0)));
      return sum + profit;
    }, 0);
    const retailCount = filteredSales.filter(s => s.saleType === 'retail').length;
    const wholesaleCount = filteredSales.filter(s => s.saleType === 'wholesale').length;

    return { totalRevenue, totalProfit, retailCount, wholesaleCount };
  }, [filteredSales]);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">
              إجمالي المبيعات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">
              {formatCurrency(stats.totalRevenue)}
            </div>
            <p className="text-xs text-blue-600 mt-1">
              {filteredSales.length} عملية بيع
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              إجمالي الربح
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">
              {formatCurrency(stats.totalProfit)}
            </div>
            <p className="text-xs text-green-600 mt-1">
              {((stats.totalProfit / stats.totalRevenue) * 100 || 0).toFixed(1)}% هامش ربح
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">
              مبيعات التجزئة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">
              {stats.retailCount}
            </div>
            <p className="text-xs text-purple-600 mt-1">
              {((stats.retailCount / filteredSales.length) * 100 || 0).toFixed(0)}% من المبيعات
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700">
              مبيعات الجملة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-900">
              {stats.wholesaleCount}
            </div>
            <p className="text-xs text-emerald-600 mt-1">
              {((stats.wholesaleCount / filteredSales.length) * 100 || 0).toFixed(0)}% من المبيعات
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>البحث والتصفية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <TableSearch
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="ابحث عن عميل أو منتج..."
              label="البحث"
            />

            <div className="space-y-2">
              <Label>نوع البيع</Label>
              <Select value={saleTypeFilter} onValueChange={(value) => setSaleTypeFilter(value as 'all' | 'retail' | 'wholesale')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأنواع</SelectItem>
                  <SelectItem value="retail">تجزئة</SelectItem>
                  <SelectItem value="wholesale">جملة</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>طريقة الدفع</Label>
              <Select value={paymentFilter} onValueChange={(value) => setPaymentFilter(value as 'all' | 'cash' | 'debt')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الطرق</SelectItem>
                  <SelectItem value="cash">نقدي</SelectItem>
                  <SelectItem value="debt">آجل</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Print Button */}
      <div className="flex justify-end">
        <Button onClick={() => onPrintClick(filteredSales)} variant="outline" className="flex items-center gap-2">
          <Printer className="h-4 w-4" />
          طباعة تقرير المبيعات
        </Button>
      </div>

      {/* Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            قائمة المبيعات ({filteredSales.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border" dir="rtl">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">#</TableHead>
                  <TableHead className="text-right">التاريخ</TableHead>
                  <TableHead className="text-right">العميل</TableHead>
                  <TableHead className="text-right">المنتج</TableHead>
                  <TableHead className="text-right">الكمية</TableHead>
                  <TableHead className="text-right">النوع</TableHead>
                  <TableHead className="text-right">الدفع</TableHead>
                  <TableHead className="text-right">الإجمالي</TableHead>
                  <TableHead className="text-right">الربح</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((sale, index) => {
                  const costPrice = sale.product.wholesaleCostPrice || 0;
                  const profit = sale.finalPrice - (costPrice * (sale.product.measurementType === 'quantity' ? sale.quantity : (sale.weight || 0)));
                  const profitMargin = (profit / sale.finalPrice) * 100;

                  return (
                    <TableRow key={sale.id}>
                      <TableCell className="text-right font-medium">
                        {startIndex + index + 1}
                      </TableCell>
                      <TableCell className="text-right">
                        <div>
                          <p className="font-medium">
                            {new Date(sale.saleDate).toLocaleDateString('ar-EG')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(sale.saleDate).toLocaleTimeString('ar-EG', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {sale.customerName || 'بيع مباشر'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div>
                          <p className="font-medium">{sale.product.name}</p>
                          {sale.product.category && (
                            <p className="text-xs text-muted-foreground">
                              {sale.product.category}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline">
                          {formatMeasurement({
                            ...sale.product,
                            quantity: sale.quantity,
                            weight: sale.weight,
                          })}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="outline"
                          className={
                            sale.saleType === 'retail'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-green-50 text-green-700 border-green-200'
                          }
                        >
                          {sale.saleType === 'retail' ? 'تجزئة' : 'جملة'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="outline"
                          className={
                            sale.paymentMethod === 'cash'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }
                        >
                          {sale.paymentMethod === 'cash' ? 'نقدي' : 'آجل'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(sale.finalPrice, sale.product.currency)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div>
                          <p className="font-medium text-green-600">
                            {formatCurrency(profit, sale.product.currency)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {profitMargin.toFixed(1)}%
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {paginatedData.length === 0 && (
              <div className="text-center py-12">
                <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-lg font-medium text-muted-foreground">
                  لا توجد مبيعات
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchTerm || saleTypeFilter !== 'all' || paymentFilter !== 'all'
                    ? 'لم يتم العثور على مبيعات مطابقة للبحث والفلاتر'
                    : 'لم يتم تسجيل أي عمليات بيع في هذه الفترة'}
                </p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {paginatedData.length > 0 && (
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              startIndex={startIndex}
              endIndex={endIndex}
              onPageChange={goToPage}
              onNext={nextPage}
              onPrevious={previousPage}
              canGoNext={canGoNext}
              canGoPrevious={canGoPrevious}
              className="mt-4"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

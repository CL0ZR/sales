'use client';

import React, { useState, useMemo } from 'react';
import { Undo2, Package, TrendingDown, Printer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Return } from '@/types';
import { useCurrency } from '@/context/CurrencyContext';
import { useDebounce } from '@/hooks/useDebounce';
import { usePagination } from '@/hooks/usePagination';
import TableSearch from './shared/TableSearch';
import TablePagination from './shared/TablePagination';
import { formatMeasurement } from '@/utils/measurement';

interface ReturnsReportProps {
  returns: Return[];
  onPrintClick: () => void;
}

export default function ReturnsReport({ returns, onPrintClick }: ReturnsReportProps) {
  const { formatCurrency } = useCurrency();
  const [searchTerm, setSearchTerm] = useState('');

  const debouncedSearch = useDebounce(searchTerm, 300);

  // Filter and search returns
  const filteredReturns = useMemo(() => {
    if (!debouncedSearch) return returns;

    const searchLower = debouncedSearch.toLowerCase();
    return returns.filter((ret) => {
      const matchesProduct = ret.product.name.toLowerCase().includes(searchLower);
      const matchesReason = ret.reason?.toLowerCase().includes(searchLower);
      const matchesSaleId = ret.saleId.toLowerCase().includes(searchLower);
      const matchesProcessedBy = ret.processedBy?.toLowerCase().includes(searchLower);

      return matchesProduct || matchesReason || matchesSaleId || matchesProcessedBy;
    });
  }, [returns, debouncedSearch]);

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
    data: filteredReturns,
    itemsPerPage: 50,
  });

  // Calculate stats
  const stats = useMemo(() => {
    const totalRefund = filteredReturns.reduce((sum, ret) => sum + ret.totalRefund, 0);
    const totalItems = filteredReturns.reduce((sum, ret) => sum + ret.returnedQuantity, 0);

    // Group by reason
    const reasonCounts = filteredReturns.reduce((acc, ret) => {
      const reason = ret.reason || 'غير محدد';
      acc[reason] = (acc[reason] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topReason = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])[0];

    return {
      totalRefund,
      totalItems,
      totalReturns: filteredReturns.length,
      topReason: topReason ? { reason: topReason[0], count: topReason[1] } : null
    };
  }, [filteredReturns]);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">
              إجمالي الإرجاعات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">
              {stats.totalReturns}
            </div>
            <p className="text-xs text-orange-600 mt-1">
              عملية إرجاع
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-700 flex items-center gap-1">
              <TrendingDown className="h-4 w-4" />
              المبلغ المسترد
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">
              {formatCurrency(stats.totalRefund)}
            </div>
            <p className="text-xs text-red-600 mt-1">
              مبالغ مستردة
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">
              عدد الوحدات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">
              {stats.totalItems}
            </div>
            <p className="text-xs text-purple-600 mt-1">
              وحدة مرتجعة
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">
              السبب الأكثر شيوعاً
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-blue-900 truncate">
              {stats.topReason?.reason || 'لا يوجد'}
            </div>
            <p className="text-xs text-blue-600 mt-1">
              {stats.topReason?.count || 0} حالة
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>البحث</CardTitle>
        </CardHeader>
        <CardContent>
          <TableSearch
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="ابحث عن منتج، سبب، رقم بيع، أو معالج..."
            label="البحث في الإرجاعات"
          />
        </CardContent>
      </Card>

      {/* Print Button */}
      <div className="flex justify-end">
        <Button onClick={onPrintClick} variant="outline" className="flex items-center gap-2">
          <Printer className="h-4 w-4" />
          طباعة تقرير الإرجاعات
        </Button>
      </div>

      {/* Returns Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Undo2 className="h-5 w-5" />
            قائمة الإرجاعات ({filteredReturns.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border" dir="rtl">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">#</TableHead>
                  <TableHead className="text-right">التاريخ</TableHead>
                  <TableHead className="text-right">رقم البيع</TableHead>
                  <TableHead className="text-right">المنتج</TableHead>
                  <TableHead className="text-right">الكمية المرتجعة</TableHead>
                  <TableHead className="text-right">السبب</TableHead>
                  <TableHead className="text-right">المبلغ المسترد</TableHead>
                  <TableHead className="text-right">المعالج بواسطة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((ret, index) => {
                  return (
                    <TableRow key={ret.id}>
                      <TableCell className="text-right font-medium">
                        {startIndex + index + 1}
                      </TableCell>
                      <TableCell className="text-right">
                        <div>
                          <p className="font-medium">
                            {new Date(ret.returnDate).toLocaleDateString('ar-EG')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(ret.returnDate).toLocaleTimeString('ar-EG', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {ret.saleId.slice(-8)}
                        </code>
                      </TableCell>
                      <TableCell className="text-right">
                        <div>
                          <p className="font-medium">{ret.product.name}</p>
                          {ret.product.category && (
                            <p className="text-xs text-muted-foreground">
                              {ret.product.category}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                          {formatMeasurement({
                            ...ret.product,
                            quantity: ret.returnedQuantity,
                            weight: ret.returnedWeight,
                          })}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <p className="text-sm max-w-xs truncate" title={ret.reason}>
                          {ret.reason || 'غير محدد'}
                        </p>
                      </TableCell>
                      <TableCell className="text-right font-medium text-red-600">
                        {formatCurrency(ret.totalRefund, ret.product.currency)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {ret.processedBy || 'غير محدد'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {paginatedData.length === 0 && (
              <div className="text-center py-12">
                <Undo2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-lg font-medium text-muted-foreground">
                  لا توجد إرجاعات
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchTerm
                    ? 'لم يتم العثور على إرجاعات مطابقة للبحث'
                    : 'لم يتم تسجيل أي عمليات إرجاع في هذه الفترة'}
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

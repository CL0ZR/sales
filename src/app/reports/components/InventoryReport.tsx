'use client';

import React, { useState, useMemo } from 'react';
import { Package, AlertTriangle, CheckCircle, XCircle, TrendingDown, Printer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Product } from '@/types';
import { useCurrency } from '@/context/CurrencyContext';
import { useDebounce } from '@/hooks/useDebounce';
import { usePagination } from '@/hooks/usePagination';
import TableSearch from './shared/TableSearch';
import TablePagination from './shared/TablePagination';
import { formatMeasurement, isLowStock, isOutOfStock, getStockStatus } from '@/utils/measurement';

interface InventoryReportProps {
  products: Product[];
  onPrintClick: () => void;
}

export default function InventoryReport({ products, onPrintClick }: InventoryReportProps) {
  const { formatCurrency } = useCurrency();
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'good' | 'low' | 'out'>('all');
  const [measurementFilter, setMeasurementFilter] = useState<'all' | 'quantity' | 'weight'>('all');

  const debouncedSearch = useDebounce(searchTerm, 300);

  // Filter and search products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Stock status filter
      if (stockFilter === 'out' && !isOutOfStock(product)) return false;
      if (stockFilter === 'low' && (!isLowStock(product) || isOutOfStock(product))) return false;
      if (stockFilter === 'good' && (isLowStock(product) || isOutOfStock(product))) return false;

      // Measurement type filter
      if (measurementFilter !== 'all' && product.measurementType !== measurementFilter) {
        return false;
      }

      // Search filter
      if (debouncedSearch) {
        const searchLower = debouncedSearch.toLowerCase();
        const matchesName = product.name.toLowerCase().includes(searchLower);
        const matchesCategory = product.category.toLowerCase().includes(searchLower);
        const matchesSubcategory = product.subcategory?.toLowerCase().includes(searchLower);
        return matchesName || matchesCategory || matchesSubcategory;
      }

      return true;
    });
  }, [products, stockFilter, measurementFilter, debouncedSearch]);

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
    data: filteredProducts,
    itemsPerPage: 50,
  });

  // Calculate stats
  const stats = useMemo(() => {
    const totalValue = filteredProducts.reduce((sum, product) => {
      const stockValue = product.measurementType === 'quantity'
        ? product.quantity * product.wholesalePrice
        : (product.weight || 0) * product.wholesalePrice;
      return sum + stockValue;
    }, 0);

    const outOfStock = filteredProducts.filter(p => isOutOfStock(p)).length;
    const lowStock = filteredProducts.filter(p => isLowStock(p) && !isOutOfStock(p)).length;
    const goodStock = filteredProducts.filter(p => !isLowStock(p) && !isOutOfStock(p)).length;

    return { totalValue, outOfStock, lowStock, goodStock };
  }, [filteredProducts]);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">
              قيمة المخزون
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">
              {formatCurrency(stats.totalValue)}
            </div>
            <p className="text-xs text-purple-600 mt-1">
              {filteredProducts.length} منتج
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-1">
              <CheckCircle className="h-4 w-4" />
              مخزون جيد
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">
              {stats.goodStock}
            </div>
            <p className="text-xs text-green-600 mt-1">
              {((stats.goodStock / filteredProducts.length) * 100 || 0).toFixed(0)}% من المنتجات
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-700 flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" />
              مخزون منخفض
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-900">
              {stats.lowStock}
            </div>
            <p className="text-xs text-amber-600 mt-1">
              يحتاج إعادة تعبئة
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-700 flex items-center gap-1">
              <XCircle className="h-4 w-4" />
              نفذ من المخزون
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">
              {stats.outOfStock}
            </div>
            <p className="text-xs text-red-600 mt-1">
              يحتاج توريد فوري
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
              placeholder="ابحث عن منتج أو فئة..."
              label="البحث"
            />

            <div className="space-y-2">
              <Label>حالة المخزون</Label>
              <Select value={stockFilter} onValueChange={(value) => setStockFilter(value as 'all' | 'good' | 'low' | 'out')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="good">مخزون جيد</SelectItem>
                  <SelectItem value="low">مخزون منخفض</SelectItem>
                  <SelectItem value="out">نفذ من المخزون</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>نوع القياس</Label>
              <Select value={measurementFilter} onValueChange={(value) => setMeasurementFilter(value as 'all' | 'quantity' | 'weight')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأنواع</SelectItem>
                  <SelectItem value="quantity">بالقطع</SelectItem>
                  <SelectItem value="weight">بالوزن</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Print Button */}
      <div className="flex justify-end">
        <Button onClick={onPrintClick} variant="outline" className="flex items-center gap-2">
          <Printer className="h-4 w-4" />
          طباعة تقرير المخزون
        </Button>
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            قائمة المخزون ({filteredProducts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border" dir="rtl">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">#</TableHead>
                  <TableHead className="text-right">المنتج</TableHead>
                  <TableHead className="text-right">الفئة</TableHead>
                  <TableHead className="text-right">القياس</TableHead>
                  <TableHead className="text-right">المتوفر</TableHead>
                  <TableHead className="text-right">الحد الأدنى</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">السعر</TableHead>
                  <TableHead className="text-right">القيمة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((product, index) => {
                  const stockStatus = getStockStatus(product);
                  const stockValue = product.measurementType === 'quantity'
                    ? product.quantity * product.wholesalePrice
                    : (product.weight || 0) * product.wholesalePrice;

                  return (
                    <TableRow key={product.id}>
                      <TableCell className="text-right font-medium">
                        {startIndex + index + 1}
                      </TableCell>
                      <TableCell className="text-right">
                        <div>
                          <p className="font-medium">{product.name}</p>
                          {product.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {product.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div>
                          <p className="text-sm">{product.category}</p>
                          {product.subcategory && (
                            <p className="text-xs text-muted-foreground">
                              {product.subcategory}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="outline"
                          className={
                            product.measurementType === 'quantity'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-purple-50 text-purple-700 border-purple-200'
                          }
                        >
                          {product.measurementType === 'quantity' ? 'قطع' : 'وزن'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={isLowStock(product) ? 'destructive' : 'default'}
                          className="font-mono"
                        >
                          {formatMeasurement(product)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {product.measurementType === 'quantity'
                          ? `${product.minQuantity} قطعة`
                          : `${product.minWeight} ${product.weightUnit}`}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={
                            isOutOfStock(product)
                              ? 'destructive'
                              : isLowStock(product)
                              ? 'secondary'
                              : 'default'
                          }
                          className="gap-1"
                        >
                          {isOutOfStock(product) ? (
                            <XCircle className="h-3 w-3" />
                          ) : isLowStock(product) ? (
                            <AlertTriangle className="h-3 w-3" />
                          ) : (
                            <CheckCircle className="h-3 w-3" />
                          )}
                          {stockStatus.text}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(product.wholesalePrice, product.currency)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(stockValue, product.currency)}
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
                  لا توجد منتجات
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchTerm || stockFilter !== 'all' || measurementFilter !== 'all'
                    ? 'لم يتم العثور على منتجات مطابقة للبحث والفلاتر'
                    : 'لا توجد منتجات في المخزون'}
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

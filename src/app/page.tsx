'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Package, 
  AlertTriangle, 
  ShoppingCart, 
  DollarSign, 
  TrendingUp,
  Calendar,
  Plus,
  FileText
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useAuth } from '@/context/AuthContext';
import { isLowStock, formatMeasurement, getMeasurementUnit, getStockStatus } from '@/utils/measurement';
import { formatGregorianDateTime, formatTime } from '@/utils/dateFormat';
import { CURRENCIES } from '@/types';
import StatCard from '@/components/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function Dashboard() {
  const { state } = useApp();
  const { stats, products, sales } = state;
  const { formatCurrency } = useCurrency();
  const { user } = useAuth();

  // Modal states
  const [isProductsModalOpen, setIsProductsModalOpen] = useState(false);
  const [isLowStockModalOpen, setIsLowStockModalOpen] = useState(false);
  const [isSalesModalOpen, setIsSalesModalOpen] = useState(false);
  const [isTodaySalesModalOpen, setIsTodaySalesModalOpen] = useState(false);

  // Access control: Only admins can access dashboard
  if (user?.role === 'assistant-admin' || user?.role === 'user') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-semibold mb-2 text-amber-900">غير مصرح بالدخول</p>
                <p className="text-amber-800">ليس لديك صلاحية الوصول إلى لوحة التحكم. هذه الصفحة متاحة للمدراء فقط.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Filter functions
  const lowStockProducts = products.filter(p => isLowStock(p));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todaySales = sales.filter(sale => new Date(sale.saleDate) >= today);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          لوحة التحكم
        </h1>
        <p className="text-gray-600 text-lg">
          نظرة عامة على إحصائيات المستودع والمبيعات
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="إجمالي المنتجات"
          value={stats?.totalProducts || 0}
          icon={Package}
          color="primary"
          onClick={() => setIsProductsModalOpen(true)}
        />
        <StatCard
          title="منتجات قليلة المخزون"
          value={stats?.lowStockProducts || 0}
          icon={AlertTriangle}
          color="warning"
          onClick={() => setIsLowStockModalOpen(true)}
        />
        <StatCard
          title="إجمالي المبيعات"
          value={stats?.totalSales || 0}
          icon={ShoppingCart}
          color="success"
          onClick={() => setIsSalesModalOpen(true)}
        />
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-0 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              مبيعات التجزئة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{stats?.retailSales || 0}</div>
            <p className="text-xs text-blue-600 mt-1">عدد مبيعات التجزئة</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-0 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
              <Package className="h-4 w-4" />
              مبيعات الجملة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{stats?.wholesaleSales || 0}</div>
            <p className="text-xs text-green-600 mt-1">عدد مبيعات الجملة</p>
          </CardContent>
        </Card>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="إجمالي الإيرادات"
          value={formatCurrency(stats?.totalRevenue || 0)}
          icon={DollarSign}
          color="success"
        />
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-0 shadow-lg hover:shadow-xl transition-all duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              إيرادات التجزئة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{formatCurrency(stats?.retailRevenue || 0)}</div>
            <p className="text-xs text-blue-600 mt-1">إجمالي إيرادات التجزئة</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-0 shadow-lg hover:shadow-xl transition-all duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              إيرادات الجملة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{formatCurrency(stats?.wholesaleRevenue || 0)}</div>
            <p className="text-xs text-green-600 mt-1">إجمالي إيرادات الجملة</p>
          </CardContent>
        </Card>
        <StatCard
          title="إجمالي الأرباح"
          value={formatCurrency(stats?.totalProfit || 0)}
          icon={TrendingUp}
          color="success"
        />
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-0 shadow-lg hover:shadow-xl transition-all duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              أرباح التجزئة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{formatCurrency(stats?.retailProfit || 0)}</div>
            <p className="text-xs text-blue-600 mt-1">إجمالي أرباح التجزئة</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-0 shadow-lg hover:shadow-xl transition-all duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              أرباح الجملة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{formatCurrency(stats?.wholesaleProfit || 0)}</div>
            <p className="text-xs text-green-600 mt-1">إجمالي أرباح الجملة</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="مبيعات اليوم"
          value={stats?.todaySales || 0}
          icon={ShoppingCart}
          color="primary"
          onClick={() => setIsTodaySalesModalOpen(true)}
        />
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-0 shadow-lg hover:shadow-xl transition-all duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              تجزئة اليوم
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{stats?.todayRetailSales || 0}</div>
            <p className="text-xs text-blue-600 mt-1">مبيعات التجزئة اليوم</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-0 shadow-lg hover:shadow-xl transition-all duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
              <Package className="h-4 w-4" />
              جملة اليوم
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{stats?.todayWholesaleSales || 0}</div>
            <p className="text-xs text-green-600 mt-1">مبيعات الجملة اليوم</p>
          </CardContent>
        </Card>
        <StatCard
          title="إيرادات اليوم"
          value={formatCurrency(stats?.todayRevenue || 0)}
          icon={DollarSign}
          color="primary"
        />
        </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="إيرادات الشهر"
          value={formatCurrency(stats?.monthlyRevenue || 0)}
          icon={Calendar}
          color="primary"
        />
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-0 shadow-lg hover:shadow-xl transition-all duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              إيرادات التجزئة اليوم
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{formatCurrency(stats?.todayRetailRevenue || 0)}</div>
            <p className="text-xs text-blue-600 mt-1">إيرادات التجزئة اليوم</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-0 shadow-lg hover:shadow-xl transition-all duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              إيرادات الجملة اليوم
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{formatCurrency(stats?.todayWholesaleRevenue || 0)}</div>
            <p className="text-xs text-green-600 mt-1">إيرادات الجملة اليوم</p>
          </CardContent>
        </Card>
        
      </div>

      {/* Wholesale vs Retail Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Retail Sales Summary */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <ShoppingCart className="h-5 w-5" />
              مبيعات التجزئة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white/70 rounded-lg">
                <span className="text-sm text-blue-700">عدد المبيعات</span>
                <span className="text-xl font-bold text-blue-900">
                  {sales.filter(s => !s.saleType || s.saleType === 'retail').length}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/70 rounded-lg">
                <span className="text-sm text-blue-700">إجمالي الإيرادات</span>
                <span className="text-lg font-semibold text-blue-900">
                  {formatCurrency(
                    sales
                      .filter(s => !s.saleType || s.saleType === 'retail')
                      .reduce((sum, s) => sum + s.finalPrice, 0)
                  )}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Wholesale Sales Summary */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900">
              <Package className="h-5 w-5" />
              مبيعات الجملة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white/70 rounded-lg">
                <span className="text-sm text-green-700">عدد المبيعات</span>
                <span className="text-xl font-bold text-green-900">
                  {sales.filter(s => s.saleType === 'wholesale').length}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/70 rounded-lg">
                <span className="text-sm text-green-700">إجمالي الإيرادات</span>
                <span className="text-lg font-semibold text-green-900">
                  {formatCurrency(
                    sales
                      .filter(s => s.saleType === 'wholesale')
                      .reduce((sum, s) => sum + s.finalPrice, 0)
                  )}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              أكثر المنتجات مبيعاً
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.topSellingProducts && stats.topSellingProducts.length > 0 ? (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {stats.topSellingProducts.map((item, index) => (
                  <div key={item.product.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-3">
                      <Badge className="w-8 h-8 rounded-full p-0 flex items-center justify-center bg-blue-500 text-white">
                        {index + 1}
                      </Badge>
                      <div>
                        <p className="font-semibold text-gray-800">{item.product.name}</p>
                        <p className="text-sm text-gray-600">الكمية المباعة: {item.totalSold}</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-emerald-600 text-lg">{formatCurrency(item.revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>لا توجد مبيعات بعد</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              منتجات قليلة المخزون
            </CardTitle>
          </CardHeader>
          <CardContent>
            {products.filter(p => isLowStock(p)).length > 0 ? (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {products
                  .filter(p => isLowStock(p))
                  .map((product) => {
                    const currentStock = product.measurementType === 'quantity'
                      ? `${product.quantity} قطعة`
                      : `${product.weight} ${product.weightUnit === 'kg' ? 'كجم' : 'جم'}`;
                    const minStock = product.measurementType === 'quantity'
                      ? `${product.minQuantity} قطعة`
                      : `${product.minWeight} ${product.weightUnit === 'kg' ? 'كجم' : 'جم'}`;

                    return (
                    <Alert key={product.id} className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <AlertDescription>
                        <div className="flex items-center justify-between" style={{ width: "100%" }}>
                          <div>
                            <p className="font-medium text-gray-800">{product.name}</p>
                            <p className="text-sm text-gray-600">الحد الأدنى: {minStock}</p>
                          </div>
                          <Badge className="bg-red-500 text-white hover:bg-red-600">
                            {currentStock} متبقي
                          </Badge>
                        </div>
                      </AlertDescription>
                    </Alert>
                  );})}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>جميع المنتجات متوفرة بكمية كافية</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>إجراءات سريعة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="group">
              <Link href="/warehouse" className="block">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-6 hover:shadow-xl hover:scale-105 transition-all duration-200 group-hover:from-blue-600 group-hover:to-blue-700">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-xl">
                      <Plus className="h-6 w-6" />
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">إضافة منتج جديد</p>
                      <p className="text-blue-100 text-sm">إضافة منتجات للمستودع</p>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
            
            <div className="group">
              <Link href="/products" className="block">
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-2xl p-6 hover:shadow-xl hover:scale-105 transition-all duration-200 group-hover:from-emerald-600 group-hover:to-emerald-700">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-xl">
                      <ShoppingCart className="h-6 w-6" />
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">تسجيل مبيعة</p>
                      <p className="text-emerald-100 text-sm">بيع المنتجات</p>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
            
            <div className="group">
              <Link href="/reports" className="block">
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl p-6 hover:shadow-xl hover:scale-105 transition-all duration-200 group-hover:from-purple-600 group-hover:to-purple-700">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-xl">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">عرض التقارير</p>
                      <p className="text-purple-100 text-sm">تحليل الأداء</p>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total Products Modal */}
      <Dialog open={isProductsModalOpen} onOpenChange={setIsProductsModalOpen}>
        <DialogContent className="min-w-[90%] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              إجمالي المنتجات ({products.length})
            </DialogTitle>
          </DialogHeader>
          <div className="rounded-md border" dir="rtl">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">المنتج</TableHead>
                  <TableHead className="text-right">الوصف</TableHead>
                  <TableHead className="text-right">الفئة</TableHead>
                  <TableHead className="text-right">سعر البيع</TableHead>
                  <TableHead className="text-right">العملة</TableHead>
                  <TableHead className="text-right">المخزون</TableHead>
                  <TableHead className="text-right">النوع</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length > 0 ? (
                  products.map((product) => {
                    const stockStatus = getStockStatus(product);
                    return (
                      <TableRow key={product.id}>
                        <TableCell className="text-right font-medium">{product.name}</TableCell>
                        <TableCell className="text-right text-sm text-gray-600">
                          {product.description.length > 50
                            ? `${product.description.substring(0, 50)}...`
                            : product.description}
                        </TableCell>
                        <TableCell className="text-right">
                          <div>
                            <p className="text-sm">{product.category}</p>
                            {product.subcategory && (
                              <p className="text-xs text-muted-foreground">{product.subcategory}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(product.salePrice, product.currency)}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            {CURRENCIES[product.currency].symbol}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge>{formatMeasurement(product)}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className={product.measurementType === 'quantity' ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"}>
                            {product.measurementType === 'quantity' ? 'قطع' : `وزن (${getMeasurementUnit(product)})`}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            className={
                              stockStatus.color === 'success' ? 'bg-green-100 text-green-800' :
                              stockStatus.color === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }
                          >
                            {stockStatus.text}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      لا توجد منتجات
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* Low Stock Products Modal */}
      <Dialog open={isLowStockModalOpen} onOpenChange={setIsLowStockModalOpen}>
        <DialogContent className="min-w-[90%] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              منتجات قليلة المخزون ({lowStockProducts.length})
            </DialogTitle>
          </DialogHeader>
          <div className="rounded-md border" dir="rtl">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">المنتج</TableHead>
                  <TableHead className="text-right">الوصف</TableHead>
                  <TableHead className="text-right">الفئة</TableHead>
                  <TableHead className="text-right">سعر البيع</TableHead>
                  <TableHead className="text-right">العملة</TableHead>
                  <TableHead className="text-right">المخزون</TableHead>
                  <TableHead className="text-right">الحد الأدنى</TableHead>
                  <TableHead className="text-right">النوع</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStockProducts.length > 0 ? (
                  lowStockProducts.map((product) => {
                    const stockStatus = getStockStatus(product);
                    const minStock = product.measurementType === 'quantity'
                      ? `${product.minQuantity} قطعة`
                      : `${product.minWeight} ${getMeasurementUnit(product)}`;

                    return (
                      <TableRow key={product.id}>
                        <TableCell className="text-right font-medium">{product.name}</TableCell>
                        <TableCell className="text-right text-sm text-gray-600">
                          {product.description.length > 40
                            ? `${product.description.substring(0, 40)}...`
                            : product.description}
                        </TableCell>
                        <TableCell className="text-right">
                          <div>
                            <p className="text-sm">{product.category}</p>
                            {product.subcategory && (
                              <p className="text-xs text-muted-foreground">{product.subcategory}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(product.salePrice, product.currency)}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            {CURRENCIES[product.currency].symbol}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="destructive" className="bg-red-100 text-red-700">
                            {formatMeasurement(product)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm text-gray-600">{minStock}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className={product.measurementType === 'quantity' ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"}>
                            {product.measurementType === 'quantity' ? 'قطع' : `وزن (${getMeasurementUnit(product)})`}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            className={
                              stockStatus.color === 'success' ? 'bg-green-100 text-green-800' :
                              stockStatus.color === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }
                          >
                            {stockStatus.text}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      جميع المنتجات متوفرة بكمية كافية
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* Total Sales Modal */}
      <Dialog open={isSalesModalOpen} onOpenChange={setIsSalesModalOpen}>
        <DialogContent className="min-w-[90%] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              إجمالي المبيعات ({sales.length})
            </DialogTitle>
          </DialogHeader>
          <div className="rounded-md border" dir="rtl">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">المنتج</TableHead>
                  <TableHead className="text-right">نوع البيع</TableHead>
                  <TableHead className="text-right">الكمية/الوزن</TableHead>
                  <TableHead className="text-right">سعر الوحدة</TableHead>
                  <TableHead className="text-right">السعر الإجمالي</TableHead>
                  <TableHead className="text-right">الخصم</TableHead>
                  <TableHead className="text-right">السعر النهائي</TableHead>
                  <TableHead className="text-right">العميل</TableHead>
                  <TableHead className="text-right">طريقة الدفع</TableHead>
                  <TableHead className="text-right">التاريخ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.length > 0 ? (
                  sales.map((sale) => {
                    const paymentMethodText = {
                      cash: 'نقداً',
                      card: 'بطاقة',
                      transfer: 'تحويل',
                      debt: 'آجل دين'
                    }[sale.paymentMethod];

                    const quantityDisplay = sale.product.measurementType === 'quantity'
                      ? `${sale.quantity} قطعة`
                      : `${sale.weight} ${getMeasurementUnit(sale.product)}`;

                    return (
                      <TableRow key={sale.id}>
                        <TableCell className="text-right font-medium">{sale.product.name}</TableCell>
                        <TableCell className="text-right">
                          <Badge className={
                            sale.saleType === 'wholesale'
                              ? 'bg-green-100 text-green-700 border-green-200'
                              : 'bg-blue-100 text-blue-700 border-blue-200'
                          }>
                            {sale.saleType === 'wholesale' ? '📦 جملة' : '🏪 تجزئة'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{quantityDisplay}</TableCell>
                        <TableCell className="text-right">{formatCurrency(sale.unitPrice, sale.product.currency)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(sale.totalPrice, sale.product.currency)}</TableCell>
                        <TableCell className="text-right">
                          {sale.discount > 0 && (
                            <Badge variant="secondary">{formatCurrency(sale.discount, sale.product.currency)}</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-semibold text-emerald-600">
                            {formatCurrency(sale.finalPrice, sale.product.currency)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="text-sm">
                            {sale.customerName ? <p>{sale.customerName}</p> : <p className="text-gray-400">-</p>}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline">{paymentMethodText}</Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm text-gray-600">
                          {formatGregorianDateTime(sale.saleDate)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      لا توجد مبيعات بعد
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* Today's Sales Modal */}
      <Dialog open={isTodaySalesModalOpen} onOpenChange={setIsTodaySalesModalOpen}>
        <DialogContent className="min-w-[90%] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              مبيعات اليوم ({todaySales.length})
            </DialogTitle>
          </DialogHeader>
          <div className="rounded-md border" dir="rtl">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">المنتج</TableHead>
                  <TableHead className="text-right">نوع البيع</TableHead>
                  <TableHead className="text-right">الكمية/الوزن</TableHead>
                  <TableHead className="text-right">سعر الوحدة</TableHead>
                  <TableHead className="text-right">السعر الإجمالي</TableHead>
                  <TableHead className="text-right">الخصم</TableHead>
                  <TableHead className="text-right">السعر النهائي</TableHead>
                  <TableHead className="text-right">العميل</TableHead>
                  <TableHead className="text-right">طريقة الدفع</TableHead>
                  <TableHead className="text-right">الوقت</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {todaySales.length > 0 ? (
                  todaySales.map((sale) => {
                    const paymentMethodText = {
                      cash: 'نقداً',
                      card: 'بطاقة',
                      transfer: 'تحويل',
                      debt: 'آجل دين'
                    }[sale.paymentMethod];

                    const quantityDisplay = sale.product.measurementType === 'quantity'
                      ? `${sale.quantity} قطعة`
                      : `${sale.weight} ${getMeasurementUnit(sale.product)}`;

                    return (
                      <TableRow key={sale.id}>
                        <TableCell className="text-right font-medium">{sale.product.name}</TableCell>
                        <TableCell className="text-right">
                          <Badge className={
                            sale.saleType === 'wholesale'
                              ? 'bg-green-100 text-green-700 border-green-200'
                              : 'bg-blue-100 text-blue-700 border-blue-200'
                          }>
                            {sale.saleType === 'wholesale' ? '📦 جملة' : '🏪 تجزئة'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{quantityDisplay}</TableCell>
                        <TableCell className="text-right">{formatCurrency(sale.unitPrice, sale.product.currency)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(sale.totalPrice, sale.product.currency)}</TableCell>
                        <TableCell className="text-right">
                          {sale.discount > 0 && (
                            <Badge variant="secondary">{formatCurrency(sale.discount, sale.product.currency)}</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-semibold text-emerald-600">
                            {formatCurrency(sale.finalPrice, sale.product.currency)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="text-sm">
                            {sale.customerName ? <p>{sale.customerName}</p> : <p className="text-gray-400">-</p>}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline">{paymentMethodText}</Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm text-gray-600">
                          {formatTime(sale.saleDate)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      لا توجد مبيعات اليوم
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

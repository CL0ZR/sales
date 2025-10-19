'use client';

import React from 'react';
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
import { isLowStock } from '@/utils/measurement';
import StatCard from '@/components/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Dashboard() {
  const { state } = useApp();
  const { stats, products } = state;
  const { formatCurrency } = useCurrency();

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
        />
        <StatCard
          title="منتجات قليلة المخزون"
          value={stats?.lowStockProducts || 0}
          icon={AlertTriangle}
          color="warning"
        />
        <StatCard
          title="إجمالي المبيعات"
          value={stats?.totalSales || 0}
          icon={ShoppingCart}
          color="success"
        />
        <StatCard
          title="إجمالي الإيرادات"
          value={formatCurrency(stats?.totalRevenue || 0)}
          icon={DollarSign}
          color="success"
        />
        </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="إجمالي الأرباح"
          value={formatCurrency(stats?.totalProfit || 0)}
          icon={TrendingUp}
          color="success"
        />
        <StatCard
          title="مبيعات اليوم"
          value={stats?.todaySales || 0}
          icon={ShoppingCart}
          color="primary"
        />
        <StatCard
          title="إيرادات اليوم"
          value={formatCurrency(stats?.todayRevenue || 0)}
          icon={DollarSign}
          color="primary"
        />
        <StatCard
          title="إيرادات الشهر"
          value={formatCurrency(stats?.monthlyRevenue || 0)}
          icon={Calendar}
          color="primary"
        />
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
              <div className="space-y-3">
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
              <div className="space-y-3">
                {products
                  .filter(p => isLowStock(p))
                  .slice(0, 5)
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
    </div>
  );
}

'use client';

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingCart, Package, Undo2 } from 'lucide-react';
import { Sale, Product, Return } from '@/types';
import SalesReport from './SalesReport';
import InventoryReport from './InventoryReport';
import ReturnsReport from './ReturnsReport';

interface ReportTabsProps {
  sales: Sale[];
  products: Product[];
  returns: Return[];
  onPrintClick: (type: 'sales' | 'inventory' | 'returns') => void;
}

/**
 * مكون تبويبات التقارير
 * يعرض التقارير الثلاثة (المبيعات، المخزون، الإرجاعات) في تبويبات منفصلة
 */
export default function ReportTabs({ sales, products, returns, onPrintClick }: ReportTabsProps) {
  return (
    <Tabs defaultValue="sales" className="w-full" dir="rtl">
      <TabsList className="grid w-full grid-cols-3 h-auto">
        <TabsTrigger value="sales" className="flex items-center gap-2 py-3">
          <ShoppingCart className="h-4 w-4" />
          <span className="hidden sm:inline">تقرير المبيعات</span>
          <span className="sm:hidden">المبيعات</span>
          <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
            {sales.length}
          </span>
        </TabsTrigger>

        <TabsTrigger value="inventory" className="flex items-center gap-2 py-3">
          <Package className="h-4 w-4" />
          <span className="hidden sm:inline">تقرير المخزون</span>
          <span className="sm:hidden">المخزون</span>
          <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs font-medium">
            {products.length}
          </span>
        </TabsTrigger>

        <TabsTrigger value="returns" className="flex items-center gap-2 py-3">
          <Undo2 className="h-4 w-4" />
          <span className="hidden sm:inline">تقرير الإرجاعات</span>
          <span className="sm:hidden">الإرجاعات</span>
          <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-xs font-medium">
            {returns.length}
          </span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="sales" className="mt-6">
        <SalesReport sales={sales} onPrintClick={() => onPrintClick('sales')} />
      </TabsContent>

      <TabsContent value="inventory" className="mt-6">
        <InventoryReport products={products} onPrintClick={() => onPrintClick('inventory')} />
      </TabsContent>

      <TabsContent value="returns" className="mt-6">
        <ReturnsReport returns={returns} onPrintClick={() => onPrintClick('returns')} />
      </TabsContent>
    </Tabs>
  );
}

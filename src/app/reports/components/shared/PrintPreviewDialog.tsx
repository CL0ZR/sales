'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Printer, X } from 'lucide-react';
import { Sale, Product, Return } from '@/types';
import { useCurrency } from '@/context/CurrencyContext';
import { formatMeasurement } from '@/utils/measurement';

interface PrintSettings {
  textSize: number;
  orientation: 'portrait' | 'landscape';
  showTitle: boolean;

  // Sales columns
  salesColumns: {
    date: boolean;
    product: boolean;
    type: boolean;
    quantity: boolean;
    price: boolean;
    total: boolean;
    payment: boolean;
    customer: boolean;
  };

  // Sales filters
  salesFilters: {
    showRetail: boolean;
    showWholesale: boolean;
    showCash: boolean;
    showDebt: boolean;
  };

  // Inventory columns
  inventoryColumns: {
    product: boolean;
    category: boolean;
    status: boolean;
    quantity: boolean;
    wholesaleValue: boolean;
    retailValue: boolean;
    barcode: boolean;
  };

  // Inventory filters
  inventoryFilters: {
    showLowStock: boolean;
    showAvailable: boolean;
    showOutOfStock: boolean;
  };
  inventoryNotes: string;

  // Returns columns
  returnsColumns: {
    date: boolean;
    product: boolean;
    quantity: boolean;
    refund: boolean;
    reason: boolean;
    processor: boolean;
  };
}

interface PrintPreviewDialogProps {
  open: boolean;
  onClose: () => void;
  previewType: 'sales' | 'inventory' | 'returns';
  sales: Sale[];
  products: Product[];
  returns: Return[];
  dateRange: { startDate: string; endDate: string };
  printSettings: PrintSettings;
  onPrintSettingsChange: (settings: PrintSettings) => void;
  onPrint: () => void;
}

export default function PrintPreviewDialog({
  open,
  onClose,
  previewType,
  sales,
  products,
  returns,
  dateRange,
  printSettings,
  onPrintSettingsChange,
  onPrint,
}: PrintPreviewDialogProps) {
  const { formatCurrency } = useCurrency();

  const updateSettings = (key: keyof PrintSettings, value: PrintSettings[keyof PrintSettings]) => {
    onPrintSettingsChange({ ...printSettings, [key]: value });
  };

  const updateNestedSettings = (
    category: 'salesColumns' | 'salesFilters' | 'inventoryColumns' | 'inventoryFilters' | 'returnsColumns',
    key: string,
    value: boolean
  ) => {
    onPrintSettingsChange({
      ...printSettings,
      [category]: {
        ...printSettings[category],
        [key]: value,
      },
    });
  };

  // Filter data based on print settings
  const filteredSales = sales.filter((sale) => {
    if (previewType !== 'sales') return true;

    const typeMatch =
      (printSettings.salesFilters.showRetail && sale.saleType === 'retail') ||
      (printSettings.salesFilters.showWholesale && sale.saleType === 'wholesale');

    const paymentMatch =
      (printSettings.salesFilters.showCash && sale.paymentMethod === 'cash') ||
      (printSettings.salesFilters.showDebt && sale.paymentMethod === 'debt');

    return typeMatch && paymentMatch;
  });

  const filteredProducts = products.filter((product) => {
    if (previewType !== 'inventory') return true;

    const isOutOfStock = product.quantity === 0;
    const isLowStock = product.quantity > 0 && product.quantity <= (product.minStock || 10);
    const isAvailable = product.quantity > (product.minStock || 10);

    return (
      (printSettings.inventoryFilters.showOutOfStock && isOutOfStock) ||
      (printSettings.inventoryFilters.showLowStock && isLowStock) ||
      (printSettings.inventoryFilters.showAvailable && isAvailable)
    );
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-[92vw] lg:max-w-[90vw] w-full h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>معاينة الطباعة</span>
            <Button onClick={onClose} variant="ghost" size="icon">
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex gap-4 overflow-hidden" dir="rtl">
          {/* Settings Panel - 30% */}
          <div className="w-[30%] overflow-y-auto space-y-4">
            {/* Print Button */}
            <Button onClick={onPrint} className="w-full" size="lg">
              <Printer className="h-4 w-4 ml-2" />
              طباعة
            </Button>

            {/* General Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">إعدادات عامة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Text Size */}
                <div>
                  <Label>حجم النص: {printSettings.textSize}px</Label>
                  <input
                    type="range"
                    min="8"
                    max="32"
                    value={printSettings.textSize}
                    onChange={(e) => updateSettings('textSize', Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                {/* Orientation */}
                <div>
                  <Label>اتجاه الصفحة</Label>
                  <RadioGroup
                    value={printSettings.orientation}
                    onValueChange={(value) => updateSettings('orientation', value)}
                  >
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <RadioGroupItem value="portrait" id="portrait" />
                      <Label htmlFor="portrait">عمودي</Label>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <RadioGroupItem value="landscape" id="landscape" />
                      <Label htmlFor="landscape">أفقي</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Show Title */}
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id="showTitle"
                    checked={printSettings.showTitle}
                    onCheckedChange={(checked) => updateSettings('showTitle', checked)}
                  />
                  <Label htmlFor="showTitle">إظهار العنوان</Label>
                </div>
              </CardContent>
            </Card>

            {/* Sales Report Settings */}
            {previewType === 'sales' && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">الأعمدة</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {Object.entries({
                      date: 'التاريخ',
                      product: 'المنتج',
                      type: 'النوع',
                      quantity: 'الكمية',
                      price: 'السعر',
                      total: 'الإجمالي',
                      payment: 'الدفع',
                      customer: 'العميل',
                    }).map(([key, label]) => (
                      <div key={key} className="flex items-center space-x-2 space-x-reverse">
                        <Checkbox
                          id={`sales-${key}`}
                          checked={printSettings.salesColumns[key as keyof typeof printSettings.salesColumns]}
                          onCheckedChange={(checked) =>
                            updateNestedSettings('salesColumns', key, checked as boolean)
                          }
                        />
                        <Label htmlFor={`sales-${key}`}>{label}</Label>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">الفلاتر</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Checkbox
                        id="showRetail"
                        checked={printSettings.salesFilters.showRetail}
                        onCheckedChange={(checked) =>
                          updateNestedSettings('salesFilters', 'showRetail', checked as boolean)
                        }
                      />
                      <Label htmlFor="showRetail">مبيعات التجزئة</Label>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Checkbox
                        id="showWholesale"
                        checked={printSettings.salesFilters.showWholesale}
                        onCheckedChange={(checked) =>
                          updateNestedSettings('salesFilters', 'showWholesale', checked as boolean)
                        }
                      />
                      <Label htmlFor="showWholesale">مبيعات الجملة</Label>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Checkbox
                        id="showCash"
                        checked={printSettings.salesFilters.showCash}
                        onCheckedChange={(checked) =>
                          updateNestedSettings('salesFilters', 'showCash', checked as boolean)
                        }
                      />
                      <Label htmlFor="showCash">نقدي</Label>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Checkbox
                        id="showDebt"
                        checked={printSettings.salesFilters.showDebt}
                        onCheckedChange={(checked) =>
                          updateNestedSettings('salesFilters', 'showDebt', checked as boolean)
                        }
                      />
                      <Label htmlFor="showDebt">آجل</Label>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Inventory Report Settings */}
            {previewType === 'inventory' && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">الأعمدة</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {Object.entries({
                      product: 'المنتج',
                      category: 'الفئة',
                      status: 'الحالة',
                      quantity: 'الكمية',
                      wholesaleValue: 'قيمة الجملة',
                      retailValue: 'قيمة التجزئة',
                      barcode: 'الباركود',
                    }).map(([key, label]) => (
                      <div key={key} className="flex items-center space-x-2 space-x-reverse">
                        <Checkbox
                          id={`inventory-${key}`}
                          checked={
                            printSettings.inventoryColumns[key as keyof typeof printSettings.inventoryColumns]
                          }
                          onCheckedChange={(checked) =>
                            updateNestedSettings('inventoryColumns', key, checked as boolean)
                          }
                        />
                        <Label htmlFor={`inventory-${key}`}>{label}</Label>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">الفلاتر</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Checkbox
                        id="showAvailable"
                        checked={printSettings.inventoryFilters.showAvailable}
                        onCheckedChange={(checked) =>
                          updateNestedSettings('inventoryFilters', 'showAvailable', checked as boolean)
                        }
                      />
                      <Label htmlFor="showAvailable">متوفر</Label>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Checkbox
                        id="showLowStock"
                        checked={printSettings.inventoryFilters.showLowStock}
                        onCheckedChange={(checked) =>
                          updateNestedSettings('inventoryFilters', 'showLowStock', checked as boolean)
                        }
                      />
                      <Label htmlFor="showLowStock">مخزون منخفض</Label>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Checkbox
                        id="showOutOfStock"
                        checked={printSettings.inventoryFilters.showOutOfStock}
                        onCheckedChange={(checked) =>
                          updateNestedSettings('inventoryFilters', 'showOutOfStock', checked as boolean)
                        }
                      />
                      <Label htmlFor="showOutOfStock">نفد من المخزون</Label>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">ملاحظات</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={printSettings.inventoryNotes}
                      onChange={(e) => updateSettings('inventoryNotes', e.target.value)}
                      placeholder="أضف ملاحظات إضافية..."
                      rows={3}
                    />
                  </CardContent>
                </Card>
              </>
            )}

            {/* Returns Report Settings */}
            {previewType === 'returns' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">الأعمدة</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {Object.entries({
                    date: 'التاريخ',
                    product: 'المنتج',
                    quantity: 'الكمية',
                    refund: 'المبلغ المسترد',
                    reason: 'السبب',
                    processor: 'المعالج',
                  }).map(([key, label]) => (
                    <div key={key} className="flex items-center space-x-2 space-x-reverse">
                      <Checkbox
                        id={`returns-${key}`}
                        checked={printSettings.returnsColumns[key as keyof typeof printSettings.returnsColumns]}
                        onCheckedChange={(checked) =>
                          updateNestedSettings('returnsColumns', key, checked as boolean)
                        }
                      />
                      <Label htmlFor={`returns-${key}`}>{label}</Label>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Preview Panel - 70% */}
          <div
            className="flex-1 bg-gray-100 overflow-y-auto p-4"
            style={{
              fontSize: `${printSettings.textSize}px`,
            }}
          >
            <div
              className="print-preview-content bg-white shadow-lg mx-auto"
              style={{
                width: printSettings.orientation === 'portrait' ? '210mm' : '297mm',
                minHeight: printSettings.orientation === 'portrait' ? '297mm' : '210mm',
                padding: '1.5cm',
              }}
              dir="rtl"
            >
              {/* Title */}
              {printSettings.showTitle && (
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold mb-2">
                    {previewType === 'sales' && 'تقرير المبيعات'}
                    {previewType === 'inventory' && 'تقرير المخزون'}
                    {previewType === 'returns' && 'تقرير الإرجاعات'}
                  </h1>
                  <p className="text-sm text-gray-600">
                    من {new Date(dateRange.startDate).toLocaleDateString('ar-EG')} إلى{' '}
                    {new Date(dateRange.endDate).toLocaleDateString('ar-EG')}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    تاريخ الطباعة: {new Date().toLocaleDateString('ar-EG')}
                  </p>
                </div>
              )}

              {/* Sales Report Content */}
              {previewType === 'sales' && (
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      {printSettings.salesColumns.date && <th className="border p-2 text-right">التاريخ</th>}
                      {printSettings.salesColumns.product && <th className="border p-2 text-right">المنتج</th>}
                      {printSettings.salesColumns.type && <th className="border p-2 text-right">النوع</th>}
                      {printSettings.salesColumns.quantity && <th className="border p-2 text-right">الكمية</th>}
                      {printSettings.salesColumns.price && <th className="border p-2 text-right">السعر</th>}
                      {printSettings.salesColumns.total && <th className="border p-2 text-right">الإجمالي</th>}
                      {printSettings.salesColumns.payment && <th className="border p-2 text-right">الدفع</th>}
                      {printSettings.salesColumns.customer && <th className="border p-2 text-right">العميل</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSales.map((sale) => (
                      <tr key={sale.id}>
                        {printSettings.salesColumns.date && (
                          <td className="border p-2">
                            {new Date(sale.saleDate).toLocaleDateString('ar-EG')}
                          </td>
                        )}
                        {printSettings.salesColumns.product && (
                          <td className="border p-2">{sale.product.name}</td>
                        )}
                        {printSettings.salesColumns.type && (
                          <td className="border p-2">
                            {sale.saleType === 'retail' ? 'تجزئة' : 'جملة'}
                          </td>
                        )}
                        {printSettings.salesColumns.quantity && (
                          <td className="border p-2">
                            {formatMeasurement({
                              ...sale.product,
                              quantity: sale.quantity,
                              weight: sale.weight,
                            })}
                          </td>
                        )}
                        {printSettings.salesColumns.price && (
                          <td className="border p-2">{formatCurrency(sale.unitPrice, sale.product.currency)}</td>
                        )}
                        {printSettings.salesColumns.total && (
                          <td className="border p-2">{formatCurrency(sale.totalPrice, sale.product.currency)}</td>
                        )}
                        {printSettings.salesColumns.payment && (
                          <td className="border p-2">
                            {sale.paymentMethod === 'cash' ? 'نقدي' : 'آجل'}
                          </td>
                        )}
                        {printSettings.salesColumns.customer && (
                          <td className="border p-2">{sale.customerName || '-'}</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Inventory Report Content */}
              {previewType === 'inventory' && (
                <>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        {printSettings.inventoryColumns.product && (
                          <th className="border p-2 text-right">المنتج</th>
                        )}
                        {printSettings.inventoryColumns.category && (
                          <th className="border p-2 text-right">الفئة</th>
                        )}
                        {printSettings.inventoryColumns.status && (
                          <th className="border p-2 text-right">الحالة</th>
                        )}
                        {printSettings.inventoryColumns.quantity && (
                          <th className="border p-2 text-right">الكمية</th>
                        )}
                        {printSettings.inventoryColumns.wholesaleValue && (
                          <th className="border p-2 text-right">قيمة الجملة</th>
                        )}
                        {printSettings.inventoryColumns.retailValue && (
                          <th className="border p-2 text-right">قيمة التجزئة</th>
                        )}
                        {printSettings.inventoryColumns.barcode && (
                          <th className="border p-2 text-right">الباركود</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((product) => {
                        const isOutOfStock = product.quantity === 0;
                        const isLowStock =
                          product.quantity > 0 && product.quantity <= (product.minStock || 10);

                        return (
                          <tr
                            key={product.id}
                            className={
                              isOutOfStock
                                ? 'bg-red-50'
                                : isLowStock
                                ? 'bg-amber-50'
                                : 'bg-green-50'
                            }
                          >
                            {printSettings.inventoryColumns.product && (
                              <td className="border p-2">{product.name}</td>
                            )}
                            {printSettings.inventoryColumns.category && (
                              <td className="border p-2">{product.category || '-'}</td>
                            )}
                            {printSettings.inventoryColumns.status && (
                              <td className="border p-2">
                                {isOutOfStock ? 'نفد' : isLowStock ? 'منخفض' : 'متوفر'}
                              </td>
                            )}
                            {printSettings.inventoryColumns.quantity && (
                              <td className="border p-2">{formatMeasurement(product)}</td>
                            )}
                            {printSettings.inventoryColumns.wholesaleValue && (
                              <td className="border p-2">
                                {formatCurrency(product.wholesalePrice * product.quantity, product.currency)}
                              </td>
                            )}
                            {printSettings.inventoryColumns.retailValue && (
                              <td className="border p-2">
                                {formatCurrency(product.retailPrice * product.quantity, product.currency)}
                              </td>
                            )}
                            {printSettings.inventoryColumns.barcode && (
                              <td className="border p-2">{product.barcode || '-'}</td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Inventory Notes */}
                  {printSettings.inventoryNotes && (
                    <div className="mt-6 p-4 border rounded">
                      <h3 className="font-bold mb-2">ملاحظات:</h3>
                      <p className="whitespace-pre-wrap">{printSettings.inventoryNotes}</p>
                    </div>
                  )}
                </>
              )}

              {/* Returns Report Content */}
              {previewType === 'returns' && (
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      {printSettings.returnsColumns.date && <th className="border p-2 text-right">التاريخ</th>}
                      {printSettings.returnsColumns.product && <th className="border p-2 text-right">المنتج</th>}
                      {printSettings.returnsColumns.quantity && <th className="border p-2 text-right">الكمية</th>}
                      {printSettings.returnsColumns.refund && <th className="border p-2 text-right">المبلغ المسترد</th>}
                      {printSettings.returnsColumns.reason && <th className="border p-2 text-right">السبب</th>}
                      {printSettings.returnsColumns.processor && <th className="border p-2 text-right">المعالج</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {returns.map((ret) => (
                      <tr key={ret.id}>
                        {printSettings.returnsColumns.date && (
                          <td className="border p-2">
                            {new Date(ret.returnDate).toLocaleDateString('ar-EG')}
                          </td>
                        )}
                        {printSettings.returnsColumns.product && (
                          <td className="border p-2">{ret.product.name}</td>
                        )}
                        {printSettings.returnsColumns.quantity && (
                          <td className="border p-2">
                            {formatMeasurement({
                              ...ret.product,
                              quantity: ret.returnedQuantity,
                              weight: ret.returnedWeight,
                            })}
                          </td>
                        )}
                        {printSettings.returnsColumns.refund && (
                          <td className="border p-2">{formatCurrency(ret.totalRefund, ret.product.currency)}</td>
                        )}
                        {printSettings.returnsColumns.reason && (
                          <td className="border p-2">{ret.reason || '-'}</td>
                        )}
                        {printSettings.returnsColumns.processor && (
                          <td className="border p-2">{ret.processedBy || '-'}</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

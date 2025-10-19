'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ShoppingCart, 
  Search, 
  Filter,
  Package,
  Tag,
  DollarSign
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useCurrency } from '@/context/CurrencyContext';
import { Product, CURRENCIES, WEIGHT_UNITS } from '@/types';
import { formatMeasurement, getMeasurementUnit, isOutOfStock, isLowStock, getInputStep, getCurrentStock } from '@/utils/measurement';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ProductsAndSales() {
  const { state, addSale } = useApp();
  const { products, categories } = state;
  const { formatCurrency } = useCurrency();
  
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailsProduct, setDetailsProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');

  const [saleFormData, setSaleFormData] = useState({
    quantity: 1,
    weight: 0,
    discount: 0,
    customerName: '',
    customerPhone: '',
    paymentMethod: 'cash' as 'cash' | 'card' | 'transfer',
  });

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    const matchesSubcategory = !selectedSubcategory || product.subcategory === selectedSubcategory;
    return matchesSearch && matchesCategory && matchesSubcategory;
  });

  const handleSaleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProduct) return;

    const soldAmount = selectedProduct.measurementType === 'quantity'
      ? saleFormData.quantity
      : saleFormData.weight;

    const unitPrice = selectedProduct.salePrice * (1 - saleFormData.discount / 100);
    const totalPrice = unitPrice * soldAmount;
    const finalPrice = totalPrice;

    addSale({
      productId: selectedProduct.id,
      product: selectedProduct,
      quantity: selectedProduct.measurementType === 'quantity' ? saleFormData.quantity : 0,
      weight: selectedProduct.measurementType === 'weight' ? saleFormData.weight : undefined,
      weightUnit: selectedProduct.measurementType === 'weight' ? selectedProduct.weightUnit : undefined,
      unitPrice,
      totalPrice,
      discount: saleFormData.discount,
      finalPrice,
      customerName: saleFormData.customerName || undefined,
      customerPhone: saleFormData.customerPhone || undefined,
      paymentMethod: saleFormData.paymentMethod,
    });

    resetSaleForm();
  };

  const resetSaleForm = () => {
    setSaleFormData({
      quantity: 1,
      weight: 0,
      discount: 0,
      customerName: '',
      customerPhone: '',
      paymentMethod: 'cash',
    });
    setSelectedProduct(null);
    setIsSaleModalOpen(false);
  };

  const handleProductSale = (product: Product) => {
    setSelectedProduct(product);
    setIsSaleModalOpen(true);
  };

  const handleProductDetails = (product: Product) => {
    setDetailsProduct(product);
    setIsDetailsModalOpen(true);
  };

  // Currency formatting is now handled by useCurrency hook

  const calculateFinalPrice = () => {
    if (!selectedProduct) return 0;
    const soldAmount = selectedProduct.measurementType === 'quantity'
      ? saleFormData.quantity
      : saleFormData.weight;
    const unitPrice = selectedProduct.salePrice * (1 - saleFormData.discount / 100);
    return unitPrice * soldAmount;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">المبيعات</h1>
          <p className="text-gray-600 text-lg">بيع المنتجات وإدارة المبيعات</p>
        </div>
      </div>


      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            البحث والتصفية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">البحث</Label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ابحث عن منتج..."
                  className="pr-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>الفئة</Label>
              <Select value={selectedCategory || "all"} onValueChange={(value) => {
                setSelectedCategory(value === "all" ? "" : value);
                setSelectedSubcategory("");
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع الفئات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الفئات</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>الفئة الفرعية</Label>
              <Select 
                value={selectedSubcategory || "all"} 
                onValueChange={(value) => setSelectedSubcategory(value === "all" ? "" : value)}
                disabled={!selectedCategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder="جميع الفئات الفرعية" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الفئات الفرعية</SelectItem>
                  {categories
                    .find(c => c.name === selectedCategory)
                    ?.subcategories.map(sub => (
                      <SelectItem key={sub.id} value={sub.name}>
                        {sub.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => {
          const finalPrice = product.salePrice * (1 - product.discount / 100);
          return (
            <Card
              key={product.id}
              className="hover:shadow-lg transition-all duration-200 border-0 bg-gradient-to-br from-white to-gray-50/50 group cursor-pointer"
              onClick={() => handleProductDetails(product)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg text-gray-800 group-hover:text-blue-600 transition-colors">{product.name}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {product.description.length > 45
                        ? `${product.description.substring(0, 45)}...`
                        : product.description}
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    <Tag className="h-3 w-3 mr-1" />
                    {product.category}
                  </Badge>
                </div>
                {product.subcategory && (
                  <Badge variant="secondary" className="w-fit mt-2 bg-gray-100 text-gray-600">
                    {product.subcategory}
                  </Badge>
                )}
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">السعر الأساسي:</span>
                      <div className="text-left">
                        <span className="font-semibold text-gray-800">
                          {formatCurrency(product.salePrice, product.currency)}
                        </span>
                        <Badge variant="outline" className="ml-2 text-xs">
                          {CURRENCIES[product.currency].symbol}
                        </Badge>
                      </div>
                    </div>
                    
                    {product.discount > 0 && (
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">الخصم:</span>
                        <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                          {product.discount}%
                        </Badge>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center border-t pt-2">
                      <span className="text-sm font-medium text-gray-700">السعر النهائي:</span>
                      <span className="font-bold text-emerald-600 text-lg">
                        {formatCurrency(finalPrice, product.currency)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">المتوفر:</span>
                    <Badge
                      variant={
                        !isLowStock(product) ? "default" :
                        !isOutOfStock(product) ? "secondary" : "destructive"
                      }
                      className={`font-semibold ${
                        !isLowStock(product)
                          ? 'bg-emerald-100 text-emerald-700'
                          : !isOutOfStock(product)
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {formatMeasurement(product)}
                    </Badge>
                  </div>

                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleProductSale(product);
                    }}
                    disabled={isOutOfStock(product)}
                    className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/25 disabled:from-gray-400 disabled:to-gray-400 disabled:shadow-none"
                  >
                    {isOutOfStock(product) ? (
                      <>
                        <Package className="h-4 w-4 mr-2" />
                        نفد المخزون
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        بيع الآن
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <Card>
          <CardContent className="text-center py-16">
            <Package className="h-20 w-20 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">لا توجد منتجات متاحة</h3>
            <p className="text-gray-600 mb-6">
              {products.length === 0 
                ? "لم يتم إضافة أي منتجات بعد" 
                : "لا توجد منتجات تطابق البحث الحالي"}
            </p>
            <Link href="/warehouse">
              <Button className="bg-blue-500 hover:bg-blue-600">
                <Package className="h-4 w-4 mr-2" />
                اذهب لإضافة منتجات
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Sale Modal */}
      {isSaleModalOpen && selectedProduct && (
        <Dialog open={isSaleModalOpen} onOpenChange={setIsSaleModalOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                تسجيل مبيعة
              </DialogTitle>
            </DialogHeader>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100 mb-6">
              <h3 className="font-bold text-blue-900 mb-2">{selectedProduct.name}</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">السعر الأساسي:</span>
                  <p className="font-semibold text-blue-900">{formatCurrency(selectedProduct.salePrice, selectedProduct.currency)}</p>
                </div>
                <div>
                  <span className="text-blue-700">المتوفر:</span>
                  <p className="font-semibold text-blue-900">{formatMeasurement(selectedProduct)}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {selectedProduct.measurementType === 'quantity' ? (
                  <div className="space-y-2">
                    <Label htmlFor="quantity">الكمية (قطعة) *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      required
                      min="1"
                      step="1"
                      max={selectedProduct.quantity}
                      value={saleFormData.quantity}
                      onChange={(e) => setSaleFormData({ ...saleFormData, quantity: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="weight">الوزن ({getMeasurementUnit(selectedProduct)}) *</Label>
                    <Input
                      id="weight"
                      type="number"
                      required
                      min="0.001"
                      step={getInputStep('weight', selectedProduct.weightUnit)}
                      max={selectedProduct.weight}
                      value={saleFormData.weight}
                      onChange={(e) => setSaleFormData({ ...saleFormData, weight: parseFloat(e.target.value) || 0 })}
                      placeholder={`الحد الأقصى: ${selectedProduct.weight} ${getMeasurementUnit(selectedProduct)}`}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="discount">خصم إضافي (%)</Label>
                  <Input
                    id="discount"
                    type="number"
                    min="0"
                    max="100"
                    value={saleFormData.discount}
                    onChange={(e) => setSaleFormData({ ...saleFormData, discount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerName">اسم العميل</Label>
                <Input
                  id="customerName"
                  value={saleFormData.customerName}
                  onChange={(e) => setSaleFormData({ ...saleFormData, customerName: e.target.value })}
                  placeholder="اختياري"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerPhone">رقم الهاتف</Label>
                <Input
                  id="customerPhone"
                  type="tel"
                  value={saleFormData.customerPhone}
                  onChange={(e) => setSaleFormData({ ...saleFormData, customerPhone: e.target.value })}
                  placeholder="اختياري"
                />
              </div>

              <div className="space-y-2">
                <Label>طريقة الدفع *</Label>
                <Select
                  required
                  value={saleFormData.paymentMethod}
                  onValueChange={(value) => setSaleFormData({ ...saleFormData, paymentMethod: value as 'cash' | 'card' | 'transfer' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">نقداً</SelectItem>
                    <SelectItem value="card">بطاقة</SelectItem>
                    <SelectItem value="transfer">تحويل</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 p-4 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-emerald-700 font-medium">المجموع النهائي:</span>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-emerald-800">{formatCurrency(calculateFinalPrice(), selectedProduct.currency)}</p>
                    <p className="text-xs text-emerald-600">شامل الخصم</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetSaleForm}
                >
                  إلغاء
                </Button>
                <Button 
                  type="submit"
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  تأكيد البيع
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Product Details Modal */}
      {isDetailsModalOpen && detailsProduct && (
        <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">تفاصيل المنتج</DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Product Header */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                <h2 className="text-2xl font-bold text-blue-900 mb-2">{detailsProduct.name}</h2>
                <p className="text-gray-700">{detailsProduct.description}</p>
              </div>

              {/* Categories */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">الفئة</p>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                    {detailsProduct.category}
                  </Badge>
                </div>
                {detailsProduct.subcategory && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">الفئة الفرعية</p>
                    <Badge variant="secondary">{detailsProduct.subcategory}</Badge>
                  </div>
                )}
              </div>

              {/* Pricing */}
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-6 rounded-xl border border-emerald-100">
                <h3 className="font-bold text-emerald-900 mb-4">معلومات الأسعار</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-emerald-700">سعر الجملة</p>
                    <p className="text-xl font-bold text-emerald-900">
                      {formatCurrency(detailsProduct.wholesalePrice, detailsProduct.currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-emerald-700">سعر البيع</p>
                    <p className="text-xl font-bold text-emerald-900">
                      {formatCurrency(detailsProduct.salePrice, detailsProduct.currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-emerald-700">العملة</p>
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      {CURRENCIES[detailsProduct.currency].symbol} {CURRENCIES[detailsProduct.currency].name}
                    </Badge>
                  </div>
                  {detailsProduct.discount > 0 && (
                    <div>
                      <p className="text-sm text-emerald-700">الخصم</p>
                      <Badge variant="secondary" className="text-lg">{detailsProduct.discount}%</Badge>
                    </div>
                  )}
                </div>
                {detailsProduct.discount > 0 && (
                  <div className="mt-4 pt-4 border-t border-emerald-200">
                    <p className="text-sm text-emerald-700 mb-1">السعر النهائي بعد الخصم</p>
                    <p className="text-2xl font-bold text-emerald-900">
                      {formatCurrency(detailsProduct.salePrice * (1 - detailsProduct.discount / 100), detailsProduct.currency)}
                    </p>
                  </div>
                )}
              </div>

              {/* Stock Information */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-100">
                <h3 className="font-bold text-purple-900 mb-4">معلومات المخزون</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-purple-700">نوع القياس</p>
                    <Badge variant="outline" className={detailsProduct.measurementType === 'quantity' ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"}>
                      {detailsProduct.measurementType === 'quantity' ? 'قطع (عدد)' : `وزن (${getMeasurementUnit(detailsProduct)})`}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-purple-700">الكمية المتوفرة</p>
                    <p className="text-xl font-bold text-purple-900">{formatMeasurement(detailsProduct)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-purple-700">الحد الأدنى</p>
                    <p className="text-lg font-semibold text-purple-900">
                      {detailsProduct.measurementType === 'quantity'
                        ? `${detailsProduct.minQuantity} قطعة`
                        : `${detailsProduct.minWeight} ${getMeasurementUnit(detailsProduct)}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-purple-700">حالة المخزون</p>
                    <Badge
                      variant={
                        isOutOfStock(detailsProduct) ? "destructive" :
                        isLowStock(detailsProduct) ? "secondary" :
                        "default"
                      }
                      className={
                        isOutOfStock(detailsProduct) ? "bg-red-100 text-red-700" :
                        isLowStock(detailsProduct) ? "bg-amber-100 text-amber-700" :
                        "bg-emerald-100 text-emerald-700"
                      }
                    >
                      {isOutOfStock(detailsProduct) ? 'نفد المخزون' :
                       isLowStock(detailsProduct) ? 'مخزون منخفض' :
                       'متوفر'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              {detailsProduct.barcode && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">الباركود</p>
                  <p className="font-mono text-lg font-semibold text-gray-800">{detailsProduct.barcode}</p>
                </div>
              )}

              {/* Action Button */}
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsDetailsModalOpen(false)}>
                  إغلاق
                </Button>
                {!isOutOfStock(detailsProduct) && (
                  <Button
                    onClick={() => {
                      setIsDetailsModalOpen(false);
                      handleProductSale(detailsProduct);
                    }}
                    className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    بيع الآن
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
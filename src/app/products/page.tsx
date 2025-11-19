"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  Search,
  Filter,
  Package,
  Tag,
  DollarSign,
  Undo2,
  Plus,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useCurrency } from "@/context/CurrencyContext";
import { useCart } from "@/context/CartContext";
import { Product, Sale, CURRENCIES, WEIGHT_UNITS } from "@/types";
import {
  formatMeasurement,
  getMeasurementUnit,
  isOutOfStock,
  isLowStock,
  getInputStep,
  getCurrentStock,
} from "@/utils/measurement";
import {
  getReturnableSales,
  validateReturnAmount,
  calculateReturnRefund,
  getRemainingSaleAmount,
} from "@/utils/returnValidation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FloatingCartButton } from "@/components/cart/FloatingCartButton";
import { CartPanel } from "@/components/cart/CartPanel";
import { CartCheckoutDialog } from "@/components/cart/CartCheckoutDialog";
import { toast } from "sonner";

export default function ProductsAndSales() {
  const { state, addSale, processReturn } = useApp();
  const { products, categories, sales, returns } = state;
  const { formatCurrency } = useCurrency();
  const { addItem: addToCart, items: cartItems } = useCart();

  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [returnProduct, setReturnProduct] = useState<Product | null>(null);
  const [detailsProduct, setDetailsProduct] = useState<Product | null>(null);
  const [selectedSaleForReturn, setSelectedSaleForReturn] =
    useState<Sale | null>(null);
  const [returnableSales, setReturnableSales] = useState<Sale[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");

  // Barcode scanning state
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const [barcodeInput, setBarcodeInput] = useState("");

  const [saleFormData, setSaleFormData] = useState({
    saleType: "retail" as "retail" | "wholesale",
    quantity: 1,
    weight: 0,
    discount: 0,
    customerName: "",
    paymentMethod: "cash" as "cash" | "debt",
    debtCustomerId: "",
  });

  const [returnFormData, setReturnFormData] = useState({
    returnQuantity: 0,
    returnWeight: 0,
    reason: "",
  });

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      !selectedCategory || product.category === selectedCategory;
    const matchesSubcategory =
      !selectedSubcategory || product.subcategory === selectedSubcategory;
    return matchesSearch && matchesCategory && matchesSubcategory;
  });

  const handleSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProduct) return;

    // Validate customer selection for debt sales
    if (saleFormData.paymentMethod === "debt" && !saleFormData.debtCustomerId) {
      toast.error("يرجى اختيار عميل من دفتر الديون");
      return;
    }

    const soldAmount =
      selectedProduct.measurementType === "quantity"
        ? saleFormData.quantity
        : saleFormData.weight;

    // Calculate unit price based on sale type
    let unitPrice: number;
    let discount: number;

    if (saleFormData.saleType === "wholesale") {
      // Wholesale: use wholesalePrice with optional discount
      unitPrice = selectedProduct.wholesalePrice - (saleFormData.discount || 0);
      discount = saleFormData.discount;
    } else {
      // Retail: use salePrice with product and additional discounts (fixed amounts)
      const priceAfterProductDiscount =
        selectedProduct.salePrice - (selectedProduct.discount || 0);
      unitPrice = priceAfterProductDiscount - (saleFormData.discount || 0);
      discount = saleFormData.discount;
    }

    const totalPrice = unitPrice * soldAmount;
    const finalPrice = totalPrice;

    const saleData = {
      productId: selectedProduct.id,
      product: selectedProduct,
      saleType: saleFormData.saleType,
      quantity:
        selectedProduct.measurementType === "quantity"
          ? saleFormData.quantity
          : 0,
      weight:
        selectedProduct.measurementType === "weight"
          ? saleFormData.weight
          : undefined,
      weightUnit:
        selectedProduct.measurementType === "weight"
          ? selectedProduct.weightUnit
          : undefined,
      unitPrice,
      totalPrice,
      discount,
      finalPrice,
      customerName: saleFormData.customerName || undefined,
      paymentMethod: saleFormData.paymentMethod,
      debtCustomerId: saleFormData.paymentMethod === "debt" && saleFormData.debtCustomerId ? saleFormData.debtCustomerId : undefined,
    };

    try {
      await addSale(saleData);

      toast.success("تمت عملية البيع بنجاح", {
        description: `المبلغ الإجمالي: ${formatCurrency(
          finalPrice,
          selectedProduct.currency
        )}`,
        duration: 5000,
      });

      resetSaleForm();
      setIsSaleModalOpen(false);
    } catch (error) {
      toast.error("فشل إضافة عملية البيع", {
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        duration: 5000,
      });
    }
  };

  const resetSaleForm = () => {
    setSaleFormData({
      saleType: "retail",
      quantity: 1,
      weight: 0,
      discount: 0,
      customerName: "",
      paymentMethod: "cash",
      debtCustomerId: "",
    });
    setSelectedProduct(null);
    setIsSaleModalOpen(false);
  };

  const handleProductSale = (product: Product) => {
    setSelectedProduct(product);
    setSaleFormData({
      saleType: "retail",
      quantity: 1,
      weight: 0,
      discount: 0,
      customerName: "",
      paymentMethod: "cash",
      debtCustomerId: "",
    });
    setIsSaleModalOpen(true);
  };

  const handleAddToCart = (product: Product) => {
    try {
      const defaultQuantity = product.measurementType === 'quantity' ? 1 : 0;
      const defaultWeight = product.measurementType === 'weight' ? 1 : undefined;

      // Check if product already exists in cart
      const existingItem = cartItems.find(
        item => item.product.id === product.id && item.saleType === 'retail'
      );

      addToCart(product, 'retail', defaultQuantity, defaultWeight, 0);

      if (existingItem) {
        toast.success(`تم زيادة الكمية لـ ${product.name}`);
      } else {
        toast.success(`تمت إضافة ${product.name} إلى السلة`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'فشل إضافة المنتج إلى السلة';
      toast.error(errorMessage);
    }
  };

  const handleProductDetails = (product: Product) => {
    setDetailsProduct(product);
    setIsDetailsModalOpen(true);
  };

  const handleProductReturn = (product: Product) => {
    setReturnProduct(product);
    const returnableSalesForProduct = getReturnableSales(
      sales,
      product.id,
      returns
    );
    setReturnableSales(returnableSalesForProduct);

    if (returnableSalesForProduct.length === 0) {
      toast.error("لا توجد مبيعات قابلة للإرجاع", {
        description: "هذا المنتج ليس له مبيعات يمكن إرجاعها",
        duration: 5000,
      });
      return;
    }

    // Auto-select the most recent sale
    setSelectedSaleForReturn(returnableSalesForProduct[0]);
    setIsReturnModalOpen(true);
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!returnProduct || !selectedSaleForReturn) return;

    const returnAmount =
      returnProduct.measurementType === "quantity"
        ? returnFormData.returnQuantity
        : returnFormData.returnWeight;

    // Validate return amount
    const validation = validateReturnAmount(
      selectedSaleForReturn,
      returnAmount,
      returns
    );
    if (!validation.valid) {
      toast.error("كمية الإرجاع غير صحيحة", {
        description: validation.error,
        duration: 5000,
      });
      return;
    }

    try {
      const refundAmount = calculateReturnRefund(
        selectedSaleForReturn,
        returnAmount
      );

      await processReturn({
        saleId: selectedSaleForReturn.id,
        productId: returnProduct.id,
        returnedQuantity:
          returnProduct.measurementType === "quantity" ? returnAmount : 0,
        returnedWeight:
          returnProduct.measurementType === "weight" ? returnAmount : undefined,
        weightUnit:
          returnProduct.measurementType === "weight"
            ? returnProduct.weightUnit
            : undefined,
        unitPrice: selectedSaleForReturn.unitPrice,
        totalRefund: refundAmount,
        reason: returnFormData.reason || undefined,
      });

      toast.success("تمت عملية الإرجاع بنجاح", {
        description: `المبلغ المسترد: ${formatCurrency(
          refundAmount,
          returnProduct.currency
        )}`,
        duration: 5000,
      });

      resetReturnForm();
    } catch (error) {
      toast.error("فشل في معالجة الإرجاع", {
        description: error instanceof Error ? error.message : "خطأ غير معروف",
        duration: 5000,
      });
    }
  };

  const resetReturnForm = () => {
    setReturnFormData({
      returnQuantity: 0,
      returnWeight: 0,
      reason: "",
    });
    setReturnProduct(null);
    setSelectedSaleForReturn(null);
    setReturnableSales([]);
    setIsReturnModalOpen(false);
  };

  const calculateCurrentReturnRefund = () => {
    if (!returnProduct || !selectedSaleForReturn) return 0;
    const returnAmount =
      returnProduct.measurementType === "quantity"
        ? returnFormData.returnQuantity
        : returnFormData.returnWeight;
    return selectedSaleForReturn.unitPrice * returnAmount;
  };

  // Barcode scanning handlers
  const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && barcodeInput.trim()) {
      e.preventDefault();
      handleBarcodeScanned(barcodeInput.trim());
      setBarcodeInput(""); // Clear input after processing
    }
  };

  const handleBarcodeScanned = (barcode: string) => {
    // Find product by barcode
    const product = products.find((p) => p.barcode === barcode);

    if (product) {
      // Product found - check stock and open sales modal
      if (isOutOfStock(product)) {
        toast.error("المنتج نفد من المخزون", {
          description: `${product.name} - غير متوفر حالياً`,
          duration: 5000,
        });
      } else {
        handleProductSale(product);
        toast.success("تم العثور على المنتج", {
          description: product.name,
          duration: 2000,
        });
      }
    } else {
      // Product not found - show error toast
      toast.error("المنتج غير موجود", {
        description: `الباركود "${barcode}" غير مسجل في النظام`,
        duration: 5000,
        action: {
          label: "إغلاق",
          onClick: () => { }, // Manual dismiss
        },
      });
    }
  };

  // Currency formatting is now handled by useCurrency hook

  const calculateFinalPrice = () => {
    if (!selectedProduct) return 0;
    const soldAmount =
      selectedProduct.measurementType === "quantity"
        ? saleFormData.quantity
        : saleFormData.weight;
    const unitPrice =
      selectedProduct.salePrice * (1 - saleFormData.discount / 100);
    return unitPrice * soldAmount;
  };

  // Auto-focus barcode input on mount and after modal closes
  useEffect(() => {
    if (!isSaleModalOpen && !isDetailsModalOpen && !isReturnModalOpen) {
      // Small delay to avoid interfering with other focus events
      const timer = setTimeout(() => {
        barcodeInputRef.current?.focus();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isSaleModalOpen, isDetailsModalOpen, isReturnModalOpen]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
            المبيعات
          </h1>
          <p className="text-gray-600 text-lg">بيع المنتجات وإدارة المبيعات</p>
        </div>
      </div>

      {/* Hidden Barcode Scanner Input */}
      <input
        ref={barcodeInputRef}
        type="text"
        value={barcodeInput}
        onChange={(e) => setBarcodeInput(e.target.value)}
        onKeyDown={handleBarcodeKeyDown}
        className="sr-only"
        placeholder="Barcode Scanner"
        autoComplete="off"
        aria-label="Barcode Scanner Input"
      />

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
              <Select
                value={selectedCategory || "all"}
                onValueChange={(value) => {
                  setSelectedCategory(value === "all" ? "" : value);
                  setSelectedSubcategory("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="جميع الفئات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الفئات</SelectItem>
                  {categories.map((category) => (
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
                onValueChange={(value) =>
                  setSelectedSubcategory(value === "all" ? "" : value)
                }
                disabled={!selectedCategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder="جميع الفئات الفرعية" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الفئات الفرعية</SelectItem>
                  {categories
                    .find((c) => c.name === selectedCategory)
                    ?.subcategories.map((sub) => (
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
          const finalPrice = product.salePrice - (product.discount || 0);
          return (
            <Card
              key={product.id}
              className="hover:shadow-lg transition-all duration-200 border-0 bg-gradient-to-br from-white to-gray-50/50 group cursor-pointer flex flex-col h-full"
              onClick={() => handleProductDetails(product)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg text-gray-800 group-hover:text-blue-600 transition-colors">
                      {product.name}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {product.description.length > 45
                        ? `${product.description.substring(0, 45)}...`
                        : product.description}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-blue-50 text-blue-700 border-blue-200"
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    {product.category}
                  </Badge>
                </div>
                {product.subcategory && (
                  <Badge
                    variant="secondary"
                    className="w-fit mt-2 bg-gray-100 text-gray-600"
                  >
                    {product.subcategory}
                  </Badge>
                )}
              </CardHeader>

              <CardContent className="pt-0 flex-1 flex flex-col">
                <div className="space-y-3 flex-1 flex flex-col">
                  {/* Wholesale Price Section */}
                  <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">📦</span>
                      <span className="text-sm font-semibold text-green-800">
                        بيع جملة
                      </span>
                    </div>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between items-center pt-1.5">
                        <span className="font-semibold text-green-800">
                          السعر:
                        </span>
                        <span className="font-bold text-green-900 text-base">
                          {formatCurrency(
                            product.wholesalePrice || 0,
                            product.currency
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Retail Price Section */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">🏪</span>
                      <span className="text-sm font-semibold text-blue-800">
                        بيع تجزئة
                      </span>
                    </div>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-blue-700">السعر الأساسي:</span>
                        <span className="font-medium text-blue-900">
                          {formatCurrency(product.salePrice, product.currency)}
                        </span>
                      </div>
                      {product.discount > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-blue-700">الخصم:</span>
                          <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-xs">
                            {formatCurrency(product.discount, product.currency)}
                          </Badge>
                        </div>
                      )}
                      <div className="flex justify-between items-center border-t border-blue-300 pt-1.5">
                        <span className="font-semibold text-blue-800">
                          السعر:
                        </span>
                        <span className="font-bold text-blue-900 text-base">
                          {formatCurrency(finalPrice, product.currency)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-auto">
                    <span className="text-sm text-gray-600">المتوفر:</span>
                    <Badge
                      variant={
                        !isLowStock(product)
                          ? "default"
                          : !isOutOfStock(product)
                            ? "secondary"
                            : "destructive"
                      }
                      className={`font-semibold ${!isLowStock(product)
                          ? "bg-emerald-100 text-emerald-700"
                          : !isOutOfStock(product)
                            ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"
                        }`}
                    >
                      {formatMeasurement(product)}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 mt-auto pt-3">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(product);
                      }}
                      disabled={isOutOfStock(product)}
                      variant="outline"
                      size="sm"
                      className="text-[12px] font-medium w-full h-8 border-blue-500 text-blue-600 hover:bg-blue-50 hover:text-blue-700 disabled:border-gray-300 disabled:text-gray-400 px-2"
                      title="إضافة للسلة"
                    >
                      سلة
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleProductSale(product);
                      }}
                      disabled={isOutOfStock(product)}
                      size="sm"
                      className="w-full h-8 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-xs shadow-lg shadow-emerald-500/25 disabled:from-gray-400 disabled:to-gray-400 disabled:shadow-none px-2"
                    >
                      {isOutOfStock(product) ? (
                        <>
                          <Package className="h-3 w-3 mr-1" />
                          <span className="text-xs">نفد</span>
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="h-3 w-3 mr-1" />
                          <span className="text-xs">بيع</span>
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleProductReturn(product);
                      }}
                      variant="outline"
                      size="sm"
                      className="w-full h-8 border-orange-500 text-orange-600 hover:bg-orange-50 hover:text-orange-700 text-xs px-2"
                    >
                      <Undo2 className="h-3 w-3 mr-1" />
                      <span className="text-xs">إرجاع</span>
                    </Button>
                  </div>
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
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              لا توجد منتجات متاحة
            </h3>
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
              <h3 className="font-bold text-blue-900 mb-2">
                {selectedProduct.name}
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">السعر الأساسي:</span>
                  <p className="font-semibold text-blue-900">
                    {formatCurrency(
                      selectedProduct.salePrice,
                      selectedProduct.currency
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-blue-700">المتوفر:</span>
                  <p className="font-semibold text-blue-900">
                    {formatMeasurement(selectedProduct)}
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaleSubmit} className="space-y-4">
              {/* Sale Type Selector */}
              <div className="space-y-2">
                <Label>نوع البيع *</Label>
                <Select
                  required
                  value={saleFormData.saleType}
                  onValueChange={(value) => {
                    const newSaleType = value as "retail" | "wholesale";
                    // Keep discount but validate against new sale type's max
                    const currentDiscount = saleFormData.discount;
                    let maxDiscount: number;

                    if (newSaleType === "wholesale") {
                      maxDiscount = selectedProduct.wholesalePrice;
                    } else {
                      maxDiscount = selectedProduct.salePrice - (selectedProduct.discount || 0);
                    }

                    setSaleFormData({
                      ...saleFormData,
                      saleType: newSaleType,
                      discount: Math.min(currentDiscount, Math.max(0, maxDiscount)),
                    });
                  }}
                >
                  <SelectTrigger
                    className={
                      saleFormData.saleType === "retail"
                        ? "border-blue-300 bg-blue-50"
                        : "border-green-300 bg-green-50"
                    }
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="retail">
                      <div className="flex items-center gap-2">
                        <span className="text-blue-600">●</span>
                        <div>
                          <p className="font-medium">بيع تجزئة</p>
                          <p className="text-xs text-muted-foreground">
                            السعر:{" "}
                            {formatCurrency(
                              selectedProduct.salePrice -
                              (selectedProduct.discount || 0),
                              selectedProduct.currency
                            )}
                          </p>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="wholesale">
                      <div className="flex items-center gap-2">
                        <span className="text-green-600">●</span>
                        <div>
                          <p className="font-medium">بيع جملة</p>
                          <p className="text-xs text-muted-foreground">
                            السعر:{" "}
                            {formatCurrency(
                              selectedProduct.wholesalePrice || 0,
                              selectedProduct.currency
                            )}
                          </p>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>

              </div>

              <div className="grid grid-cols-2 gap-4">
                {selectedProduct.measurementType === "quantity" ? (
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
                      onChange={(e) =>
                        setSaleFormData({
                          ...saleFormData,
                          quantity: parseInt(e.target.value) || 1,
                        })
                      }
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="weight">
                      الوزن ({getMeasurementUnit(selectedProduct)}) *
                    </Label>
                    <Input
                      id="weight"
                      type="number"
                      required
                      min="0.001"
                      step={getInputStep("weight", selectedProduct.weightUnit)}
                      max={selectedProduct.weight}
                      value={
                        saleFormData.weight === 0 ? "" : saleFormData.weight
                      }
                      onChange={(e) =>
                        setSaleFormData({
                          ...saleFormData,
                          weight:
                            e.target.value === ""
                              ? 0
                              : parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder={`الحد الأقصى: ${selectedProduct.weight
                        } ${getMeasurementUnit(selectedProduct)}`}
                    />
                  </div>
                )}

                {/* Discount field for both retail and wholesale sales */}
                <div className="space-y-2">
                  <Label htmlFor="discount">
                    {saleFormData.saleType === "wholesale"
                      ? `خصم (اختياري) - ${CURRENCIES[selectedProduct.currency].symbol}`
                      : `خصم إضافي (${CURRENCIES[selectedProduct.currency].symbol})`}
                  </Label>
                  <Input
                    id="discount"
                    type="number"
                    min="0"
                    step={selectedProduct.currency === "IQD" ? "1" : "0.01"}
                    value={
                      saleFormData.discount === 0 ? "" : saleFormData.discount
                    }
                    onChange={(e) => {
                      const discountValue =
                        e.target.value === ""
                          ? 0
                          : parseFloat(e.target.value) || 0;
                      // Calculate max discount based on sale type
                      let maxDiscount: number;
                      if (saleFormData.saleType === "wholesale") {
                        // For wholesale: max discount is the wholesale price
                        maxDiscount = Math.max(0, selectedProduct.wholesalePrice);
                      } else {
                        // For retail: max discount is sale price minus product discount
                        const priceAfterProductDiscount =
                          selectedProduct.salePrice -
                          (selectedProduct.discount || 0);
                        maxDiscount = Math.max(0, priceAfterProductDiscount);
                      }
                      setSaleFormData({
                        ...saleFormData,
                        discount: Math.min(discountValue, maxDiscount),
                      });
                    }}
                    placeholder={`الحد الأقصى: ${formatCurrency(
                      saleFormData.saleType === "wholesale"
                        ? Math.max(0, selectedProduct.wholesalePrice)
                        : Math.max(
                          0,
                          selectedProduct.salePrice -
                          (selectedProduct.discount || 0)
                        ),
                      selectedProduct.currency
                    )}`}
                  />
                </div>
              </div>


              <div className="space-y-2">
                <Label>طريقة الدفع *</Label>
                <Select
                  required
                  value={saleFormData.paymentMethod}
                  onValueChange={(value) =>
                    setSaleFormData({
                      ...saleFormData,
                      paymentMethod: value as "cash" | "debt",
                      debtCustomerId: value === "cash" ? "" : saleFormData.debtCustomerId,
                      customerName: value === "cash" ? "" : saleFormData.customerName,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">💵 نقداً</SelectItem>
                    <SelectItem value="debt">📝 آجل (دين)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Show customer select when debt payment is chosen */}
              {saleFormData.paymentMethod === "debt" && (
                <div className="space-y-2">
                  <Label>اختر العميل *</Label>
                  <Select
                    required
                    value={saleFormData.debtCustomerId}
                    onValueChange={(value) => {
                      const selectedCustomer = state.debtCustomers.find(c => c.id === value);
                      setSaleFormData({
                        ...saleFormData,
                        debtCustomerId: value,
                        customerName: selectedCustomer?.name || '',
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر عميل من دفتر الديون" />
                    </SelectTrigger>
                    <SelectContent>
                      {state.debtCustomers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name} - {customer.phone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {state.debtCustomers.length === 0 && (
                    <p className="text-sm text-amber-600">
                      لا يوجد عملاء في دفتر الديون. يرجى إضافة عميل أولاً.
                    </p>
                  )}
                </div>
              )}

              <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 p-4 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-emerald-700 font-medium">
                    المجموع النهائي:
                  </span>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-emerald-800">
                      {formatCurrency(
                        calculateFinalPrice(),
                        selectedProduct.currency
                      )}
                    </p>
                    <p className="text-xs text-emerald-600">شامل الخصم</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-4 pt-6">
                <Button type="button" variant="outline" onClick={resetSaleForm}>
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

      {/* Return Modal */}
      {isReturnModalOpen && returnProduct && (
        <Dialog open={isReturnModalOpen} onOpenChange={setIsReturnModalOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Undo2 className="h-5 w-5 text-orange-600" />
                معالجة المرتجع
              </DialogTitle>
            </DialogHeader>

            <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-xl border border-orange-100 mb-6">
              <h3 className="font-bold text-orange-900 mb-2">
                {returnProduct.name}
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-orange-700">فئة المنتج:</span>
                  <p className="font-semibold text-orange-900">
                    {returnProduct.category}
                  </p>
                </div>
                <div>
                  <span className="text-orange-700">المخزون الحالي:</span>
                  <p className="font-semibold text-orange-900">
                    {formatMeasurement(returnProduct)}
                  </p>
                </div>
              </div>
            </div>

            {returnableSales.length === 0 ? (
              <Alert>
                <AlertDescription>
                  لا توجد مبيعات يمكن إرجاعها لهذا المنتج
                </AlertDescription>
              </Alert>
            ) : (
              <form onSubmit={handleReturnSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="saleSelect">اختر المبيعة للإرجاع *</Label>
                  <Select
                    value={selectedSaleForReturn?.id || ""}
                    onValueChange={(value) => {
                      const sale = returnableSales.find((s) => s.id === value);
                      setSelectedSaleForReturn(sale || null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {returnableSales.map((sale) => {
                        const saleAmount =
                          returnProduct.measurementType === "quantity"
                            ? sale.quantity
                            : sale.weight || 0;
                        const remaining = getRemainingSaleAmount(sale, returns);
                        const saleDate = new Date(
                          sale.saleDate
                        ).toLocaleDateString();

                        return (
                          <SelectItem key={sale.id} value={sale.id}>
                            {saleDate} - {remaining}{" "}
                            {returnProduct.measurementType === "quantity"
                              ? "قطعة"
                              : returnProduct.weightUnit}{" "}
                            متاح (
                            {formatCurrency(
                              sale.unitPrice,
                              returnProduct.currency
                            )}{" "}
                            للقطعة)
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {selectedSaleForReturn && (
                  <>
                    {returnProduct.measurementType === "quantity" ? (
                      <div className="space-y-2">
                        <Label htmlFor="returnQuantity">
                          كمية الإرجاع (قطعة) *
                        </Label>
                        <Input
                          id="returnQuantity"
                          type="number"
                          required
                          min="1"
                          step="1"
                          max={getRemainingSaleAmount(
                            selectedSaleForReturn,
                            returns
                          )}
                          value={
                            returnFormData.returnQuantity === 0
                              ? ""
                              : returnFormData.returnQuantity
                          }
                          onChange={(e) =>
                            setReturnFormData({
                              ...returnFormData,
                              returnQuantity:
                                e.target.value === ""
                                  ? 0
                                  : parseInt(e.target.value) || 0,
                            })
                          }
                          placeholder={`الحد الأقصى: ${getRemainingSaleAmount(
                            selectedSaleForReturn,
                            returns
                          )}`}
                        />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label htmlFor="returnWeight">
                          وزن الإرجاع ({getMeasurementUnit(returnProduct)}) *
                        </Label>
                        <Input
                          id="returnWeight"
                          type="number"
                          required
                          min="0.001"
                          step={getInputStep(
                            "weight",
                            returnProduct.weightUnit
                          )}
                          max={getRemainingSaleAmount(
                            selectedSaleForReturn,
                            returns
                          )}
                          value={
                            returnFormData.returnWeight === 0
                              ? ""
                              : returnFormData.returnWeight
                          }
                          onChange={(e) =>
                            setReturnFormData({
                              ...returnFormData,
                              returnWeight:
                                e.target.value === ""
                                  ? 0
                                  : parseFloat(e.target.value) || 0,
                            })
                          }
                          placeholder={`الحد الأقصى: ${getRemainingSaleAmount(
                            selectedSaleForReturn,
                            returns
                          )} ${getMeasurementUnit(returnProduct)}`}
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="returnReason">سبب الإرجاع</Label>
                      <Input
                        id="returnReason"
                        value={returnFormData.reason}
                        onChange={(e) =>
                          setReturnFormData({
                            ...returnFormData,
                            reason: e.target.value,
                          })
                        }
                        placeholder="اختياري - مثال: تالف، خطأ في الصنف، إلخ"
                      />
                    </div>

                    <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 p-4 rounded-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-orange-700 font-medium">
                          مبلغ الاسترداد:
                        </span>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-orange-800">
                            {formatCurrency(
                              calculateCurrentReturnRefund(),
                              returnProduct.currency
                            )}
                          </p>
                          <p className="text-xs text-orange-600">
                            إجمالي الاسترداد
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-4 pt-6">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={resetReturnForm}
                      >
                        إلغاء
                      </Button>
                      <Button
                        type="submit"
                        className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                      >
                        <Undo2 className="h-4 w-4 mr-2" />
                        تأكيد الإرجاع
                      </Button>
                    </div>
                  </>
                )}
              </form>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Product Details Modal */}
      {isDetailsModalOpen && detailsProduct && (
        <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
          <DialogContent className="min-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">تفاصيل المنتج</DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Product Header */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                <h2 className="text-2xl font-bold text-blue-900 mb-2">
                  {detailsProduct.name}
                </h2>
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
                    <Badge variant="secondary">
                      {detailsProduct.subcategory}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Pricing */}
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-6 rounded-xl border border-emerald-100">
                <h3 className="font-bold text-emerald-900 mb-4">
                  معلومات الأسعار
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-emerald-700">
                      سعر الجملة الجملة
                    </p>
                    <p className="text-xl font-bold text-emerald-900">
                      {formatCurrency(
                        detailsProduct.wholesalePrice,
                        detailsProduct.currency
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-emerald-700">سعر البيع</p>
                    <p className="text-xl font-bold text-emerald-900">
                      {formatCurrency(
                        detailsProduct.salePrice,
                        detailsProduct.currency
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-emerald-700">العملة</p>
                    <Badge
                      variant="outline"
                      className="bg-green-50 text-green-700"
                    >
                      {CURRENCIES[detailsProduct.currency].symbol}{" "}
                      {CURRENCIES[detailsProduct.currency].name}
                    </Badge>
                  </div>
                  {detailsProduct.discount > 0 && (
                    <div>
                      <p className="text-sm text-emerald-700">الخصم</p>
                      <Badge variant="secondary" className="text-lg">
                        {formatCurrency(
                          detailsProduct.discount,
                          detailsProduct.currency
                        )}
                      </Badge>
                    </div>
                  )}
                </div>
                {detailsProduct.discount > 0 && (
                  <div className="mt-4 pt-4 border-t border-emerald-200">
                    <p className="text-sm text-emerald-700 mb-1">
                      السعر النهائي بعد الخصم
                    </p>
                    <p className="text-2xl font-bold text-emerald-900">
                      {formatCurrency(
                        detailsProduct.salePrice *
                        (1 - detailsProduct.discount / 100),
                        detailsProduct.currency
                      )}
                    </p>
                  </div>
                )}
              </div>

              {/* Stock Information */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-100">
                <h3 className="font-bold text-purple-900 mb-4">
                  معلومات المخزون
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-purple-700">نوع القياس</p>
                    <Badge
                      variant="outline"
                      className={
                        detailsProduct.measurementType === "quantity"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-purple-50 text-purple-700"
                      }
                    >
                      {detailsProduct.measurementType === "quantity"
                        ? "قطع (عدد)"
                        : `وزن (${getMeasurementUnit(detailsProduct)})`}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-purple-700">الكمية المتوفرة</p>
                    <p className="text-xl font-bold text-purple-900">
                      {formatMeasurement(detailsProduct)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-purple-700">الحد الأدنى</p>
                    <p className="text-lg font-semibold text-purple-900">
                      {detailsProduct.measurementType === "quantity"
                        ? `${detailsProduct.minQuantity} قطعة`
                        : `${detailsProduct.minWeight} ${getMeasurementUnit(
                          detailsProduct
                        )}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-purple-700">حالة المخزون</p>
                    <Badge
                      variant={
                        isOutOfStock(detailsProduct)
                          ? "destructive"
                          : isLowStock(detailsProduct)
                            ? "secondary"
                            : "default"
                      }
                      className={
                        isOutOfStock(detailsProduct)
                          ? "bg-red-100 text-red-700"
                          : isLowStock(detailsProduct)
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-100 text-emerald-700"
                      }
                    >
                      {isOutOfStock(detailsProduct)
                        ? "نفد المخزون"
                        : isLowStock(detailsProduct)
                          ? "مخزون منخفض"
                          : "متوفر"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              {detailsProduct.barcode && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">الباركود</p>
                  <p className="font-mono text-lg font-semibold text-gray-800">
                    {detailsProduct.barcode}
                  </p>
                </div>
              )}

              {/* Action Button */}
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsDetailsModalOpen(false)}
                >
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

      {/* Shopping Cart Components */}
      <FloatingCartButton />
      <CartPanel />
      <CartCheckoutDialog />
    </div>
  );
}

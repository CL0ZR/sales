"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Package,
  Search,
  Plus,
  Edit,
  Trash2,
  Filter,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Scan,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useCurrency } from "@/context/CurrencyContext";
import { useAuth } from "@/context/AuthContext";
import { useAlert } from "@/context/AlertContext";
import {
  Product,
  Category,
  CURRENCIES,
  MeasurementType,
  WeightUnit,
  WEIGHT_UNITS,
  Currency,
} from "@/types";
import {
  formatMeasurement,
  getMeasurementUnit,
  isLowStock,
  isOutOfStock,
  getStockStatus,
  getInputStep,
} from "@/utils/measurement";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Warehouse() {
  const {
    state,
    addProduct,
    updateProduct,
    deleteProduct,
    addCategory,
    updateCategory,
    deleteCategory,
  } = useApp();
  const { products, categories } = state;
  const { formatCurrency, currentCurrency } = useCurrency();
  const { user } = useAuth();
  const { showAlert, showConfirm } = useAlert();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");

  // Barcode input ref for auto-focus
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Category management states
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryFormData, setCategoryFormData] = useState({
    name: "",
    description: "",
    subcategories: [] as Array<{ name: string; description: string }>,
  });

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    subcategory: "",
    wholesalePrice: 0,
    wholesaleCostPrice: 0,
    salePrice: 0,
    discount: 0,
    measurementType: "quantity" as MeasurementType,
    quantity: 0,
    minQuantity: 5,
    weightUnit: "kg" as WeightUnit,
    weight: 0,
    minWeight: 0,
    barcode: "",
    currency: currentCurrency,
  });

  // Validation: Check if wholesale cost price exceeds wholesale price
  const hasPriceError =
    formData.wholesaleCostPrice > 0 &&
    formData.wholesalePrice > 0 &&
    formData.wholesaleCostPrice > formData.wholesalePrice;

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

  // Auto-focus barcode input when modal opens
  useEffect(() => {
    if (isModalOpen && barcodeInputRef.current) {
      // Small delay to ensure modal is fully rendered
      setTimeout(() => {
        barcodeInputRef.current?.focus();
      }, 100);
    }
  }, [isModalOpen]);

  // Access control: Prevent assistant admins and regular users from accessing this page
  if (user?.role === "assistant-admin" || user?.role === "user") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Alert className="max-w-md border-amber-200 bg-amber-50">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <AlertDescription className="text-amber-800 text-lg">
            <p className="font-semibold mb-2">غير مصرح بالدخول</p>
            <p>
              ليس لديك صلاحية الوصول إلى إدارة المستودع. هذه الصفحة متاحة
              للمدراء فقط.
            </p>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent submission if cost price exceeds selling price
    if (hasPriceError) {
      await showAlert(
        "لا يمكن حفظ المنتج! سعر الشراء أعلى من سعر البيع، مما سيؤدي إلى خسارة. الرجاء تصحيح الأسعار.",
        {
          variant: 'destructive',
          title: 'خطأ في الأسعار',
        }
      );
      return;
    }

    if (editingProduct) {
      updateProduct({
        ...editingProduct,
        ...formData,
        updatedAt: new Date(),
      });
    } else {
      addProduct(formData);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "",
      subcategory: "",
      wholesalePrice: 0,
      wholesaleCostPrice: 0,
      salePrice: 0,
      discount: 0,
      measurementType: "quantity",
      quantity: 0,
      minQuantity: 5,
      weightUnit: "kg",
      weight: 0,
      minWeight: 0,
      barcode: "",
      currency: currentCurrency,
    });
    setEditingProduct(null);
    setIsModalOpen(false);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      category: product.category,
      subcategory: product.subcategory || "",
      wholesalePrice: product.wholesalePrice,
      wholesaleCostPrice: product.wholesaleCostPrice || 0,
      salePrice: product.salePrice,
      discount: product.discount,
      measurementType: product.measurementType,
      quantity: product.quantity,
      minQuantity: product.minQuantity,
      weightUnit: product.weightUnit || "kg",
      weight: product.weight || 0,
      minWeight: product.minWeight || 0,
      barcode: product.barcode || "",
      currency: product.currency,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await showConfirm("هل أنت متأكد من حذف هذا المنتج؟", {
      variant: 'destructive',
      confirmText: 'نعم، احذف',
      cancelText: 'إلغاء',
    });

    if (confirmed) {
      try {
        await deleteProduct(id);
      } catch (error) {
        await showAlert(
          error instanceof Error ? error.message : "فشل حذف المنتج",
          {
            variant: 'destructive',
            title: 'خطأ',
          }
        );
      }
    }
  };

  // Category management functions
  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Filter out subcategories with empty names
    const validSubcategories = categoryFormData.subcategories
      .filter((sub) => sub.name && sub.name.trim() !== "")
      .map((sub, index) => ({
        id: `${Date.now()}-${index}`,
        name: sub.name.trim(),
        description: sub.description.trim(),
        categoryId: editingCategory?.id || Date.now().toString(),
      }));

    const categoryData = {
      name: categoryFormData.name,
      description: categoryFormData.description,
      subcategories: validSubcategories,
    };

    if (editingCategory) {
      updateCategory({
        ...editingCategory,
        ...categoryData,
      });
    } else {
      addCategory(categoryData);
    }

    resetCategoryForm();
  };

  const resetCategoryForm = () => {
    setCategoryFormData({
      name: "",
      description: "",
      subcategories: [],
    });
    setEditingCategory(null);
    setIsCategoryModalOpen(false);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryFormData({
      name: category.name,
      description: category.description || "",
      subcategories: category.subcategories.map((sub) => ({
        name: sub.name,
        description: sub.description || "",
      })),
    });
    setIsCategoryModalOpen(true);
  };

  const handleDeleteCategory = async (id: string) => {
    const confirmed = await showConfirm(
      "هل أنت متأكد من حذف هذه الفئة؟ سيتم حذف جميع الفئات الفرعية أيضاً.",
      {
        variant: 'destructive',
        confirmText: 'نعم، احذف',
        cancelText: 'إلغاء',
      }
    );

    if (confirmed) {
      deleteCategory(id);
    }
  };

  const addSubcategory = () => {
    setCategoryFormData({
      ...categoryFormData,
      subcategories: [
        ...categoryFormData.subcategories,
        { name: "", description: "" },
      ],
    });
  };

  const removeSubcategory = (index: number) => {
    setCategoryFormData({
      ...categoryFormData,
      subcategories: categoryFormData.subcategories.filter(
        (_, i) => i !== index
      ),
    });
  };

  const updateSubcategory = (
    index: number,
    field: "name" | "description",
    value: string
  ) => {
    const updated = [...categoryFormData.subcategories];
    updated[index][field] = value;
    setCategoryFormData({
      ...categoryFormData,
      subcategories: updated,
    });
  };

  // Currency formatting is now handled by useCurrency hook

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            المستودع
          </h1>
          <p className="text-gray-600">إدارة المنتجات والفئات والمخزون</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="categories">الفئات</TabsTrigger>
          <TabsTrigger value="products">المنتجات</TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-6">
          <div className="flex justify-start">
            <Dialog
              open={isModalOpen}
              onOpenChange={(open) => {
                if (!open) {
                  resetForm();
                } else {
                  setIsModalOpen(open);
                }
              }}
            >
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  إضافة منتج جديد
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingProduct ? "تعديل المنتج" : "إضافة منتج جديد"}
                  </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">اسم المنتج *</Label>
                      <Input
                        id="name"
                        required
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="barcode"
                        className="flex items-center gap-2"
                      >
                        الباركود
                        <Scan className="h-4 w-4 text-blue-500" />
                      </Label>
                      <Input
                        ref={barcodeInputRef}
                        id="barcode"
                        value={formData.barcode}
                        onChange={(e) =>
                          setFormData({ ...formData, barcode: e.target.value })
                        }
                        onFocus={(e) => e.target.select()}
                        placeholder="امسح الباركود أو أدخله يدوياً"
                        className="font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">الوصف</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>الفئة *</Label>
                      <Select
                        required
                        value={formData.category || "placeholder"}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            category: value === "placeholder" ? "" : value,
                            subcategory: "",
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الفئة" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="placeholder" disabled>
                            اختر الفئة
                          </SelectItem>
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
                        value={formData.subcategory || "none"}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            subcategory: value === "none" ? "" : value,
                          })
                        }
                        disabled={!formData.category}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الفئة الفرعية" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">
                            لا توجد فئة فرعية
                          </SelectItem>
                          {categories
                            .find((c) => c.name === formData.category)
                            ?.subcategories.filter(
                              (sub) => sub.name && sub.name.trim() !== ""
                            )
                            .map((sub) => (
                              <SelectItem key={sub.id} value={sub.name}>
                                {sub.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>العملة *</Label>
                      <Select
                        value={formData.currency}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            currency: value as Currency,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر العملة" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(CURRENCIES).map((currency) => (
                            <SelectItem
                              key={currency.code}
                              value={currency.code}
                            >
                              <div className="flex items-center gap-2">
                                <span>{currency.symbol}</span>
                                <span>{currency.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="wholesaleCostPrice">
                          سعر جملة (الجملة)
                        </Label>
                        <Input
                          id="wholesaleCostPrice"
                          type="number"
                          min="0"
                          step={formData.currency === "IQD" ? "1" : "0.01"}
                          value={
                            formData.wholesaleCostPrice === 0
                              ? ""
                              : formData.wholesaleCostPrice
                          }
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              wholesaleCostPrice:
                                e.target.value === ""
                                  ? 0
                                  : parseFloat(e.target.value) || 0,
                            })
                          }
                          placeholder="0"
                          className={
                            hasPriceError
                              ? "border-red-500 focus-visible:ring-red-500"
                              : ""
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="wholesalePrice">
                          سعر الجملة *
                        </Label>
                        <Input
                          id="wholesalePrice"
                          type="number"
                          required
                          min="0"
                          step={formData.currency === "IQD" ? "1" : "0.01"}
                          value={
                            formData.wholesalePrice === 0
                              ? ""
                              : formData.wholesalePrice
                          }
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              wholesalePrice:
                                e.target.value === ""
                                  ? 0
                                  : parseFloat(e.target.value) || 0,
                            })
                          }
                          className={
                            hasPriceError
                              ? "border-red-500 focus-visible:ring-red-500"
                              : ""
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="salePrice">سعر البيع *</Label>
                        <Input
                          id="salePrice"
                          type="number"
                          required
                          min="0"
                          step={formData.currency === "IQD" ? "1" : "0.01"}
                          value={
                            formData.salePrice === 0 ? "" : formData.salePrice
                          }
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              salePrice:
                                e.target.value === ""
                                  ? 0
                                  : parseFloat(e.target.value) || 0,
                            })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="discount">الخصم</Label>
                        <Input
                          id="discount"
                          type="number"
                          min="0"
                          step={formData.currency === "IQD" ? "1" : "0.01"}
                          value={formData.discount === 0 ? "" : formData.discount}
                          onChange={(e) => {
                            const discountValue =
                              e.target.value === ""
                                ? 0
                                : parseFloat(e.target.value) || 0;
                            // Ensure discount doesn't exceed sale price
                            const maxDiscount = formData.salePrice || 0;
                            setFormData({
                              ...formData,
                              discount: Math.min(discountValue, maxDiscount),
                            });
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Measurement Type Selection */}
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                    <div className="space-y-2">
                      <Label className="text-base font-semibold">
                        نوع القياس *
                      </Label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="measurementType"
                            value="quantity"
                            checked={formData.measurementType === "quantity"}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                measurementType: "quantity",
                              })
                            }
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="text-sm font-medium">
                            بالقطع (عدد)
                          </span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="measurementType"
                            value="weight"
                            checked={formData.measurementType === "weight"}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                measurementType: "weight",
                              })
                            }
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="text-sm font-medium">بالوزن</span>
                        </label>
                      </div>
                    </div>

                    {formData.measurementType === "quantity" ? (
                      // Quantity-based inputs
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="quantity">
                            الكمية المتوفرة (قطعة) *
                          </Label>
                          <Input
                            id="quantity"
                            type="number"
                            required
                            min="0"
                            step="1"
                            value={
                              formData.quantity === 0 ? "" : formData.quantity
                            }
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                quantity:
                                  e.target.value === ""
                                    ? 0
                                    : parseInt(e.target.value) || 0,
                              })
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="minQuantity">
                            الحد الأدنى للكمية *
                          </Label>
                          <Input
                            id="minQuantity"
                            type="number"
                            required
                            min="0"
                            step="1"
                            value={formData.minQuantity}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                minQuantity: parseInt(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                      </div>
                    ) : (
                      // Weight-based inputs
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>الوحدة *</Label>
                          <Select
                            value={formData.weightUnit}
                            onValueChange={(value) =>
                              setFormData({
                                ...formData,
                                weightUnit: value as WeightUnit,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.values(WEIGHT_UNITS).map((unit) => (
                                <SelectItem key={unit.unit} value={unit.unit!}>
                                  {unit.nameAr} ({unit.symbol})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="weight">
                              الوزن المتوفر (
                              {WEIGHT_UNITS[formData.weightUnit].symbol}) *
                            </Label>
                            <Input
                              id="weight"
                              type="number"
                              required
                              min="0"
                              step={getInputStep("weight", formData.weightUnit)}
                              value={
                                formData.weight === 0 ? "" : formData.weight
                              }
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  weight:
                                    e.target.value === ""
                                      ? 0
                                      : parseFloat(e.target.value) || 0,
                                })
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="minWeight">
                              الحد الأدنى للوزن (
                              {WEIGHT_UNITS[formData.weightUnit].symbol}) *
                            </Label>
                            <Input
                              id="minWeight"
                              type="number"
                              required
                              min="0"
                              step={getInputStep("weight", formData.weightUnit)}
                              value={
                                formData.minWeight === 0
                                  ? ""
                                  : formData.minWeight
                              }
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  minWeight:
                                    e.target.value === ""
                                      ? 0
                                      : parseFloat(e.target.value) || 0,
                                })
                              }
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-start gap-4 pt-6">
                    <Button
                      type="submit"
                      disabled={hasPriceError}
                      className={
                        hasPriceError ? "opacity-50 cursor-not-allowed" : ""
                      }
                    >
                      {hasPriceError ? (
                        <span className="flex items-center gap-2">
                          <XCircle className="h-4 w-4" />
                          خطأ في الأسعار
                        </span>
                      ) : editingProduct ? (
                        "حفظ التعديلات"
                      ) : (
                        "إضافة المنتج"
                      )}
                    </Button>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      إلغاء
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Filters */}
          <Card dir="rtl">
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
                      {selectedCategory &&
                        categories
                          .find((cat) => cat.name === selectedCategory)
                          ?.subcategories.filter(
                            (subcategory) =>
                              subcategory.name && subcategory.name.trim() !== ""
                          )
                          .map((subcategory) => (
                            <SelectItem
                              key={subcategory.id}
                              value={subcategory.name}
                            >
                              {subcategory.name}
                            </SelectItem>
                          ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Products Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                قائمة المنتجات ({filteredProducts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border" dir="rtl">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">ت</TableHead>
                      <TableHead className="text-right">المنتج</TableHead>
                      <TableHead className="text-right">الفئة</TableHead>
                      <TableHead className="text-right">نوع القياس</TableHead>
                      <TableHead className="text-right">
                        سعر الجملة الجملة
                      </TableHead>
                      <TableHead className="text-right">سعر البيع</TableHead>
                      <TableHead className="text-right">العملة</TableHead>
                      <TableHead className="text-right">المتوفر</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product, index) => {
                      const stockStatus = getStockStatus(product);
                      return (
                        <TableRow key={product.id}>
                          <TableCell className="text-right font-medium">
                            {index + 1}
                          </TableCell>
                          <TableCell className="text-right">
                            <div>
                              <p className="font-medium">{product.name}</p>
                              {product.barcode && (
                                <p className="text-xs text-muted-foreground">
                                  الباركود: {product.barcode}
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
                                product.measurementType === "quantity"
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : "bg-purple-50 text-purple-700 border-purple-200"
                              }
                            >
                              {product.measurementType === "quantity"
                                ? "قطع"
                                : `وزن (${getMeasurementUnit(product)})`}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div>
                              {product.wholesaleCostPrice &&
                                product.wholesaleCostPrice > 0 && (
                                  <p className="text-sm">
                                    {formatCurrency(
                                      product.wholesaleCostPrice,
                                      product.currency
                                    )}
                                  </p>
                                )}
                              <p className="text-xs text-gray-500">
                                سعر الجملة:{" "}
                                {formatCurrency(
                                  product.wholesalePrice,
                                  product.currency
                                )}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(
                              product.salePrice,
                              product.currency
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge
                              variant="outline"
                              className="bg-green-50 text-green-700 border-green-200"
                            >
                              {CURRENCIES[product.currency].symbol}{" "}
                              {CURRENCIES[product.currency].name}
                            </Badge>
                          </TableCell>

                          <TableCell className="text-right">
                            <Badge
                              variant={
                                isLowStock(product) ? "destructive" : "default"
                              }
                            >
                              {formatMeasurement(product)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge
                              variant={
                                isOutOfStock(product)
                                  ? "destructive"
                                  : isLowStock(product)
                                  ? "secondary"
                                  : "default"
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
                            <div className="flex items-center gap-2 justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(product)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(product.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                {filteredProducts.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>لا توجد منتجات</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-6">
          <div className="flex justify-start">
            <Dialog
              open={isCategoryModalOpen}
              onOpenChange={setIsCategoryModalOpen}
            >
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  إضافة فئة جديدة
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingCategory ? "تعديل الفئة" : "إضافة فئة جديدة"}
                  </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleCategorySubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="categoryName">اسم الفئة *</Label>
                    <Input
                      id="categoryName"
                      required
                      value={categoryFormData.name}
                      onChange={(e) =>
                        setCategoryFormData({
                          ...categoryFormData,
                          name: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="categoryDescription">الوصف</Label>
                    <Textarea
                      id="categoryDescription"
                      value={categoryFormData.description}
                      onChange={(e) =>
                        setCategoryFormData({
                          ...categoryFormData,
                          description: e.target.value,
                        })
                      }
                      rows={3}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <Label className="text-base font-medium">
                        الفئات الفرعية
                      </Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addSubcategory}
                        className="flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4 ml-2" />
                        إضافة فئة فرعية
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {categoryFormData.subcategories.map((sub, index) => (
                        <div
                          key={index}
                          className="bg-gray-50 p-4 rounded-lg border"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-medium text-gray-700">
                              فئة فرعية {index + 1}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeSubcategory(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Input
                              placeholder="اسم الفئة الفرعية (أو اتركه فارغاً لتجاهله)"
                              value={sub.name}
                              onChange={(e) =>
                                updateSubcategory(index, "name", e.target.value)
                              }
                            />
                            <Input
                              placeholder="الوصف (اختياري)"
                              value={sub.description}
                              onChange={(e) =>
                                updateSubcategory(
                                  index,
                                  "description",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-start gap-4 pt-6">
                    <Button type="submit">
                      {editingCategory ? "حفظ التعديلات" : "إضافة الفئة"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetCategoryForm}
                    >
                      إلغاء
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <Card
                key={category.id}
                className="hover:shadow-lg transition-all duration-200 border-0 bg-gradient-to-br from-white to-gray-50/50"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg text-gray-800">
                        {category.name}
                      </CardTitle>
                      {category.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {category.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditCategory(category)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCategory(category.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        الفئات الفرعية ({category.subcategories.length})
                      </p>
                      {category.subcategories.length > 0 ? (
                        <div className="space-y-2">
                          {category.subcategories.map((sub) => (
                            <div
                              key={sub.id}
                              className="bg-blue-50 border border-blue-100 p-2 rounded-lg"
                            >
                              <p className="text-sm font-medium text-blue-800">
                                {sub.name}
                              </p>
                              {sub.description && (
                                <p className="text-xs text-blue-600">
                                  {sub.description}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">
                          لا توجد فئات فرعية
                        </p>
                      )}
                    </div>

                    {/* <div className="pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">المنتجات:</span>
                        <Badge
                          variant="secondary"
                          className="bg-emerald-100 text-emerald-700"
                        >
                          {
                            products.filter((p) => p.category === category.name)
                              .length
                          }
                        </Badge>
                      </div>
                    </div> */}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {categories.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  لا توجد فئات بعد
                </h3>
                <p className="text-gray-600 mb-4">
                  ابدأ بإضافة فئة جديدة لتنظيم منتجاتك
                </p>
                <Button onClick={() => setIsCategoryModalOpen(true)}>
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة فئة جديدة
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

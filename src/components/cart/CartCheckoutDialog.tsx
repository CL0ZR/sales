'use client';

import React, { useState } from 'react';
import { CheckCircle, DollarSign, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCart } from '@/context/CartContext';
import { useApp } from '@/context/AppContext';
import { useCurrency } from '@/context/CurrencyContext';
import { toast } from 'sonner';
import { SaleType } from '@/types';
import { generateTransactionId, validateAllStock } from '@/utils/cart';

interface CheckoutFormData {
  saleType: SaleType;
  paymentMethod: 'cash' | 'debt';
  debtCustomerId: string;
  customerName: string;
}

export function CartCheckoutDialog() {
  const { items, totalAmount, isCheckoutOpen, closeCheckout, clearCart } = useCart();
  const { state, refreshData } = useApp();
  const { formatCurrency, currentCurrency: currency } = useCurrency();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<CheckoutFormData>({
    saleType: 'retail',
    paymentMethod: 'cash',
    debtCustomerId: '',
    customerName: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate stock before checkout
    const stockValidation = validateAllStock(items);
    if (!stockValidation.valid) {
      toast.error(stockValidation.error || 'خطأ في التحقق من المخزون');
      return;
    }

    // Validate debt customer selection
    if (formData.paymentMethod === 'debt' && !formData.debtCustomerId) {
      toast.error('يرجى اختيار العميل للدفع الآجل');
      return;
    }

    setIsSubmitting(true);

    try {
      const transactionId = generateTransactionId();

      // Prepare cart items for checkout
      const checkoutData = {
        items: items.map(item => {
          // Use the correct price based on selected sale type
          const unitPrice = formData.saleType === 'retail'
            ? item.product.salePrice
            : item.product.wholesalePrice;

          return {
            productId: item.product.id,
            quantity: item.quantity,
            weight: item.weight,
            unitPrice: unitPrice,
            discount: item.discount,
            saleType: formData.saleType,
          };
        }),
        transactionId,
        paymentMethod: formData.paymentMethod,
        debtCustomerId: formData.debtCustomerId,
        customerName: formData.customerName,
        currency,
      };

      // Send to API
      const response = await fetch('/api/cart/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(checkoutData),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Checkout API error:', result);
        const errorMsg = result.details || result.error || 'فشل تنفيذ عملية البيع';
        throw new Error(errorMsg);
      }

      // Success
      toast.success(`تم إتمام البيع بنجاح! تم بيع ${items.length} منتج`);

      // Clear cart and close dialogs
      clearCart();
      closeCheckout();

      // Reset form
      setFormData({
        saleType: 'retail',
        paymentMethod: 'cash',
        debtCustomerId: '',
        customerName: '',
      });

      // Refresh data to reflect changes
      await refreshData();
    } catch (error) {
      console.error('Checkout error:', error);
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء معالجة عملية البيع';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      closeCheckout();
    }
  };

  // Calculate item total based on selected sale type
  const calculateItemTotal = (item: typeof items[0]) => {
    const unitPrice = formData.saleType === 'retail'
      ? item.product.salePrice
      : item.product.wholesalePrice;
    const amount = item.product.measurementType === 'quantity' ? item.quantity : (item.weight || 0);
    return (unitPrice * amount) - item.discount;
  };

  // Calculate cart total based on selected sale type
  const calculateCartTotal = () => {
    return items.reduce((total, item) => total + calculateItemTotal(item), 0);
  };

  return (
    <Dialog open={isCheckoutOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <CheckCircle className="h-6 w-6 text-green-600" />
            إتمام عملية البيع
          </DialogTitle>
          <DialogDescription>
            اختر نوع البيع وطريقة الدفع لإتمام العملية
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Cart Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3">ملخص السلة</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center text-sm bg-white p-2 rounded"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">#{index + 1}</span>
                    <span className="font-medium">{item.product.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-600">
                      {item.product.measurementType === 'quantity'
                        ? `${item.quantity} قطعة`
                        : `${item.weight} ${item.product.weightUnit === 'kg' ? 'كغ' : 'غ'}`}
                    </span>
                    <span className="text-gray-400">|</span>
                    <span className="font-semibold text-blue-600">
                      {formatCurrency(calculateItemTotal(item), currency)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t flex justify-between items-center">
              <span className="font-bold text-gray-800">الإجمالي الكلي:</span>
              <span className="text-2xl font-bold text-green-600">
                {formatCurrency(calculateCartTotal(), currency)}
              </span>
            </div>
          </div>

          {/* Sale Type Selection */}
          <div className="space-y-2">
            <Label>نوع البيع *</Label>
            <Select
              required
              value={formData.saleType}
              onValueChange={(value) =>
                setFormData({ ...formData, saleType: value as SaleType })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="retail">🛒 بيع تجزئة</SelectItem>
                <SelectItem value="wholesale">📦 بيع جملة</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-2">
            <Label>طريقة الدفع *</Label>
            <Select
              required
              value={formData.paymentMethod}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  paymentMethod: value as 'cash' | 'debt',
                  debtCustomerId: value === 'cash' ? '' : formData.debtCustomerId,
                  customerName: value === 'cash' ? '' : formData.customerName,
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

          {/* Customer Selection for Debt Payment */}
          {formData.paymentMethod === 'debt' && (
            <div className="space-y-2">
              <Label>اختر العميل *</Label>
              <Select
                required
                value={formData.debtCustomerId}
                onValueChange={(value) => {
                  const selectedCustomer = state.debtCustomers.find(
                    (c) => c.id === value
                  );
                  setFormData({
                    ...formData,
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

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              {isSubmitting ? 'جاري المعالجة...' : 'تأكيد البيع'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

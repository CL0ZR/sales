'use client';

import React, { useState } from 'react';
import { X, Trash2, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useCart } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useAlert } from '@/context/AlertContext';
import { CartItem } from '@/types';

export function CartPanel() {
  const {
    items,
    itemCount,
    totalAmount,
    isOpen,
    closeCart,
    removeItem,
    updateItemQuantity,
    updateItemDiscount,
    clearCart,
    openCheckout,
    getItemTotal,
  } = useCart();
  const { formatCurrency, currentCurrency: currency } = useCurrency();
  const { showConfirm } = useAlert();

  if (!isOpen) {
    return null;
  }

  const handleCheckout = () => {
    if (items.length === 0) return;
    openCheckout();
  };

  const handleClearCart = async () => {
    const confirmed = await showConfirm(
      'هل أنت متأكد من حذف جميع المنتجات من السلة؟',
      {
        variant: 'warning',
        confirmText: 'نعم، احذف الكل',
        cancelText: 'إلغاء',
      }
    );
    if (confirmed) {
      clearCart();
      closeCart();
    }
  };

  return (
    <>
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={closeCart}
            className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          />

          {/* Panel */}
          <div
            className="fixed top-0 left-0 h-full w-full md:w-[500px] bg-white shadow-2xl z-50 flex flex-col transition-transform"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-blue-100">
              <h2 className="text-xl font-bold text-gray-800">سلة التسوق ({itemCount})</h2>
              <Button variant="ghost" size="icon" onClick={closeCart}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <p className="text-lg">السلة فارغة</p>
                  <p className="text-sm">أضف منتجات لبدء البيع</p>
                </div>
              ) : (
                items.map(item => <CartItemCard key={item.id} item={item} />)
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t bg-gray-50 p-4 space-y-3">
                {/* Total */}
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>الإجمالي:</span>
                  <span className="text-blue-600">
                    {formatCurrency(totalAmount, currency)}
                  </span>
                </div>

                {/* Buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleClearCart}
                    variant="outline"
                    className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 ml-2" />
                    إفراغ السلة
                  </Button>
                  <Button
                    onClick={handleCheckout}
                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                  >
                    الدفع
                  </Button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}

function CartItemCard({ item }: { item: CartItem }) {
  const { removeItem, updateItemQuantity, updateItemDiscount, getItemTotal } = useCart();
  const { formatCurrency, currentCurrency: currency } = useCurrency();
  const { showAlert } = useAlert();
  const [discount, setDiscount] = useState(item.discount);

  const handleQuantityChange = async (delta: number) => {
    const newQuantity = Math.max(1, item.quantity + delta);

    // Check stock
    if (item.product.measurementType === 'quantity') {
      if (newQuantity > item.product.quantity) {
        await showAlert('المخزون غير كافي', {
          variant: 'warning',
          title: 'تحذير',
        });
        return;
      }
    }

    updateItemQuantity(item.id, newQuantity, item.weight);
  };

  const handleWeightChange = async (value: string) => {
    const newWeight = parseFloat(value) || 0;

    // Check stock
    if (item.product.measurementType === 'weight') {
      if (newWeight > (item.product.weight || 0)) {
        await showAlert('المخزون غير كافي', {
          variant: 'warning',
          title: 'تحذير',
        });
        return;
      }
    }

    updateItemQuantity(item.id, item.quantity, newWeight);
  };

  const handleDiscountChange = (value: string) => {
    const newDiscount = parseFloat(value) || 0;
    setDiscount(newDiscount);
    updateItemDiscount(item.id, newDiscount);
  };

  const isQuantityBased = item.product.measurementType === 'quantity';
  const itemTotal = getItemTotal(item);

  return (
    <Card className="p-3 hover:shadow-md transition-shadow">
      <div className="flex gap-3">
        {/* Product Image */}
        {item.product.imageUrl && (
          <img
            src={item.product.imageUrl}
            alt={item.product.name}
            className="w-16 h-16 object-cover rounded"
          />
        )}

        {/* Product Details */}
        <div className="flex-1 space-y-2">
          {/* Name and Remove Button */}
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-gray-800">{item.product.name}</h3>
              <p className="text-xs text-gray-500">
                {item.saleType === 'retail' ? 'تجزئة' : 'جملة'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeItem(item.id)}
              className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Quantity/Weight Controls */}
          <div className="flex items-center gap-2">
            {isQuantityBased ? (
              <>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-7 w-7"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={item.quantity <= 1}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="min-w-[40px] text-center font-semibold">
                  {item.quantity}
                </span>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-7 w-7"
                  onClick={() => handleQuantityChange(1)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
                <span className="text-sm text-gray-600">قطعة</span>
              </>
            ) : (
              <>
                <Input
                  type="number"
                  value={item.weight || 0}
                  onChange={(e) => handleWeightChange(e.target.value)}
                  className="w-24 h-7 text-sm"
                  min="0"
                  step="0.1"
                />
                <span className="text-sm text-gray-600">
                  {item.product.weightUnit === 'kg' ? 'كغ' : 'غ'}
                </span>
              </>
            )}
          </div>

          {/* Price and Discount */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">
              السعر: {formatCurrency(item.unitPrice, currency)}
            </span>
            <span className="text-gray-400">|</span>
            <div className="flex items-center gap-1">
              <span className="text-gray-600">خصم:</span>
              <Input
                type="number"
                value={discount}
                onChange={(e) => handleDiscountChange(e.target.value)}
                className="w-20 h-6 text-xs"
                min="0"
              />
            </div>
          </div>

          {/* Item Total */}
          <div className="flex justify-between items-center pt-1 border-t">
            <span className="text-sm text-gray-600">المجموع:</span>
            <span className="font-bold text-blue-600">
              {formatCurrency(itemTotal, currency)}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

'use client';

import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';

export function FloatingCartButton() {
  const { itemCount, toggleCart, isOpen } = useCart();

  // Only show button when there are items in cart
  if (itemCount === 0) {
    return null;
  }

  return (
    <div className="fixed top-20 left-4 z-40">
      <Button
        onClick={toggleCart}
        size="lg"
        className={`relative rounded-full h-14 w-14 shadow-lg hover:shadow-xl transition-all ${
          isOpen
            ? 'bg-primary/80 hover:bg-primary'
            : 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
        }`}
      >
        <ShoppingCart className="h-6 w-6 text-white" />
        {itemCount > 0 && (
          <span className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center shadow-md">
            {itemCount > 99 ? '99+' : itemCount}
          </span>
        )}
      </Button>
    </div>
  );
}

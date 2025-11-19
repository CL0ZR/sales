'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { CartItem, Product, SaleType } from '@/types';
import {
  calculateCartTotal,
  calculateItemTotal,
  getCartItemCount,
  loadCartFromStorage,
  saveCartToStorage,
  clearCartStorage,
  createCartItem,
  validateCartItem,
  generateCartItemId,
} from '@/utils/cart';

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  isCheckoutOpen: boolean;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_ITEM_QUANTITY'; payload: { id: string; quantity: number; weight?: number } }
  | { type: 'UPDATE_ITEM_DISCOUNT'; payload: { id: string; discount: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: CartItem[] }
  | { type: 'TOGGLE_CART' }
  | { type: 'OPEN_CART' }
  | { type: 'CLOSE_CART' }
  | { type: 'OPEN_CHECKOUT' }
  | { type: 'CLOSE_CHECKOUT' };

const initialState: CartState = {
  items: [],
  isOpen: false,
  isCheckoutOpen: false,
};

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM':
      // Check if product already exists in cart
      const existingItemIndex = state.items.findIndex(
        item => item.product.id === action.payload.product.id && item.saleType === action.payload.saleType
      );

      let newItems: CartItem[];
      if (existingItemIndex !== -1) {
        // Product exists, update quantity/weight
        newItems = state.items.map((item, index) => {
          if (index === existingItemIndex) {
            if (item.product.measurementType === 'quantity') {
              return { ...item, quantity: item.quantity + action.payload.quantity };
            } else {
              return { ...item, weight: (item.weight || 0) + (action.payload.weight || 0) };
            }
          }
          return item;
        });
      } else {
        // Product doesn't exist, add as new item
        newItems = [...state.items, action.payload];
      }

      saveCartToStorage(newItems);
      return { ...state, items: newItems };

    case 'REMOVE_ITEM':
      const filteredItems = state.items.filter(item => item.id !== action.payload);
      saveCartToStorage(filteredItems);
      return { ...state, items: filteredItems };

    case 'UPDATE_ITEM_QUANTITY':
      const updatedQuantityItems = state.items.map(item =>
        item.id === action.payload.id
          ? { ...item, quantity: action.payload.quantity, weight: action.payload.weight }
          : item
      );
      saveCartToStorage(updatedQuantityItems);
      return { ...state, items: updatedQuantityItems };

    case 'UPDATE_ITEM_DISCOUNT':
      const updatedDiscountItems = state.items.map(item =>
        item.id === action.payload.id
          ? { ...item, discount: action.payload.discount }
          : item
      );
      saveCartToStorage(updatedDiscountItems);
      return { ...state, items: updatedDiscountItems };

    case 'CLEAR_CART':
      clearCartStorage();
      return { ...state, items: [] };

    case 'LOAD_CART':
      return { ...state, items: action.payload };

    case 'TOGGLE_CART':
      return { ...state, isOpen: !state.isOpen };

    case 'OPEN_CART':
      return { ...state, isOpen: true };

    case 'CLOSE_CART':
      return { ...state, isOpen: false };

    case 'OPEN_CHECKOUT':
      return { ...state, isCheckoutOpen: true, isOpen: false };

    case 'CLOSE_CHECKOUT':
      return { ...state, isCheckoutOpen: false };

    default:
      return state;
  }
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  totalAmount: number;
  isOpen: boolean;
  isCheckoutOpen: boolean;
  addItem: (product: Product, saleType: SaleType, quantity?: number, weight?: number, discount?: number) => void;
  removeItem: (id: string) => void;
  updateItemQuantity: (id: string, quantity: number, weight?: number) => void;
  updateItemDiscount: (id: string, discount: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  openCheckout: () => void;
  closeCheckout: () => void;
  getItemTotal: (item: CartItem) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Load cart from sessionStorage on mount
  useEffect(() => {
    const savedCart = loadCartFromStorage();
    if (savedCart.length > 0) {
      dispatch({ type: 'LOAD_CART', payload: savedCart });
    }
  }, []);

  const addItem = (
    product: Product,
    saleType: SaleType,
    quantity: number = 1,
    weight?: number,
    discount: number = 0
  ) => {
    const newItem = createCartItem(product, saleType, quantity, weight, discount);
    const validation = validateCartItem(newItem);

    if (!validation.valid) {
      throw new Error(validation.error);
    }

    dispatch({ type: 'ADD_ITEM', payload: newItem });
  };

  const removeItem = (id: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id });
  };

  const updateItemQuantity = (id: string, quantity: number, weight?: number) => {
    dispatch({ type: 'UPDATE_ITEM_QUANTITY', payload: { id, quantity, weight } });
  };

  const updateItemDiscount = (id: string, discount: number) => {
    dispatch({ type: 'UPDATE_ITEM_DISCOUNT', payload: { id, discount } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const toggleCart = () => {
    dispatch({ type: 'TOGGLE_CART' });
  };

  const openCart = () => {
    dispatch({ type: 'OPEN_CART' });
  };

  const closeCart = () => {
    dispatch({ type: 'CLOSE_CART' });
  };

  const openCheckout = () => {
    dispatch({ type: 'OPEN_CHECKOUT' });
  };

  const closeCheckout = () => {
    dispatch({ type: 'CLOSE_CHECKOUT' });
  };

  const getItemTotal = (item: CartItem) => {
    return calculateItemTotal(item);
  };

  const value: CartContextType = {
    items: state.items,
    itemCount: getCartItemCount(state.items),
    totalAmount: calculateCartTotal(state.items),
    isOpen: state.isOpen,
    isCheckoutOpen: state.isCheckoutOpen,
    addItem,
    removeItem,
    updateItemQuantity,
    updateItemDiscount,
    clearCart,
    toggleCart,
    openCart,
    closeCart,
    openCheckout,
    closeCheckout,
    getItemTotal,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

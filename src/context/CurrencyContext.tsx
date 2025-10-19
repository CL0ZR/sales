'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Currency, CURRENCIES, CurrencyInfo } from '@/types';

interface CurrencyContextType {
  currentCurrency: Currency;
  setCurrency: (currency: Currency) => void;
  formatCurrency: (amount: number, currency?: Currency) => string;
  getCurrencyInfo: (currency: Currency) => CurrencyInfo;
  convertPrice: (amount: number, fromCurrency: Currency, toCurrency: Currency) => number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// Exchange rates (you can make this dynamic later)
const EXCHANGE_RATES: Record<Currency, Record<Currency, number>> = {
  IQD: {
    IQD: 1,
    USD: 0.00068, // 1 IQD = 0.00068 USD (approximate)
  },
  USD: {
    USD: 1,
    IQD: 1470, // 1 USD = 1470 IQD (approximate)
  },
};

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currentCurrency, setCurrentCurrency] = useState<Currency>('IQD');

  // Load saved currency from localStorage
  useEffect(() => {
    const savedCurrency = localStorage.getItem('warehouse_currency') as Currency;
    if (savedCurrency && CURRENCIES[savedCurrency]) {
      setCurrentCurrency(savedCurrency);
    }
  }, []);

  // Save currency to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('warehouse_currency', currentCurrency);
  }, [currentCurrency]);

  const setCurrency = (currency: Currency) => {
    setCurrentCurrency(currency);
  };

  const formatCurrency = (amount: number, currency: Currency = currentCurrency): string => {
    const currencyInfo = CURRENCIES[currency];
    
    try {
      return new Intl.NumberFormat(currencyInfo.locale, {
        style: 'currency',
        currency: currencyInfo.code,
        minimumFractionDigits: currency === 'IQD' ? 0 : 2,
        maximumFractionDigits: currency === 'IQD' ? 0 : 2,
      }).format(amount);
    } catch (error) {
      // Fallback formatting if Intl doesn't support the currency
      const symbol = currencyInfo.symbol;
      const formattedAmount = currency === 'IQD' 
        ? Math.round(amount).toLocaleString('ar-IQ')
        : amount.toFixed(2);
      
      return currency === 'USD' 
        ? `${symbol}${formattedAmount}`
        : `${formattedAmount} ${symbol}`;
    }
  };

  const getCurrencyInfo = (currency: Currency): CurrencyInfo => {
    return CURRENCIES[currency];
  };

  const convertPrice = (amount: number, fromCurrency: Currency, toCurrency: Currency): number => {
    if (fromCurrency === toCurrency) return amount;
    
    const rate = EXCHANGE_RATES[fromCurrency][toCurrency];
    return amount * rate;
  };

  const contextValue: CurrencyContextType = {
    currentCurrency,
    setCurrency,
    formatCurrency,
    getCurrencyInfo,
    convertPrice,
  };

  return (
    <CurrencyContext.Provider value={contextValue}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}

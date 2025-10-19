'use client';

import React from 'react';
import { DollarSign, Coins } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';
import { Currency, CURRENCIES } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function CurrencySelector() {
  const { currentCurrency, setCurrency, getCurrencyInfo } = useCurrency();
  const currentInfo = getCurrencyInfo(currentCurrency);

  const handleCurrencyChange = (currency: string) => {
    setCurrency(currency as Currency);
  };

  const getCurrencyIcon = (currency: Currency) => {
    switch (currency) {
      case 'USD':
        return <DollarSign className="h-4 w-4" />;
      case 'IQD':
        return <Coins className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  return (
    <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-green-800">
          {getCurrencyIcon(currentCurrency)}
          العملة الحالية
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-green-700">
              العملة المختارة:
            </Label>
            <Badge className="bg-green-500 text-white">
              {currentInfo.symbol} {currentInfo.name}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="currency-select" className="text-sm font-medium text-green-700">
              تغيير العملة:
            </Label>
            <Select value={currentCurrency} onValueChange={handleCurrencyChange}>
              <SelectTrigger id="currency-select" className="bg-white border-green-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(CURRENCIES).map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    <div className="flex items-center gap-2">
                      {getCurrencyIcon(currency.code)}
                      <span>{currency.name}</span>
                      <Badge variant="outline" className="ml-auto">
                        {currency.symbol}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="text-xs text-green-600 bg-green-100 p-3 rounded-lg space-y-2">
            <p className="font-medium">أسعار الصرف التقريبية:</p>
            <div className="space-y-1">
              <p>1 دولار = 1,470 دينار عراقي</p>
              <p>1 دينار عراقي = 0.00068 دولار</p>
            </div>
            <p className="text-xs opacity-75">* الأسعار تقريبية وقابلة للتغيير</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

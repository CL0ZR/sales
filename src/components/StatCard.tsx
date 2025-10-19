'use client';

import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'primary' | 'success' | 'warning' | 'destructive';
}

export default function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  color = 'primary' 
}: StatCardProps) {
  const colorClasses = {
    primary: 'bg-blue-500 text-white shadow-blue-500/20',
    success: 'bg-emerald-500 text-white shadow-emerald-500/20',
    warning: 'bg-amber-500 text-white shadow-amber-500/20',
    destructive: 'bg-red-500 text-white shadow-red-500/20',
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-0 bg-gradient-to-br from-white to-gray-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <div className={`w-12 h-12 rounded-xl ${colorClasses[color]} flex items-center justify-center shadow-lg`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {trend && (
            <div className="flex items-center gap-2">
              {trend.isPositive ? (
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <Badge 
                variant={trend.isPositive ? "default" : "destructive"}
                className={`text-xs font-medium ${
                  trend.isPositive 
                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' 
                    : 'bg-red-100 text-red-700 hover:bg-red-100'
                }`}
              >
                {Math.abs(trend.value)}%
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

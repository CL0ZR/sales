'use client';

import React from 'react';
import { Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface ReportFiltersProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
}

/**
 * مكون تصفية التقارير حسب نطاق التاريخ
 */
export default function ReportFilters({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: ReportFiltersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          فترة التقرير
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start-date">من تاريخ</Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              max={endDate || undefined}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="end-date">إلى تاريخ</Label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              min={startDate || undefined}
            />
          </div>
        </div>

        <div className="mt-3 text-sm text-muted-foreground">
          {startDate && endDate && (
            <p>
              عرض البيانات من {new Date(startDate).toLocaleDateString('ar-EG')} إلى{' '}
              {new Date(endDate).toLocaleDateString('ar-EG')}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

'use client';

import React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface TableSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}

/**
 * مكون البحث في الجداول
 * يتضمن حقل إدخال مع أيقونة بحث وزر لمسح النص
 */
export default function TableSearch({
  value,
  onChange,
  placeholder = 'ابحث...',
  label = 'البحث',
  className = '',
}: TableSearchProps) {
  const handleClear = () => {
    onChange('');
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label htmlFor="table-search" className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          {label}
        </Label>
      )}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          id="table-search"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pr-10 pl-10"
        />
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute left-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 hover:bg-secondary"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">مسح البحث</span>
          </Button>
        )}
      </div>
      {value && (
        <p className="text-xs text-muted-foreground">
          جاري البحث عن: <span className="font-medium">{value}</span>
        </p>
      )}
    </div>
  );
}

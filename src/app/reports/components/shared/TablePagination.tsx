'use client';

import React from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getPageNumbers } from '@/hooks/usePagination';

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  onPageChange: (page: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  className?: string;
}

/**
 * مكون التقسيم إلى صفحات للجداول
 * يعرض معلومات الصفحة الحالية وأزرار التنقل بين الصفحات
 */
export default function TablePagination({
  currentPage,
  totalPages,
  totalItems,
  startIndex,
  endIndex,
  onPageChange,
  onNext,
  onPrevious,
  canGoNext,
  canGoPrevious,
  className = '',
}: TablePaginationProps) {
  const pageNumbers = getPageNumbers(currentPage, totalPages);

  if (totalItems === 0) {
    return null;
  }

  return (
    <div className={`flex items-center justify-between border-t pt-4 ${className}`}>
      {/* عرض معلومات الصفحة */}
      <div className="text-sm text-muted-foreground">
        عرض <span className="font-medium text-foreground">{startIndex}</span> -{' '}
        <span className="font-medium text-foreground">{endIndex}</span> من{' '}
        <span className="font-medium text-foreground">{totalItems}</span> سجل
      </div>

      {/* أزرار التنقل */}
      <div className="flex items-center gap-1">
        {/* زر السابق */}
        <Button
          variant="outline"
          size="sm"
          onClick={onPrevious}
          disabled={!canGoPrevious}
          className="flex items-center gap-1"
        >
          <ChevronRight className="h-4 w-4" />
          السابق
        </Button>

        {/* أرقام الصفحات */}
        <div className="hidden sm:flex items-center gap-1">
          {pageNumbers.map((pageNum, index) => {
            if (pageNum === '...') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-2 text-muted-foreground"
                >
                  ...
                </span>
              );
            }

            const isActive = pageNum === currentPage;

            return (
              <Button
                key={pageNum}
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                onClick={() => onPageChange(pageNum as number)}
                className={`min-w-[2.5rem] ${
                  isActive
                    ? 'bg-primary text-white hover:bg-primary/90'
                    : 'hover:bg-secondary'
                }`}
              >
                {pageNum}
              </Button>
            );
          })}
        </div>

        {/* عرض رقم الصفحة على الأجهزة الصغيرة */}
        <div className="sm:hidden px-3 text-sm text-muted-foreground">
          صفحة {currentPage} من {totalPages}
        </div>

        {/* زر التالي */}
        <Button
          variant="outline"
          size="sm"
          onClick={onNext}
          disabled={!canGoNext}
          className="flex items-center gap-1"
        >
          التالي
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

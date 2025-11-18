import { useMemo, useState, useEffect } from 'react';

interface UsePaginationProps<T> {
  data: T[];
  itemsPerPage?: number;
}

interface UsePaginationReturn<T> {
  currentPage: number;
  totalPages: number;
  paginatedData: T[];
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  startIndex: number;
  endIndex: number;
  totalItems: number;
}

/**
 * Hook لإدارة التقسيم إلى صفحات (Pagination)
 *
 * @param data - البيانات المراد تقسيمها
 * @param itemsPerPage - عدد العناصر في كل صفحة (الافتراضي: 50)
 * @returns كائن يحتوي على حالة التقسيم ووظائف التحكم
 */
export function usePagination<T>({
  data,
  itemsPerPage = 50,
}: UsePaginationProps<T>): UsePaginationReturn<T> {
  const [currentPage, setCurrentPage] = useState(1);

  // حساب إجمالي عدد الصفحات
  const totalPages = Math.ceil(data.length / itemsPerPage);

  // إعادة تعيين إلى الصفحة الأولى عند تغيير البيانات
  useEffect(() => {
    setCurrentPage(1);
  }, [data.length]);

  // التأكد من أن الصفحة الحالية ضمن النطاق الصحيح
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // حساب البيانات المعروضة في الصفحة الحالية
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  }, [data, currentPage, itemsPerPage]);

  // حساب مؤشرات البداية والنهاية للعرض
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, data.length);

  // وظائف التنقل
  const goToPage = (page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const previousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // حالات التمكين/التعطيل
  const canGoNext = currentPage < totalPages;
  const canGoPrevious = currentPage > 1;

  return {
    currentPage,
    totalPages,
    paginatedData,
    goToPage,
    nextPage,
    previousPage,
    canGoNext,
    canGoPrevious,
    startIndex,
    endIndex,
    totalItems: data.length,
  };
}

/**
 * دالة مساعدة لحساب أرقام الصفحات المعروضة مع النقاط (...)
 *
 * @param currentPage - الصفحة الحالية
 * @param totalPages - إجمالي عدد الصفحات
 * @param siblingCount - عدد الصفحات على كل جانب من الصفحة الحالية
 * @returns مصفوفة من أرقام الصفحات و "..." للفجوات
 */
export function getPageNumbers(
  currentPage: number,
  totalPages: number,
  siblingCount: number = 1
): (number | string)[] {
  // إذا كان إجمالي الصفحات قليل، اعرضها كلها
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
  const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

  const shouldShowLeftDots = leftSiblingIndex > 2;
  const shouldShowRightDots = rightSiblingIndex < totalPages - 1;

  const pages: (number | string)[] = [];

  // الصفحة الأولى دائماً
  pages.push(1);

  if (shouldShowLeftDots) {
    pages.push('...');
  } else if (leftSiblingIndex === 2) {
    pages.push(2);
  }

  // الصفحات المحيطة بالصفحة الحالية
  for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
    if (i !== 1 && i !== totalPages) {
      pages.push(i);
    }
  }

  if (shouldShowRightDots) {
    pages.push('...');
  } else if (rightSiblingIndex === totalPages - 1) {
    pages.push(totalPages - 1);
  }

  // الصفحة الأخيرة دائماً
  if (totalPages > 1) {
    pages.push(totalPages);
  }

  return pages;
}

'use client';

import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Info, X } from 'lucide-react';

export default function FirstTimeSetupNotice() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if user has dismissed the notice before
    const dismissed = localStorage.getItem('setup_notice_dismissed');
    if (!dismissed) {
      // Check if this is the first time (no products or minimal data)
      fetch('/api/products')
        .then(res => res.json())
        .then(data => {
          if (data.products && data.products.length === 0) {
            setIsVisible(true);
          }
        })
        .catch(() => {
          // Ignore errors
        });
    } else {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('setup_notice_dismissed', 'true');
    setIsVisible(false);
    setIsDismissed(true);
  };

  if (!isVisible || isDismissed) {
    return null;
  }

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-2xl px-4">
      <Alert className="border-blue-200 bg-blue-50 shadow-lg">
        <Info className="h-5 w-5 text-blue-600" />
        <AlertDescription>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="font-semibold text-blue-900 mb-2">
                مرحباً بك في نظام إدارة المستودع!
              </p>
              <p className="text-sm text-blue-700 mb-3">
                يبدو أن هذه هي المرة الأولى التي تستخدم فيها النظام. ابدأ بإضافة الفئات والمنتجات من صفحة المستودع.
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => window.location.href = '/warehouse'}
                >
                  الذهاب إلى المستودع
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDismiss}
                >
                  فهمت، شكراً
                </Button>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}

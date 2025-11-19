'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type AlertVariant = 'default' | 'destructive' | 'warning';

interface AlertOptions {
  title?: string;
  message: string;
  variant?: AlertVariant;
  confirmText?: string;
  cancelText?: string;
}

interface AlertState {
  isOpen: boolean;
  type: 'alert' | 'confirm';
  options: AlertOptions;
  resolver?: (value: boolean) => void;
}

interface AlertContextType {
  showAlert: (message: string, options?: Partial<AlertOptions>) => Promise<void>;
  showConfirm: (message: string, options?: Partial<AlertOptions>) => Promise<boolean>;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AlertState>({
    isOpen: false,
    type: 'alert',
    options: { message: '' },
  });

  const showAlert = (message: string, options: Partial<AlertOptions> = {}): Promise<void> => {
    return new Promise((resolve) => {
      setState({
        isOpen: true,
        type: 'alert',
        options: {
          title: options.title || 'تنبيه',
          message,
          variant: options.variant || 'default',
          confirmText: options.confirmText || 'حسناً',
        },
        resolver: (value: boolean) => {
          resolve();
        },
      });
    });
  };

  const showConfirm = (message: string, options: Partial<AlertOptions> = {}): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        isOpen: true,
        type: 'confirm',
        options: {
          title: options.title || 'تأكيد',
          message,
          variant: options.variant || 'default',
          confirmText: options.confirmText || 'تأكيد',
          cancelText: options.cancelText || 'إلغاء',
        },
        resolver: resolve,
      });
    });
  };

  const handleClose = (confirmed: boolean) => {
    setState((prev) => ({ ...prev, isOpen: false }));
    if (state.resolver) {
      state.resolver(confirmed);
    }
  };

  const getVariantStyles = () => {
    switch (state.options.variant) {
      case 'destructive':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-amber-200 bg-amber-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  const getButtonVariant = () => {
    switch (state.options.variant) {
      case 'destructive':
        return 'destructive';
      default:
        return 'default';
    }
  };

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm }}>
      {children}

      <AlertDialog open={state.isOpen} onOpenChange={() => handleClose(false)}>
        <AlertDialogContent className={`${getVariantStyles()}`} dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">
              {state.options.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right text-base">
              {state.options.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2 sm:gap-2">
            {state.type === 'confirm' && (
              <AlertDialogCancel onClick={() => handleClose(false)}>
                {state.options.cancelText}
              </AlertDialogCancel>
            )}
            <AlertDialogAction
              onClick={() => handleClose(true)}
              className={getButtonVariant() === 'destructive' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              {state.options.confirmText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
}

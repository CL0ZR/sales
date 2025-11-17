'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Navigation from './Navigation';
import LoginForm from './LoginForm';
import FirstTimeSetupNotice from './FirstTimeSetupNotice';
import LottieLoader from './LottieLoader';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Redirect users based on role when they access unauthorized pages
  useEffect(() => {
    if (isAuthenticated && user) {
      // Define allowed paths for each role
      const allowedPaths: Record<string, string[]> = {
        'admin': ['/', '/warehouse', '/products', '/debt-book', '/reports'],
        'assistant-admin': ['/products', '/debt-book', '/reports'],
        'user': ['/products']
      };

      const userAllowedPaths = allowedPaths[user.role] || [];

      // If current path is not allowed for this role, redirect to /products
      if (!userAllowedPaths.includes(pathname)) {
        router.replace('/products');
      }
    }
  }, [isAuthenticated, user, pathname, router]);

  // عرض شاشة تحميل أثناء فحص حالة المصادقة
  if (isLoading) {
    return <LottieLoader />;
  }

  // إذا لم يكن المستخدم مسجل دخول، عرض صفحة تسجيل الدخول
  if (!isAuthenticated) {
    return <LoginForm />;
  }

  // إذا كان مسجل دخول، عرض التطبيق العادي
  return (
    <div className="min-h-screen">
      <FirstTimeSetupNotice />
      <Navigation />
      <main className="lg:mr-64 p-6 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-purple-50/30 pointer-events-none -z-10" />
        {children}
      </main>
    </div>
  );
}

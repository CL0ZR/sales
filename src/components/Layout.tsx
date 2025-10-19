'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import Navigation from './Navigation';
import LoginForm from './LoginForm';
import FirstTimeSetupNotice from './FirstTimeSetupNotice';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { isAuthenticated, isLoading } = useAuth();

  // عرض شاشة تحميل أثناء فحص حالة المصادقة
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">نظام إدارة المستودعات</h2>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
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

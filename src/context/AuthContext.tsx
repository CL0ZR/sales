'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser, UserRole } from '@/types';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  isAdmin: () => boolean;
  isAssistantAdmin: () => boolean;
  isUser: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // تحميل المستخدم من localStorage عند بدء التطبيق
  useEffect(() => {
    const MIN_LOADING_TIME = 8000; // 8 seconds for full Lottie animation
    const startTime = Date.now();

    const loadUser = () => {
      try {
        const savedUser = localStorage.getItem('warehouse_auth_user');
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          setUser(userData);
          setIsAuthenticated(true);

          // Only show 8-second animation if user is logged in
          const elapsedTime = Date.now() - startTime;
          const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsedTime);

          setTimeout(() => {
            setIsLoading(false);
          }, remainingTime);
        } else {
          // No saved user, skip animation and show login form immediately
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error loading saved user:', error);
        localStorage.removeItem('warehouse_auth_user');
        setIsLoading(false);
      }
    };

    // تأخير بسيط لضمان تحميل localStorage
    const timer = setTimeout(loadUser, 100);
    return () => clearTimeout(timer);
  }, []);

  const login = async (username: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      // البحث في قاعدة البيانات للمستخدمين
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();

      if (result.success) {
        // Show loading animation for 8 seconds after successful login
        setIsLoading(true);
        const ANIMATION_DURATION = 8000; // 8 seconds

        setUser(result.user);
        setIsAuthenticated(true);
        localStorage.setItem('warehouse_auth_user', JSON.stringify(result.user));

        // تحديث آخر تسجيل دخول
        await updateLastLogin(result.user.id);

        // Wait for full animation to complete before hiding loading screen
        setTimeout(() => {
          setIsLoading(false);
        }, ANIMATION_DURATION);

        return { success: true, message: result.message || `مرحباً ${result.user.fullName || result.user.username}` };
      }

      return { success: false, message: result.message || 'بيانات تسجيل الدخول غير صحيحة' };

    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'حدث خطأ أثناء تسجيل الدخول' };
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    setIsLoading(false);
    localStorage.removeItem('warehouse_auth_user');
  };

  const isAdmin = (): boolean => {
    return user?.role === 'admin';
  };

  const isAssistantAdmin = (): boolean => {
    return user?.role === 'assistant-admin';
  };

  const isUser = (): boolean => {
    return user?.role === 'user';
  };

  const updateLastLogin = async (userId: string) => {
    try {
      await fetch('/api/auth/update-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  };

  const contextValue: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    isAdmin,
    isAssistantAdmin,
    isUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

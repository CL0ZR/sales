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
  isUser: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // تحميل المستخدم من localStorage عند بدء التطبيق
  useEffect(() => {
    const loadUser = () => {
      try {
        const savedUser = localStorage.getItem('warehouse_auth_user');
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          setUser(userData);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error loading saved user:', error);
        localStorage.removeItem('warehouse_auth_user');
      } finally {
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
        setUser(result.user);
        setIsAuthenticated(true);
        localStorage.setItem('warehouse_auth_user', JSON.stringify(result.user));
        
        // تحديث آخر تسجيل دخول
        await updateLastLogin(result.user.id);
        
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

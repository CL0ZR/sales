'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, User, LogIn, AlertTriangle } from 'lucide-react';

export default function LoginForm() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await login(username, password);

      if (!result.success) {
        setError(result.message);
      }
    } catch (err) {
      setError('حدث خطأ غير متوقع');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-2xl">
          <CardHeader className="space-y-3 pb-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Lock className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              نظام إدارة المستودع
            </CardTitle>
            <CardDescription className="text-center text-base">
              تسجيل الدخول للوصول إلى النظام
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-red-800">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="username" className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  اسم المستخدم
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="أدخل اسم المستخدم"
                  required
                  disabled={isLoading}
                  className="text-lg h-12"
                  autoComplete="username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-gray-500" />
                  كلمة المرور
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور"
                  required
                  disabled={isLoading}
                  className="text-lg h-12"
                  autoComplete="current-password"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    جاري تسجيل الدخول...
                  </>
                ) : (
                  <>
                    <LogIn className="h-5 w-5 mr-2" />
                    تسجيل الدخول
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-sm text-blue-800 text-center font-medium">
                الحساب الافتراضي للمدير
              </p>
              <div className="mt-2 space-y-1 text-xs text-blue-700 text-center">
                <p>اسم المستخدم: <span className="font-mono font-semibold">super</span></p>
                <p>كلمة المرور: <span className="font-mono font-semibold">Moh@9801</span></p>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-gray-600">
          نظام إدارة المستودع والمبيعات © 2025
        </p>
      </div>
    </div>
  );
}

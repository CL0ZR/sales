'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, Key, User, X, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { isFirstTimeSetup, areCredentialsShown, markCredentialsAsShown } from '@/hooks/useAutoSetup';

/**
 * مكوّن الإشعار الذي يظهر لمرة واحدة فقط بعد إنشاء حساب المدير
 */
export default function FirstTimeSetupNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // عرض الإشعار فقط إذا:
    // 1. هذا أول تشغيل للتطبيق
    // 2. لم يتم عرض بيانات الدخول من قبل
    const shouldShow = isFirstTimeSetup() && !areCredentialsShown();
    setVisible(shouldShow);
  }, []);

  const handleClose = () => {
    markCredentialsAsShown();
    setVisible(false);
  };

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl border-2 border-blue-300 shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <CheckCircle className="h-8 w-8" />
            مرحباً! تم تهيئة النظام بنجاح
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <AlertDescription className="text-green-800 text-base">
              تم إنشاء قاعدة البيانات والمجلدات بنجاح في المسار:
              <br />
              <code className="bg-green-100 px-2 py-1 rounded mt-2 inline-block font-mono text-sm">
                D:\MyWarehouseData
              </code>
            </AlertDescription>
          </Alert>

          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300 rounded-lg p-6">
            <h3 className="text-xl font-bold text-amber-900 mb-4 flex items-center gap-2">
              <Key className="h-6 w-6" />
              بيانات تسجيل الدخول للمدير
            </h3>

            <div className="space-y-4 bg-white p-4 rounded-lg border border-amber-200">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-blue-600 mt-1" />
                <div>
                  <p className="text-sm text-gray-600 font-medium">اسم المستخدم:</p>
                  <p className="text-2xl font-bold text-gray-900 font-mono select-all">
                    super
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Key className="h-5 w-5 text-blue-600 mt-1" />
                <div>
                  <p className="text-sm text-gray-600 font-medium">كلمة المرور:</p>
                  <p className="text-2xl font-bold text-gray-900 font-mono select-all">
                    Moh@9801
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <AlertDescription className="text-red-800 text-base">
              <strong>تنبيه أمني:</strong>
              <br />
              يُنصح بشدة بتغيير كلمة المرور بعد أول تسجيل دخول من خلال إعدادات الحساب.
            </AlertDescription>
          </Alert>

          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              💡 ستظهر هذه الرسالة مرة واحدة فقط
            </p>
            <Button
              onClick={handleClose}
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              فهمت، إغلاق
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}



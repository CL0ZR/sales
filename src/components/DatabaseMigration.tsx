'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Database, CheckCircle, Trash2, Package, ShoppingCart, Undo2, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function DatabaseMigration() {
  const [migrating, setMigrating] = useState(false);
  const [migrated, setMigrated] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seeded, setSeeded] = useState(false);
  const [seedingSales, setSeedingSales] = useState(false);
  const [seededSales, setSeededSales] = useState(false);
  const [seedingReturns, setSeedingReturns] = useState(false);
  const [seededReturns, setSeededReturns] = useState(false);
  const [seedingDebtCustomers, setSeedingDebtCustomers] = useState(false);
  const [seededDebtCustomers, setSeededDebtCustomers] = useState(false);

  const runMigration = async () => {
    if (!confirm('هل أنت متأكد من تحديث قاعدة البيانات؟ سيتم تحديث هيكل جدول المستخدمين.')) {
      return;
    }

    setMigrating(true);
    try {
      const response = await fetch('/api/migrate', {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('تم تحديث قاعدة البيانات بنجاح');
        setMigrated(true);

        // Reload after 2 seconds
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        toast.error(result.message || 'فشل تحديث قاعدة البيانات');
      }
    } catch (error) {
      console.error('Migration error:', error);
      toast.error('حدث خطأ أثناء تحديث قاعدة البيانات');
    } finally {
      setMigrating(false);
    }
  };

  const clearDatabase = async () => {
    if (!confirm('⚠️ تحذير: هل أنت متأكد من إفراغ قاعدة البيانات؟\n\nسيتم حذف جميع البيانات التالية:\n• جميع المنتجات\n• جميع الفئات\n• جميع المبيعات\n• جميع الإرجاعات\n\nهذا الإجراء لا يمكن التراجع عنه!')) {
      return;
    }

    // Second confirmation for safety
    if (!confirm('تأكيد نهائي: اكتب "نعم" في المربع التالي للمتابعة\n\nهل تريد حقاً حذف جميع البيانات؟')) {
      return;
    }

    setClearing(true);
    try {
      const response = await fetch('/api/database/clear', {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('تم إفراغ قاعدة البيانات بنجاح');
        setCleared(true);

        // Reload after 2 seconds
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        toast.error(result.message || 'فشل إفراغ قاعدة البيانات');
      }
    } catch (error) {
      console.error('Clear database error:', error);
      toast.error('حدث خطأ أثناء إفراغ قاعدة البيانات');
    } finally {
      setClearing(false);
    }
  };

  const seedDatabase = async () => {
    if (!confirm('هل تريد إضافة بيانات تجريبية؟\n\nسيتم إضافة:\n• 5 فئات مع فئات فرعية\n• 25 منتج متنوع\n• 5 حسابات مستخدمين\n\nملاحظة: يجب أن تكون قاعدة البيانات فارغة أولاً.')) {
      return;
    }

    setSeeding(true);
    try {
      const response = await fetch('/api/seed', {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        setSeeded(true);

        // Reload after 2 seconds
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        toast.error(result.message || 'فشل إضافة البيانات التجريبية');
      }
    } catch (error) {
      console.error('Seed database error:', error);
      toast.error('حدث خطأ أثناء إضافة البيانات التجريبية');
    } finally {
      setSeeding(false);
    }
  };

  const seedSales = async () => {
    if (!confirm('هل تريد إضافة 70 عملية بيع تجريبية؟\n\nسيتم إنشاء مبيعات عشوائية من المنتجات الموجودة في قاعدة البيانات.\n\nملاحظة: يجب أن تحتوي قاعدة البيانات على منتجات أولاً.')) {
      return;
    }

    setSeedingSales(true);
    try {
      const response = await fetch('/api/seed-sales', {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        setSeededSales(true);

        // Reload after 2 seconds
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        toast.error(result.message || 'فشل إضافة المبيعات التجريبية');
      }
    } catch (error) {
      console.error('Seed sales error:', error);
      toast.error('حدث خطأ أثناء إضافة المبيعات التجريبية');
    } finally {
      setSeedingSales(false);
    }
  };

  const seedReturns = async () => {
    if (!confirm('هل تريد إضافة 30 عملية إرجاع تجريبية؟\n\nسيتم إنشاء إرجاعات عشوائية من عمليات البيع الموجودة.\n\nملاحظة: يجب أن يكون هناك على الأقل 30 عملية بيع في قاعدة البيانات.')) {
      return;
    }

    setSeedingReturns(true);
    try {
      const response = await fetch('/api/seed-returns', {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        setSeededReturns(true);

        // Reload after 2 seconds
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        toast.error(result.message || 'فشل إضافة الإرجاعات التجريبية');
      }
    } catch (error) {
      console.error('Seed returns error:', error);
      toast.error('حدث خطأ أثناء إضافة الإرجاعات التجريبية');
    } finally {
      setSeedingReturns(false);
    }
  };

  const seedDebtCustomers = async () => {
    if (!confirm('هل تريد إضافة 40 عميل تجريبي إلى دفتر الديون؟\n\nسيتم إنشاء 40 عميل بأسماء وبيانات مختلفة.\n\nملاحظة: سيتم إضافة العملاء مباشرة إلى دفتر الديون.')) {
      return;
    }

    setSeedingDebtCustomers(true);
    try {
      const response = await fetch('/api/seed-debt-customers', {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        setSeededDebtCustomers(true);

        // Reload after 2 seconds
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        toast.error(result.message || 'فشل إضافة العملاء');
      }
    } catch (error) {
      console.error('Seed debt customers error:', error);
      toast.error('حدث خطأ أثناء إضافة العملاء');
    } finally {
      setSeedingDebtCustomers(false);
    }
  };

  return (
    <Alert className="border-blue-200 bg-blue-50">
      <Database className="h-5 w-5 text-blue-600" />
      <AlertDescription>
        <div className="flex items-center justify-between">
          <div className="flex">
            <p className="font-semibold text-blue-900 mb-1">إدارة قاعدة البيانات</p>
            <p className="text-sm text-blue-700">
              يمكنك تحديث قاعدة البيانات، إفراغها، إضافة منتجات وفئات، مبيعات، إرجاعات، أو عملاء ديون تجريبية
            </p>
          </div>
          <div className="flex gap-2 mr-4 flex-wrap">
            <Button
              onClick={runMigration}
              disabled={migrating || migrated}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {migrating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2" />
                  جاري التحديث...
                </>
              ) : migrated ? (
                <>
                  <CheckCircle className="h-4 w-4 ml-2" />
                  تم التحديث
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 ml-2" />
                  تحديث قاعدة البيانات
                </>
              )}
            </Button>
            <Button
              onClick={seedDatabase}
              disabled={seeding || seeded}
              className="bg-green-600 hover:bg-green-700"
            >
              {seeding ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2" />
                  جاري الإضافة...
                </>
              ) : seeded ? (
                <>
                  <CheckCircle className="h-4 w-4 ml-2" />
                  تمت الإضافة
                </>
              ) : (
                <>
                  <Package className="h-4 w-4 ml-2" />
                  إضافة بيانات تجريبية
                </>
              )}
            </Button>
            <Button
              onClick={seedSales}
              disabled={seedingSales || seededSales}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {seedingSales ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2" />
                  جاري الإضافة...
                </>
              ) : seededSales ? (
                <>
                  <CheckCircle className="h-4 w-4 ml-2" />
                  تمت الإضافة
                </>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4 ml-2" />
                  إضافة 70 مبيعات
                </>
              )}
            </Button>
            <Button
              onClick={seedReturns}
              disabled={seedingReturns || seededReturns}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {seedingReturns ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2" />
                  جاري الإضافة...
                </>
              ) : seededReturns ? (
                <>
                  <CheckCircle className="h-4 w-4 ml-2" />
                  تمت الإضافة
                </>
              ) : (
                <>
                  <Undo2 className="h-4 w-4 ml-2" />
                  إضافة 30 إرجاع
                </>
              )}
            </Button>
            <Button
              onClick={seedDebtCustomers}
              disabled={seedingDebtCustomers || seededDebtCustomers}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {seedingDebtCustomers ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2" />
                  جاري الإضافة...
                </>
              ) : seededDebtCustomers ? (
                <>
                  <CheckCircle className="h-4 w-4 ml-2" />
                  تمت الإضافة
                </>
              ) : (
                <>
                  <Users className="h-4 w-4 ml-2" />
                  إضافة 40 عميل ديون
                </>
              )}
            </Button>
            <Button
              onClick={clearDatabase}
              disabled={clearing || cleared}
              variant="destructive"
              className="bg-red-600 hover:bg-red-700"
            >
              {clearing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2" />
                  جاري الإفراغ...
                </>
              ) : cleared ? (
                <>
                  <CheckCircle className="h-4 w-4 ml-2" />
                  تم الإفراغ
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 ml-2" />
                  إفراغ قاعدة البيانات
                </>
              )}
            </Button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}

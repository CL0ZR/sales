'use client';

import React, { useState, useEffect } from 'react';
import {
  Database,
  FolderOpen,
  Download,
  Copy,
  RefreshCw,
  HardDrive
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { formatGregorianDateTime } from '@/utils/dateFormat';

interface DatabaseInfoData {
  database: {
    path: string;
    size: number;
    lastModified: string;
    tables: {
      products: number;
      categories: number;
      sales: number;
    };
  };
  paths: {
    databasePath: string;
    backupPath: string;
    exportPath: string;
    basePath: string;
  };
}

export default function DatabaseInfo() {
  const [dbInfo, setDbInfo] = useState<DatabaseInfoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const fetchDatabaseInfo = async () => {
    try {
      const response = await fetch('/api/database/info');
      const data = await response.json();
      setDbInfo(data);
    } catch (error) {
      console.error('Error fetching database info:', error);
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async () => {
    setCreating(true);
    try {
      const response = await fetch('/api/database/info', { method: 'POST' });
      const result = await response.json();

      if (result.success) {
        toast.success(result.message, {
          description: `المسار: ${result.backupPath}`,
          duration: 5000,
        });
        fetchDatabaseInfo(); // تحديث المعلومات
      } else {
        toast.error('فشل في إنشاء النسخة الاحتياطية');
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      toast.error('حدث خطأ أثناء إنشاء النسخة الاحتياطية');
    } finally {
      setCreating(false);
    }
  };

  const copyPath = (path: string) => {
    navigator.clipboard.writeText(path);
    toast.success('تم نسخ المسار');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  useEffect(() => {
    fetchDatabaseInfo();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin text-blue-500" />
          <p>جاري تحميل معلومات قاعدة البيانات...</p>
        </CardContent>
      </Card>
    );
  }

  if (!dbInfo) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <Database className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          فشل في تحميل معلومات قاعدة البيانات
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <Database className="h-5 w-5" />
          معلومات قاعدة البيانات
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* مسار قاعدة البيانات */}
        <div className="bg-white p-3 rounded-lg border border-blue-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-700">مسار قاعدة البيانات:</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyPath(dbInfo.database.path)}
              className="text-blue-600"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-600 font-mono bg-gray-50 p-2 rounded break-all">
            {dbInfo.database.path}
          </p>
        </div>

        {/* إحصائيات قاعدة البيانات */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-3 rounded-lg border border-blue-100">
            <p className="text-xs text-blue-600">حجم الملف</p>
            <p className="font-semibold text-blue-800">{formatFileSize(dbInfo.database.size)}</p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-blue-100">
            <p className="text-xs text-blue-600">آخر تعديل</p>
            <p className="font-semibold text-blue-800 text-xs">
              {formatGregorianDateTime(dbInfo.database.lastModified)}
            </p>
          </div>
        </div>

        {/* إحصائيات الجداول */}
        <div className="bg-white p-3 rounded-lg border border-blue-100">
          <p className="text-sm font-medium text-blue-700 mb-2">إحصائيات البيانات:</p>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="bg-green-50 text-green-700">
              منتجات: {dbInfo.database.tables.products}
            </Badge>
            <Badge variant="outline" className="bg-purple-50 text-purple-700">
              فئات: {dbInfo.database.tables.categories}
            </Badge>
            <Badge variant="outline" className="bg-orange-50 text-orange-700">
              مبيعات: {dbInfo.database.tables.sales}
            </Badge>
          </div>
        </div>

        {/* مجلدات النظام */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-blue-700">مجلدات النظام:</p>
          
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between bg-white p-2 rounded border border-blue-100">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-blue-600" />
                <span className="text-gray-700">المجلد الرئيسي:</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyPath(dbInfo.paths.basePath)}
                className="text-blue-600 h-6"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            <p className="text-gray-600 font-mono bg-gray-50 p-1 rounded text-xs break-all">
              {dbInfo.paths.basePath}
            </p>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between bg-white p-2 rounded border border-blue-100">
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-green-600" />
                <span className="text-gray-700">النسخ الاحتياطية:</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyPath(dbInfo.paths.backupPath)}
                className="text-green-600 h-6"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            <p className="text-gray-600 font-mono bg-gray-50 p-1 rounded text-xs break-all">
              {dbInfo.paths.backupPath}
            </p>
          </div>
        </div>

        {/* أزرار الإجراءات */}
        <div className="flex items-center gap-2 pt-2">
          <Button
            onClick={createBackup}
            disabled={creating}
            size="sm"
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            {creating ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {creating ? 'جاري الإنشاء...' : 'نسخة احتياطية'}
          </Button>
          
          <Button
            onClick={fetchDatabaseInfo}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            تحديث
          </Button>
        </div>

        {/* معلومات إضافية */}
        <div className="text-xs text-blue-600 bg-blue-100 p-2 rounded-lg">
          <p className="font-medium">💡 كيفية الوصول للبيانات:</p>
          <ul className="mt-1 space-y-1 text-xs">
            <li>• انسخ مسار قاعدة البيانات أعلاه</li>
            <li>• افتحه ببرنامج &quot;DB Browser for SQLite&quot;</li>
            <li>• أو استخدم أي برنامج SQLite آخر</li>
            <li>• يمكنك أيضاً نسخ الملف لأي مكان آخر</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

import { useState, useEffect } from 'react';

interface DatabaseInfo {
  path: string;
  size: number;
  exists: boolean;
}

/**
 * Hook للحصول على معلومات قاعدة البيانات
 */
export function useDatabase() {
  const [databaseInfo, setDatabaseInfo] = useState<DatabaseInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDatabaseInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/database/info');
      const data = await response.json();

      if (data.success) {
        setDatabaseInfo(data.database);
        setError(null);
      } else {
        setError(data.message || 'فشل في جلب معلومات قاعدة البيانات');
      }
    } catch (err) {
      setError('حدث خطأ أثناء جلب معلومات قاعدة البيانات');
      console.error('Database info error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatabaseInfo();
  }, []);

  return {
    databaseInfo,
    loading,
    error,
    refetch: fetchDatabaseInfo,
  };
}

import { useEffect, useState } from 'react';

/**
 * Hook للتهيئة التلقائية للنظام
 * يتحقق من وجود المستخدم الافتراضي وينشئه إذا لم يكن موجوداً
 */
export function useAutoSetup() {
  const [setupComplete, setSetupComplete] = useState(false);

  useEffect(() => {
    const runAutoSetup = async () => {
      try {
        // Check if setup is needed
        const checkResponse = await fetch('/api/setup');
        const checkResult = await checkResponse.json();

        if (checkResult.needsSetup) {
          console.log('🔧 Running auto-setup...');

          // Run setup
          const setupResponse = await fetch('/api/setup', {
            method: 'POST',
          });

          const setupResult = await setupResponse.json();

          if (setupResult.success) {
            console.log('✅ Auto-setup completed successfully');
            setSetupComplete(true);
          } else {
            console.warn('⚠️ Auto-setup failed:', setupResult.message);
          }
        } else {
          setSetupComplete(true);
        }
      } catch (error) {
        console.error('❌ Auto-setup error:', error);
        // Don't block the app if auto-setup fails
        setSetupComplete(true);
      }
    };

    runAutoSetup();
  }, []);

  return setupComplete;
}

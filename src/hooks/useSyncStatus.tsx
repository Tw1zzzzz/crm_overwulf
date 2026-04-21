import { useState, useEffect } from 'react';
import syncManager from '@/lib/syncManager';

/**
 * Хук для отслеживания статуса синхронизации данных
 * @returns Объект с информацией о статусе синхронизации
 */
export const useSyncStatus = () => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [hasPendingSync, setHasPendingSync] = useState<boolean>(false);

  // Обновляем состояние при изменении статуса синхронизации
  const updateStatus = () => {
    setIsOnline(navigator.onLine);
    setPendingCount(syncManager.getPendingSyncCount());
    setHasPendingSync(syncManager.hasPendingSync());
  };

  useEffect(() => {
    // Первичное обновление
    updateStatus();

    // Подписываемся на изменения в SyncManager
    const unsubscribe = syncManager.subscribe(updateStatus);

    // Подписываемся на события online/offline
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);

    // Отписываемся при размонтировании
    return () => {
      unsubscribe();
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
    };
  }, []);

  // Запускаем синхронизацию вручную
  const startSync = () => {
    if (isOnline) {
      syncManager.startSync();
    }
  };

  return {
    isOnline,
    pendingCount,
    hasPendingSync,
    startSync
  };
};

export default useSyncStatus; 
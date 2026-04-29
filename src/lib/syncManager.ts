import { MoodEntry, TestEntry, BalanceWheel } from "@/types";

/**
 * Typeы операций для sync
 */
type OperationType = 'create' | 'update' | 'delete';
type EntityType = 'mood' | 'test' | 'balanceWheel';

/**
 * Интерфейс для отслеживания операций, которые нужно синхронofировать
 */
interface SyncOperation<T> {
 id: string;
 timestamp: number;
 type: OperationType;
 entityType: EntityType;
 data: T;
 attempts: number;
}

/**
 * Класс для управления синхронofацией данных между сервером и локальным хранилищем
 */
class SyncManager {
 private storageKeyPrefix = 'sync';
 private syncQueueKey = 'syncQueue';
 private isOnline: boolean = navigator.onLine;
 private syncInterval: number | null = null;
 private maxRetries = 3;
 private retryDelay = 5000; // 5 секунд
 private listeners: Set<() => void> = new Set();

 constructor() {
  // Настраиваем слушатели онлайн/оффлайн состояния
  window.addEventListener('online', this.handleOnline);
  window.addEventListener('offline', this.handleOffline);

  // Проверяем очередь sync при запуске
  this.checkSyncQueue();
 }

 /**
  * Добавляет операцию в очередь sync
  */
 public addToSyncQueue<T>(type: OperationType, entityType: EntityType, data: T): string {
  const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const operation: SyncOperation<T> = {
   id,
   timestamp: Date.now(),
   type,
   entityType,
   data,
   attempts: 0
  };

  const queue = this.getSyncQueue();
  queue.push(operation);
  this.saveSyncQueue(queue);

  console.log(`[SyncManager] Operation added to queue: ${entityType} ${type}`, data);
  
  // Пытаемся синхронofировать сразу, если онлайн
  if (this.isOnline) {
   this.startSync();
  }

  this.notifyListeners();
  return id;
 }

 /**
  * Проверяет наличие несинхронofированных данных
  */
 public hasPendingSync(): boolean {
  return this.getSyncQueue().length > 0;
 }

 /**
  * Возвращает количество несинхронofированных операций
  */
 public getPendingSyncCount(): number {
  return this.getSyncQueue().length;
 }

 /**
  * Получает очередь sync of localStorage
  */
 private getSyncQueue(): SyncOperation<any>[] {
  const queueJson = localStorage.getItem(this.getKey(this.syncQueueKey));
  return queueJson ? JSON.parse(queueJson) : [];
 }

 /**
  * Сохраняет очередь sync в localStorage
  */
 private saveSyncQueue(queue: SyncOperation<any>[]): void {
  localStorage.setItem(this.getKey(this.syncQueueKey), JSON.stringify(queue));
 }

 /**
  * Обрабатывает переход в онлайн
  */
 private handleOnline = () => {
  console.log('[SyncManager] Device went online');
  this.isOnline = true;
  this.startSync();
  this.notifyListeners();
 };

 /**
  * Обрабатывает переход в оффлайн
  */
 private handleOffline = () => {
  console.log('[SyncManager] Device went offline');
  this.isOnline = false;
  this.stopSync();
  this.notifyListeners();
 };

 /**
  * Запускает процесс sync
  */
 public startSync(): void {
  // Останавливаем предыдущий интервал, если он был
  this.stopSync();

  // Запускаем синхронofацию сразу
  this.processNextSyncOperation();

  // Запускаем интервал sync
  this.syncInterval = window.setInterval(() => {
   this.processNextSyncOperation();
  }, this.retryDelay);
 }

 /**
  * Останавливает процесс sync
  */
 private stopSync(): void {
  if (this.syncInterval !== null) {
   clearInterval(this.syncInterval);
   this.syncInterval = null;
  }
 }

 /**
  * Обрабатывает следующую операцию of очереди sync
  */
 private async processNextSyncOperation(): Promise<void> {
  if (!this.isOnline) {
   console.log('[SyncManager] Device is offline, sync delayed');
   return;
  }

  const queue = this.getSyncQueue();
  if (queue.length === 0) {
   this.stopSync();
   return;
  }

  // Сортируем операции по времени и берем самую старую
  const sortedQueue = [...queue].sort((a, b) => a.timestamp - b.timestamp);
  const operation = sortedQueue[0];

  if (operation.attempts >= this.maxRetries) {
   console.log(`[SyncManager] Operation retry limit exceeded ${operation.id}`, operation);
   // Удаляем операцию of очереди после максимального числа попыток
   const newQueue = queue.filter(op => op.id !== operation.id);
   this.saveSyncQueue(newQueue);
   this.notifyListeners();
   return;
  }

  try {
   // Обновляем счетчик попыток
   operation.attempts += 1;
   this.saveSyncQueue(queue);

   // Здесь вызываем API для sync данных
   //  будет зависеть от типа операции и сущности
   const success = await this.syncOperation(operation);

   if (success) {
    // Если операция успешна, удаляем ее of очереди
    const newQueue = queue.filter(op => op.id !== operation.id);
    this.saveSyncQueue(newQueue);
    console.log(`[SyncManager] Success synced operation ${operation.id}`);
   } else {
    console.log(`[SyncManager] Failed to sync operation ${operation.id}, попытка ${operation.attempts}`);
   }
  } catch (error) {
   console.error(`[SyncManager] Error while sync операции ${operation.id}:`, error);
  }

  this.notifyListeners();
 }

 /**
  * Синхронofирует операцию с сервером
  */
 private async syncOperation(operation: SyncOperation<any>): Promise<boolean> {
  // Импортируем API-функции динамически, чтобы ofбежать циклических зависимостей
  const api = await import('./api');

  try {
   switch (operation.entityType) {
    case 'mood':
     switch (operation.type) {
      case 'create':
       await api.createMoodEntry(operation.data);
       break;
      case 'delete':
       // Проверка на валидность ID перед удалением
       if (!operation.data || !operation.data.id || 
         operation.data.id === 'undefined' || 
         operation.data.id === 'null') {
        console.error(`[SyncManager] Attempted to delete mood entry with invalid ID:`, operation.data);
        return true; // Считаем успешной, чтобы убрать of очереди
       }
       await api.deleteMoodEntry(operation.data.id);
       break;
      // Тут можно добавить update, если нужно
     }
     break;
    case 'test':
     switch (operation.type) {
      case 'create':
       await api.createTestEntry(operation.data);
       break;
      case 'delete':
       // Проверка на валидность ID перед удалением
       if (!operation.data || !operation.data.id || 
         operation.data.id === 'undefined' || 
         operation.data.id === 'null') {
        console.error(`[SyncManager] Attempted to delete test entry with invalid ID:`, operation.data);
        return true; // Считаем успешной, чтобы убрать of очереди
       }
       await api.deleteTestEntry(operation.data.id);
       break;
     }
     break;
    case 'balanceWheel':
     if (operation.type === 'create') {
      await api.saveBalanceWheel(operation.data);
     }
     break;
   }
   return true;
  } catch (error) {
   console.error(`[SyncManager] Error while выполнении операции ${operation.entityType} ${operation.type}:`, error);
   return false;
  }
 }

 /**
  * Проверяет очередь sync и запускает синхронofацию, если нужно
  */
 private checkSyncQueue(): void {
  const queue = this.getSyncQueue();
  if (queue.length > 0 && this.isOnline) {
   console.log(`[SyncManager] Found ${queue.length} unsynced operations. Starting sync...`);
   this.startSync();
  }
 }

 /**
  * Генерирует ключ для localStorage с учетом user
  */
 private getKey(key: string): string {
  const userToken = localStorage.getItem('token');
  return userToken ? `${this.storageKeyPrefix}-${key}-${userToken}` : `${this.storageKeyPrefix}-${key}`;
 }

 /**
  * Подписывает слушателя на changes статуса sync
  */
 public subscribe(listener: () => void): () => void {
  this.listeners.add(listener);
  return () => {
   this.listeners.delete(listener);
  };
 }

 /**
  * Оповещает слушателей об changesх
  */
 private notifyListeners(): void {
  this.listeners.forEach(listener => {
   try {
    listener();
   } catch (e) {
    console.error('[SyncManager] Error in listener:', e);
   }
  });
 }

 /**
  * Очищает все данные sync
  */
 public clear(): void {
  localStorage.removeItem(this.getKey(this.syncQueueKey));
  this.notifyListeners();
 }
}

// Создаем единственный экземпляр SyncManager
const syncManager = new SyncManager();
export default syncManager; 
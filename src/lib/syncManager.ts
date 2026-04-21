import { MoodEntry, TestEntry, BalanceWheel } from "@/types";

/**
 * Типы операций для синхронизации
 */
type OperationType = 'create' | 'update' | 'delete';
type EntityType = 'mood' | 'test' | 'balanceWheel';

/**
 * Интерфейс для отслеживания операций, которые нужно синхронизировать
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
 * Класс для управления синхронизацией данных между сервером и локальным хранилищем
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

    // Проверяем очередь синхронизации при запуске
    this.checkSyncQueue();
  }

  /**
   * Добавляет операцию в очередь синхронизации
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

    console.log(`[SyncManager] Добавлена операция в очередь: ${entityType} ${type}`, data);
    
    // Пытаемся синхронизировать сразу, если онлайн
    if (this.isOnline) {
      this.startSync();
    }

    this.notifyListeners();
    return id;
  }

  /**
   * Проверяет наличие несинхронизированных данных
   */
  public hasPendingSync(): boolean {
    return this.getSyncQueue().length > 0;
  }

  /**
   * Возвращает количество несинхронизированных операций
   */
  public getPendingSyncCount(): number {
    return this.getSyncQueue().length;
  }

  /**
   * Получает очередь синхронизации из localStorage
   */
  private getSyncQueue(): SyncOperation<any>[] {
    const queueJson = localStorage.getItem(this.getKey(this.syncQueueKey));
    return queueJson ? JSON.parse(queueJson) : [];
  }

  /**
   * Сохраняет очередь синхронизации в localStorage
   */
  private saveSyncQueue(queue: SyncOperation<any>[]): void {
    localStorage.setItem(this.getKey(this.syncQueueKey), JSON.stringify(queue));
  }

  /**
   * Обрабатывает переход в онлайн
   */
  private handleOnline = () => {
    console.log('[SyncManager] Устройство перешло в онлайн');
    this.isOnline = true;
    this.startSync();
    this.notifyListeners();
  };

  /**
   * Обрабатывает переход в оффлайн
   */
  private handleOffline = () => {
    console.log('[SyncManager] Устройство перешло в оффлайн');
    this.isOnline = false;
    this.stopSync();
    this.notifyListeners();
  };

  /**
   * Запускает процесс синхронизации
   */
  public startSync(): void {
    // Останавливаем предыдущий интервал, если он был
    this.stopSync();

    // Запускаем синхронизацию сразу
    this.processNextSyncOperation();

    // Запускаем интервал синхронизации
    this.syncInterval = window.setInterval(() => {
      this.processNextSyncOperation();
    }, this.retryDelay);
  }

  /**
   * Останавливает процесс синхронизации
   */
  private stopSync(): void {
    if (this.syncInterval !== null) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Обрабатывает следующую операцию из очереди синхронизации
   */
  private async processNextSyncOperation(): Promise<void> {
    if (!this.isOnline) {
      console.log('[SyncManager] Устройство оффлайн, синхронизация отложена');
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
      console.log(`[SyncManager] Превышено количество попыток для операции ${operation.id}`, operation);
      // Удаляем операцию из очереди после максимального числа попыток
      const newQueue = queue.filter(op => op.id !== operation.id);
      this.saveSyncQueue(newQueue);
      this.notifyListeners();
      return;
    }

    try {
      // Обновляем счетчик попыток
      operation.attempts += 1;
      this.saveSyncQueue(queue);

      // Здесь вызываем API для синхронизации данных
      // Реализация будет зависеть от типа операции и сущности
      const success = await this.syncOperation(operation);

      if (success) {
        // Если операция успешна, удаляем ее из очереди
        const newQueue = queue.filter(op => op.id !== operation.id);
        this.saveSyncQueue(newQueue);
        console.log(`[SyncManager] Успешно синхронизирована операция ${operation.id}`);
      } else {
        console.log(`[SyncManager] Не удалось синхронизировать операцию ${operation.id}, попытка ${operation.attempts}`);
      }
    } catch (error) {
      console.error(`[SyncManager] Ошибка при синхронизации операции ${operation.id}:`, error);
    }

    this.notifyListeners();
  }

  /**
   * Синхронизирует операцию с сервером
   */
  private async syncOperation(operation: SyncOperation<any>): Promise<boolean> {
    // Импортируем API-функции динамически, чтобы избежать циклических зависимостей
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
                console.error(`[SyncManager] Попытка удалить запись настроения с невалидным ID:`, operation.data);
                return true; // Считаем успешной, чтобы убрать из очереди
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
                console.error(`[SyncManager] Попытка удалить запись теста с невалидным ID:`, operation.data);
                return true; // Считаем успешной, чтобы убрать из очереди
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
      console.error(`[SyncManager] Ошибка при выполнении операции ${operation.entityType} ${operation.type}:`, error);
      return false;
    }
  }

  /**
   * Проверяет очередь синхронизации и запускает синхронизацию, если нужно
   */
  private checkSyncQueue(): void {
    const queue = this.getSyncQueue();
    if (queue.length > 0 && this.isOnline) {
      console.log(`[SyncManager] Найдено ${queue.length} несинхронизированных операций. Запуск синхронизации...`);
      this.startSync();
    }
  }

  /**
   * Генерирует ключ для localStorage с учетом пользователя
   */
  private getKey(key: string): string {
    const userToken = localStorage.getItem('token');
    return userToken ? `${this.storageKeyPrefix}-${key}-${userToken}` : `${this.storageKeyPrefix}-${key}`;
  }

  /**
   * Подписывает слушателя на изменения статуса синхронизации
   */
  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Оповещает слушателей об изменениях
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener();
      } catch (e) {
        console.error('[SyncManager] Ошибка в слушателе:', e);
      }
    });
  }

  /**
   * Очищает все данные синхронизации
   */
  public clear(): void {
    localStorage.removeItem(this.getKey(this.syncQueueKey));
    this.notifyListeners();
  }
}

// Создаем единственный экземпляр SyncManager
const syncManager = new SyncManager();
export default syncManager; 
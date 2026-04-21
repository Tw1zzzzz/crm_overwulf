import { MoodEntry, TestEntry, BalanceWheel } from "@/types";
import syncManager from "./syncManager";

/**
 * Абстрактный класс для работы с данными
 */
abstract class DataRepository<T> {
  protected storageKeyPrefix: string;
  protected entityType: 'mood' | 'test' | 'balanceWheel';

  constructor(storageKeyPrefix: string, entityType: 'mood' | 'test' | 'balanceWheel') {
    this.storageKeyPrefix = storageKeyPrefix;
    this.entityType = entityType;
  }

  /**
   * Генерирует ключ для localStorage с учетом пользователя
   */
  protected getStorageKey(): string {
    const userToken = localStorage.getItem('token');
    return userToken ? `${this.storageKeyPrefix}-${userToken}` : this.storageKeyPrefix;
  }

  /**
   * Сохраняет элементы в localStorage
   */
  protected saveToStorage(items: T[]): void {
    localStorage.setItem(this.getStorageKey(), JSON.stringify(items));
  }

  /**
   * Получает элементы из localStorage
   */
  protected getFromStorage(): T[] {
    const json = localStorage.getItem(this.getStorageKey());
    return json ? JSON.parse(json) : [];
  }

  /**
   * Добавляет новый элемент и сохраняет его локально и в очередь синхронизации
   */
  public create(item: Omit<T, 'id'>): T {
    // Создаем элемент с ID
    const newItem = {
      ...item,
      id: Date.now().toString(),
    } as T;

    // Сохраняем локально
    const items = this.getFromStorage();
    this.saveToStorage([...items, newItem]);

    // Добавляем в очередь синхронизации
    syncManager.addToSyncQueue('create', this.entityType, newItem);

    return newItem;
  }

  /**
   * Получает все элементы из хранилища
   */
  public getAll(): T[] {
    return this.getFromStorage();
  }

  /**
   * Получает элемент по ID
   */
  public getById(id: string): T | undefined {
    const items = this.getFromStorage();
    return items.find(item => (item as any).id === id);
  }

  /**
   * Удаляет элемент из хранилища и добавляет операцию в очередь синхронизации
   */
  public delete(id: string): void {
    // Проверка на валидность ID
    if (!id || id === 'undefined' || id === 'null') {
      console.error(`[DataRepository] Попытка удалить элемент с невалидным ID: ${id}`);
      return;
    }
    
    const items = this.getFromStorage();
    const itemToDelete = items.find(item => (item as any).id === id);
    
    if (itemToDelete) {
      // Сохраняем локально без удаленного элемента
      this.saveToStorage(items.filter(item => (item as any).id !== id));
      
      // Добавляем в очередь синхронизации
      syncManager.addToSyncQueue('delete', this.entityType, itemToDelete);
    } else {
      console.warn(`[DataRepository] Элемент с ID ${id} не найден для удаления`);
    }
  }

  /**
   * Обновляет хранилище новыми данными от сервера
   */
  public updateFromServer(newItems: T[]): void {
    this.saveToStorage(newItems);
  }

  /**
   * Очищает все данные из хранилища
   */
  public clear(): void {
    this.saveToStorage([]);
  }
}

/**
 * Репозиторий для работы с записями настроения
 */
export class MoodRepository extends DataRepository<MoodEntry> {
  constructor() {
    super('mood-entries', 'mood');
  }

  /**
   * Преобразует даты из строк в объекты Date при получении из хранилища
   */
  public override getAll(): MoodEntry[] {
    return this.getFromStorage().map(entry => ({
      ...entry,
      date: new Date(entry.date)
    }));
  }
}

/**
 * Репозиторий для работы с записями тестов
 */
export class TestRepository extends DataRepository<TestEntry> {
  constructor() {
    super('test-entries', 'test');
  }

  /**
   * Преобразует даты из строк в объекты Date при получении из хранилища
   */
  public override getAll(): TestEntry[] {
    return this.getFromStorage().map(entry => ({
      ...entry,
      date: new Date(entry.date)
    }));
  }
}

/**
 * Репозиторий для работы с колесами баланса
 */
export class BalanceWheelRepository extends DataRepository<BalanceWheel> {
  constructor() {
    super('balance-wheel-entries', 'balanceWheel');
  }

  /**
   * Преобразует даты из строк в объекты Date при получении из хранилища
   */
  public override getAll(): BalanceWheel[] {
    return this.getFromStorage().map(entry => ({
      ...entry,
      date: new Date(entry.date)
    }));
  }
}

// Создаем и экспортируем репозитории
export const moodRepository = new MoodRepository();
export const testRepository = new TestRepository();
export const balanceWheelRepository = new BalanceWheelRepository(); 
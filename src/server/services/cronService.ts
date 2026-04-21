import cron from 'node-cron';

/**
 * Сервис для управления cron-задачами
 */
class CronService {
  private tasks: Map<string, cron.ScheduledTask>;

  constructor() {
    this.tasks = new Map();
  }

  /**
   * Добавляет новую задачу в планировщик
   * @param name - Уникальное имя задачи
   * @param schedule - Cron-выражение для расписания (например, '* * * * *' для каждой минуты)
   * @param task - Функция, которая будет выполняться по расписанию
   * @param options - Дополнительные параметры для задачи
   * @returns true, если задача успешно добавлена
   */
  addTask(
    name: string,
    schedule: string,
    task: () => void,
    options: cron.ScheduleOptions = {}
  ): boolean {
    try {
      if (this.tasks.has(name)) {
        console.warn(`Задача с именем "${name}" уже существует и будет перезаписана`);
        this.removeTask(name);
      }

      const cronTask = cron.schedule(schedule, task, options);
      this.tasks.set(name, cronTask);
      console.log(`Задача "${name}" успешно добавлена в расписание: ${schedule}`);
      return true;
    } catch (error) {
      console.error(`Ошибка при добавлении задачи "${name}":`, error);
      return false;
    }
  }

  /**
   * Удаляет задачу из планировщика
   * @param name - Имя задачи для удаления
   * @returns true, если задача успешно удалена
   */
  removeTask(name: string): boolean {
    const task = this.tasks.get(name);
    if (task) {
      task.stop();
      this.tasks.delete(name);
      console.log(`Задача "${name}" успешно удалена из расписания`);
      return true;
    }
    return false;
  }

  /**
   * Останавливает выполнение задачи (без удаления из списка)
   * @param name - Имя задачи для остановки
   * @returns true, если задача успешно остановлена
   */
  stopTask(name: string): boolean {
    const task = this.tasks.get(name);
    if (task) {
      task.stop();
      console.log(`Задача "${name}" остановлена`);
      return true;
    }
    return false;
  }

  /**
   * Возобновляет выполнение остановленной задачи
   * @param name - Имя задачи для возобновления
   * @returns true, если задача успешно возобновлена
   */
  startTask(name: string): boolean {
    const task = this.tasks.get(name);
    if (task) {
      task.start();
      console.log(`Задача "${name}" запущена`);
      return true;
    }
    return false;
  }

  /**
   * Получает список всех зарегистрированных задач
   * @returns Массив имён задач
   */
  getTasks(): string[] {
    return Array.from(this.tasks.keys());
  }

  /**
   * Останавливает все задачи
   */
  stopAllTasks(): void {
    this.tasks.forEach((task, name) => {
      task.stop();
      console.log(`Задача "${name}" остановлена`);
    });
  }
}

// Создаем и экспортируем единственный экземпляр сервиса
const cronService = new CronService();

export default cronService; 
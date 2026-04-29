/**
 * Утилиты для работы с imagesми
 */
import { buildApiUrl } from '@/lib/runtimeConfig';

/**
 * Генерирует URL images с защитой от кеширования
 * @param path Путь к ofображению
 * @param size Размер images для оптимofации
 * @returns URL с параметрами против кеширования
 */
export function getImageUrl(path: string | undefined, size: string = ''): string | undefined {
 if (!path) return undefined;
 
 // Обеспечиваем правильный формат пути и обрабатываем возможные ошибки в путях
 let normalizedPath = path;
 
 // Проверяем, если путь уже содержит полный URL
 if (normalizedPath.startsWith('http')) {
  return normalizedPath;
 }
 
 // Добавляем слеш в начало, если его нет
 if (!normalizedPath.startsWith('/')) {
  normalizedPath = `/${normalizedPath}`;
 }
 
 // Проверяем, содержит ли путь уже '/uploads/'
 const hasUploadsPrefix = normalizedPath.startsWith('/uploads/');
 
 // Добавляем параметры против кеширования
 const timestamp = new Date().getTime();
 const sizeParam = size ? `&size=${size}` : '';
 
 // Если путь уже содержит '/uploads/', не добавляем его еще раз
 if (hasUploadsPrefix) {
  return buildApiUrl(`${normalizedPath}?v=${timestamp}${sizeParam}`);
 } else {
  return buildApiUrl(`/uploads${normalizedPath}?v=${timestamp}${sizeParam}`);
 }
}

/**
 * Создает URL аватара для пользователя
 * @param avatarPath Путь к аватару пользователя
 * @returns URL с настройками против кеширования
 */
export function getUserAvatarUrl(avatarPath: string | undefined): string | undefined {
 if (!avatarPath) return undefined;
 
 // Преобразуем путь к аватару, чтобы он был корректным
 const path = avatarPath.startsWith('avatars/') ? avatarPath : `avatars/${avatarPath}`; 
 return getImageUrl(path);
} 

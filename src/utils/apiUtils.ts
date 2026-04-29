import axios from "axios";
import { getApiBaseUrl } from "@/lib/runtimeConfig";

// Задаем базовый URL для API
const baseUrl = getApiBaseUrl();

/**
 * Универсальная функция для обработки ошибок API
 * @param error - Объект ошибки от axios
 * @param defaultMessage - Сообщение по умолчанию, если ошибка не имеет стандартного формата
 * @returns Сообщение об ошибке в читаемом формате
 */
export const handleApiError = (error: any, defaultMessage: string): string => {
 console.error('[API] Error:', error);
 
 if (!error.response) {
  return error.request ? 'Server is not responding' : defaultMessage;
 }
 
 if (error.response.data?.message) {
  return error.response.data.message;
 }
 
 // Обработка типовых статус-кодов
 switch (error.response.status) {
  case 400: return 'Invalid data';
  case 401: return 'Invalid credentials or authorization token expired';
  case 403: return 'Access denied';
  case 409: return 'A user with this email already exists';
  case 404: return 'Resource not found';
  case 500: return 'Internal server error';
  default: return defaultMessage;
 }
};

/**
 * Функция для выполнения авторofованных запросов к API
 * @param method - HTTP метод запроса
 * @param endpoint - Конечная точка API (без базового URL и /api)
 * @param data - Data для отправки (для POST, PUT)
 * @returns Промис с данными ответа, типofированный с помощью generic параметра T
 */
export const makeAuthRequest = async <T,>(
 method: 'get' | 'post' | 'put' | 'delete',
 endpoint: string,
 data?: any
): Promise<T> => {
 const token = localStorage.getItem("token");
 const headers: Record<string, string> = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
 };
 
 if (token) {
  headers['Authorization'] = `Bearer ${token}`;
 }
 
 try {
  const config = {
   method,
   url: `${baseUrl}/api${endpoint}`,
   headers,
   data,
   timeout: 15000
  };
  
  const response = await axios(config);
  return response.data;
 } catch (error: any) {
  // Если токен устарел или недействителен, очищаем его of localStorage
  if (error.response && error.response.status === 401) {
   localStorage.removeItem('token');
  }
  throw error;
 }
};

/**
 * Функция для выполнения запросов к API без авторofации
 * @param method - HTTP метод запроса 
 * @param endpoint - Конечная точка API (без базового URL и /api)
 * @param data - Data для отправки (для POST, PUT)
 * @returns Промис с данными ответа, типofированный с помощью generic параметра T
 */
export const makeApiRequest = async <T,>(
 method: 'get' | 'post' | 'put' | 'delete',
 endpoint: string,
 data?: any
): Promise<T> => {
 const config = {
  method,
  url: `${baseUrl}/api${endpoint}`,
  headers: {
   'Content-Type': 'application/json',
   'Accept': 'application/json'
  },
  data,
  timeout: 15000
 };
 
 try {
  const response = await axios(config);
  return response.data;
 } catch (error) {
  throw error;
 }
}; 

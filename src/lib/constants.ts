import { getApiBaseUrl } from './runtimeConfig';

/**
 * API URL для взаимодействия с CRM backend.
 * Для web-сборки остается относительным, для Overwolf/desktop задается через
 * VITE_API_URL или public/desktop-config.js.
 */
export const API_URL = getApiBaseUrl();

/**
 * Типы активности для истории 
 */
export const ACTIVITY_TYPES = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  LOGIN: 'login',
  LOGOUT: 'logout',
  TEST_COMPLETE: 'test_complete',
  MOOD_TRACK: 'mood_track',
  FILE_UPLOAD: 'file_upload',
  BALANCE_WHEEL: 'balance_wheel'
};

/**
 * Типы сущностей для истории
 */
export const ENTITY_TYPES = {
  USER: 'user',
  MOOD: 'mood',
  TEST: 'test',
  FILE: 'file',
  BALANCE_WHEEL: 'balance_wheel',
  SYSTEM: 'system'
}; 

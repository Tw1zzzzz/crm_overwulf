import axios from 'axios';
import { handleApiError } from '../apiUtils';

// Базовый URL для API
const baseUrl = '';

/**
 * Получение всех карточек players с пагинацией
 * @param page - номер страницы
 * @param limit - количество элементов на странице
 * @returns Promise с результатом запроса
 */
export const getAllPlayerCards = async (page: number = 1, limit: number = 50) => {
 try {
  const token = localStorage.getItem('token');
  
  if (!token) {
   throw new Error('Authorization required');
  }
  
  const response = await axios.get(`${baseUrl}/api/player-cards?page=${page}&limit=${limit}`, {
   headers: {
    Authorization: `Bearer ${token}`
   }
  });
  
  return { success: true, data: response.data };
 } catch (error) {
  const errorMsg = handleApiError(error, 'Error while getting player card list');
  return { success: false, error: errorMsg };
 }
};

/**
 * Получение карточки player по ID player
 * @param userId - ID player
 * @returns Promise с результатом запроса
 */
export const getPlayerCard = async (userId: string) => {
 try {
  const token = localStorage.getItem('token');
  
  if (!token) {
   throw new Error('Authorization required');
  }
  
  const response = await axios.get(`${baseUrl}/api/player-cards/${userId}`, {
   headers: {
    Authorization: `Bearer ${token}`
   }
  });
  
  return { success: true, data: response.data };
 } catch (error) {
  const errorMsg = handleApiError(error, 'Error while getting player card');
  return { success: false, error: errorMsg };
 }
};

/**
 * Create player card
 * @param userId - ID player для которого создается карточка
 * @returns Promise с результатом запроса
 */
export const createPlayerCard = async (userId: string) => {
 try {
  const token = localStorage.getItem('token');
  
  if (!token) {
   throw new Error('Authorization required');
  }
  
  const response = await axios.post(`${baseUrl}/api/player-cards`, { userId }, {
   headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
   }
  });
  
  return { success: true, data: response.data };
 } catch (error) {
  const errorMsg = handleApiError(error, 'Error while creating player card');
  return { success: false, error: errorMsg };
 }
};

/**
 * Update контактов player
 * @param contacts - Объект с контактами
 * @param userId - ID player
 * @returns Promise с результатом запроса
 */
export const updatePlayerContacts = async (
 contacts: {
  vk: string;
  telegram: string;
  faceit: string;
  steam: string;
  nickname: string;
 },
 userId: string
) => {
 try {
  const token = localStorage.getItem('token');
  
  if (!token) {
   throw new Error('Authorization required');
  }
  
  const response = await axios.put(`${baseUrl}/api/player-cards/${userId}/contacts`, {
   contacts
  }, {
   headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
   }
  });
  
  return { success: true, data: response.data };
 } catch (error) {
  const errorMsg = handleApiError(error, 'Error while updating contacts');
  return { success: false, error: errorMsg };
 }
};

/**
 * Update коммуникативной линии player
 * @param communicationLine - Текст коммуникативной линии
 * @param userId - ID player
 * @returns Promise с результатом запроса
 */
export const updateCommunicationLine = async (
 communicationLine: string,
 userId: string
) => {
 try {
  const token = localStorage.getItem('token');
  
  if (!token) {
   throw new Error('Authorization required');
  }
  
  const response = await axios.put(`${baseUrl}/api/player-cards/${userId}/communication-line`, {
   communicationLine
  }, {
   headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
   }
  });
  
  return { success: true, data: response.data };
 } catch (error) {
  const errorMsg = handleApiError(error, 'Error while updating communication line');
  return { success: false, error: errorMsg };
 }
};

/**
 * Загрузка images Roadmap
 * @param file - File images
 * @param userId - ID player
 * @returns Promise с результатом запроса
 */
export const uploadRoadmap = async (file: File, userId: string) => {
 try {
  const token = localStorage.getItem('token');
  
  if (!token) {
   throw new Error('Authorization required');
  }
  
  const formData = new FormData();
  formData.append("roadmap", file);
  
  const response = await axios.post(
   `${baseUrl}/api/player-cards/${userId}/roadmap`,
   formData,
   {
    headers: {
     Authorization: `Bearer ${token}`,
     "Content-Type": "multipart/form-data",
    },
   }
  );
  
  return { success: true, data: response.data };
 } catch (error) {
  const errorMsg = handleApiError(error, 'Error while uploading roadmap');
  return { success: false, error: errorMsg };
 }
};

/**
 * Загрузка images Mindmap
 * @param file - File images
 * @param userId - ID player
 * @returns Promise с результатом запроса
 */
export const uploadMindmap = async (file: File, userId: string) => {
 try {
  const token = localStorage.getItem('token');
  
  if (!token) {
   throw new Error('Authorization required');
  }
  
  const formData = new FormData();
  formData.append("mindmap", file);
  
  const response = await axios.post(
   `${baseUrl}/api/player-cards/${userId}/mindmap`,
   formData,
   {
    headers: {
     Authorization: `Bearer ${token}`,
     "Content-Type": "multipart/form-data",
    },
   }
  );
  
  return { success: true, data: response.data };
 } catch (error) {
  const errorMsg = handleApiError(error, 'Error while uploading mind map');
  return { success: false, error: errorMsg };
 }
}; 

/**
 * Deleting player card
 * @param userId - ID player
 * @returns Promise с результатом запроса
 */
export const deletePlayerCard = async (userId: string): Promise<{success: boolean, data?: any, error?: string}> => {
 try {
  const token = localStorage.getItem('token');
  
  if (!token) {
   throw new Error('Authorization required');
  }
  
  const response = await axios.delete(`${baseUrl}/api/player-cards/${userId}`, {
   headers: {
    Authorization: `Bearer ${token}`
   }
  });
  
  return { success: true, data: response.data };
 } catch (error) {
  const errorMsg = handleApiError(error, 'Error while deleting player card');
  return { success: false, error: errorMsg };
 }
};

/**
 * Привязка player к существующей карточке
 * @param cardId - ID карточки
 * @param newUserId - ID player для привязки
 * @returns Promise с результатом запроса
 */
export const attachPlayerToCard = async (cardId: string, newUserId: string) => {
 try {
  const token = localStorage.getItem('token');
  
  if (!token) {
   throw new Error('Authorization required');
  }
  
  const response = await axios.put(`${baseUrl}/api/player-cards/attach-player`, {
   cardId,
   newUserId
  }, {
   headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
   }
  });
  
  return { success: true, data: response.data };
 } catch (error) {
  const errorMsg = handleApiError(error, 'Error while linking player to card');
  return { success: false, error: errorMsg };
 }
};

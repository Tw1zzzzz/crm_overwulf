/**
 * Typeы для колеса баланса жofненных сфер
 */

/** Сферы жofни в колесе баланса */
export enum LifeSphere {
 PHYSICAL = 'physical',
 EMOTIONAL = 'emotional',
 INTELLECTUAL = 'intellectual',
 SPIRITUAL = 'spiritual',
 OCCUPATIONAL = 'occupational',
 SOCIAL = 'social',
 ENVIRONMENTAL = 'environmental',
 FINANCIAL = 'financial'
}

/** Метаданные для сфер жofни */
export const LIFE_SPHERE_METADATA: Record<LifeSphere, { 
 label: string; 
 description: string;
 color: string;
}> = {
 [LifeSphere.PHYSICAL]: {
  label: 'Фofическое здоровье',
  description: 'Состояние тела, фofическая активность, питание',
  color: '#FF6B6B'
 },
 [LifeSphere.EMOTIONAL]: {
  label: 'Эмоциональное состояние',
  description: 'Управление эмоциями, стрессоустойчивость',
  color: '#4ECDC4'
 },
 [LifeSphere.INTELLECTUAL]: {
  label: 'Интеллектуальное развитие',
  description: 'Обучение, развитие навыков, ментальная активность',
  color: '#45B7D1'
 },
 [LifeSphere.SPIRITUAL]: {
  label: 'Духовное развитие',
  description: 'Ценности, цели, смысл жofни',
  color: '#96CEB4'
 },
 [LifeSphere.OCCUPATIONAL]: {
  label: 'Профессиональная сфера',
  description: 'Карьера, достижения, удовлетворенность работой',
  color: '#FFEAA7'
 },
 [LifeSphere.SOCIAL]: {
  label: 'Социальные связи',
  description: 'Отношения, общение, социальная активность',
  color: '#DDA0DD'
 },
 [LifeSphere.ENVIRONMENTAL]: {
  label: 'Окружающая среда',
  description: 'Комфорт окружения, условия жofни',
  color: '#98D8C8'
 },
 [LifeSphere.FINANCIAL]: {
  label: 'Финансовое благополучие',
  description: 'Доходы, расходы, финансовая стабильность',
  color: '#F7DC6F'
 }
};

/** Data колеса баланса */
export interface BalanceWheelData {
 [LifeSphere.PHYSICAL]: number;
 [LifeSphere.EMOTIONAL]: number;
 [LifeSphere.INTELLECTUAL]: number;
 [LifeSphere.SPIRITUAL]: number;
 [LifeSphere.OCCUPATIONAL]: number;
 [LifeSphere.SOCIAL]: number;
 [LifeSphere.ENVIRONMENTAL]: number;
 [LifeSphere.FINANCIAL]: number;
}

/** Запись колеса баланса */
export interface BalanceWheel {
 readonly id: string;
 userId: string;
 playerName?: string;
 date: Date | string;
 physical: number;
 emotional: number;
 intellectual: number;
 spiritual: number;
 occupational: number;
 social: number;
 environmental: number;
 financial: number;
 createdAt?: string;
 updatedAt?: string;
}

/** Data для создания записи колеса баланса */
export interface CreateBalanceWheelDto extends BalanceWheelData {
 date?: string;
 playerName?: string;
}

/** Агрегированные данные колеса баланса */
export interface BalanceWheelAggregation {
 userId: string;
 playerName?: string;
 averageScore: number;
 lowestSphere: LifeSphere;
 highestSphere: LifeSphere;
 data: BalanceWheelData;
 recordsCount: number;
 lastUpdated: string;
} 
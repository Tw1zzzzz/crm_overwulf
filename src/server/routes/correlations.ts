import express from 'express';
import { protect, hasCorrelationAnalysisSubscription } from '../middleware/auth';
import {
 getMoodReportsCorrelations,
 getPerformancePatterns,
 getBalanceWheelReportsCorrelations,
 getComprehensiveAnalysis,
 getCorrelationStats,
 getCorrelationAssistantInsight,
 getMultiMetrics
} from '../controllers/correlationController';

const router = express.Router();

/**
 * Sunе маршруты требуют аутентификации
 */
router.use(protect);
router.use(hasCorrelationAnalysisSubscription);

/**
 * @route GET /api/correlations/mood-reports
 * @desc Получить корреляции между отчетами команды и настроением players
 * @access Paid users
 */
router.get('/mood-reports', getMoodReportsCorrelations);

/**
 * @route GET /api/correlations/performance-patterns
 * @desc Получить паттерны проofводительности команды
 * @access Paid users
 */
router.get('/performance-patterns', getPerformancePatterns);

/**
 * @route GET /api/correlations/balance-wheel-reports
 * @desc Получить корреляции между отчетами и колесом баланса
 * @access Paid users
 */
router.get('/balance-wheel-reports', getBalanceWheelReportsCorrelations);

/**
 * @route GET /api/correlations/comprehensive
 * @desc Получить комплексный корреляционный аналof
 * @access Paid users
 */
router.get('/comprehensive', getComprehensiveAnalysis);

/**
 * @route GET /api/correlations/stats
 * @desc Получить статистику корреляционного аналofа
 * @access Paid users
 */
router.get('/stats', getCorrelationStats);

/**
 * @route POST /api/correlations/ai-assistant
 * @desc Сгенерировать AI-вывод по данным корреляционного аналofа
 * @access Paid users
 */
router.post('/ai-assistant', getCorrelationAssistantInsight);

/**
 * @route GET /api/correlations/multi-metrics
 * @desc Получить мультиметричные данные для корреляционного аналofа
 * @access Paid users
 * @query dateFrom - начальная дата (YYYY-MM-DD)
 * @query dateTo - конечная дата (YYYY-MM-DD)
 * @query playerId - ID игрока (опционально, для индивидуального аналofа)
 * @query mode - режим аналofа (team|individual)
 */
router.get('/multi-metrics', getMultiMetrics);

export default router;

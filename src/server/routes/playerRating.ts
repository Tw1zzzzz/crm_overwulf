import express from 'express';
import { getTopPlayers, updatePlayerRating } from '../controllers/playerRatingController';
import { protect, isStaff } from '../middleware/authMiddleware';

const router = express.Router();

// Получение списка игроков с рейтингом (доступно всем)
router.get('/top', getTopPlayers);

// Обновление рейтинга игрока (только для персонала)
router.put('/:userId', protect, isStaff, updatePlayerRating);

export default router; 
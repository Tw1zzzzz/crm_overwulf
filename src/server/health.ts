import express from 'express';
import mongoose from 'mongoose';
import User from './models/User';
import BalanceWheel from './models/BalanceWheel';
import MoodEntry from './models/MoodEntry';
import TestEntry from './models/TestEntry';

const router = express.Router();

// Добавляем CORS заголовки для доступа к маршрутам здоровья с разных источников
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'GET');
    return res.status(200).json({});
  }
  next();
  return;
});

// Базовая проверка здоровья
router.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 5000
  });
});

// Проверка состояния базы данных
router.get('/db', async (_req, res) => {
  try {
    // Проверка соединения с MongoDB
    const dbState = mongoose.connection.readyState;
    
    // Создаем отображение состояний с правильной типизацией
    const dbStateMap: Record<number, string> = {
      0: 'отключено',
      1: 'подключено',
      2: 'соединение',
      3: 'отключение'
    };
    
    // Получаем текстовое представление состояния с безопасной проверкой
    const dbStateText = dbStateMap[dbState] || 'неизвестно';

    // Получение количества документов в коллекциях
    const userCount = await User.countDocuments();
    const playersCount = await User.countDocuments({ role: 'player' });
    const staffCount = await User.countDocuments({ role: 'staff' });
    const balanceWheelCount = await BalanceWheel.countDocuments();
    const moodEntryCount = await MoodEntry.countDocuments();
    const testEntryCount = await TestEntry.countDocuments();

    // Информация о конкретном игроке (nbl)
    const nblPlayer = await User.findOne({ name: 'nbl' }).select('_id name avatar createdAt').lean();
    let nblStats = null;
    
    if (nblPlayer) {
      const nblBalanceWheels = await BalanceWheel.countDocuments({ userId: nblPlayer._id });
      const nblMoodEntries = await MoodEntry.countDocuments({ userId: nblPlayer._id });
      const nblTestEntries = await TestEntry.countDocuments({ userId: nblPlayer._id });
      
      nblStats = {
        player: nblPlayer,
        balanceWheels: nblBalanceWheels,
        moodEntries: nblMoodEntries,
        testEntries: nblTestEntries,
      };
    }

    res.json({
      status: 'ok',
      database: {
        state: dbState,
        stateText: dbStateText,
        connection: mongoose.connection.name,
        host: mongoose.connection.host,
      },
      counts: {
        users: userCount,
        players: playersCount,
        staff: staffCount,
        balanceWheels: balanceWheelCount,
        moodEntries: moodEntryCount,
        testEntries: testEntryCount,
      },
      nbl: nblStats,
    });
  } catch (error) {
    console.error('Ошибка при проверке базы данных:', error);
    res.status(500).json({
      status: 'error',
      message: 'Ошибка при проверке состояния базы данных',
      error: error instanceof Error ? error.message : 'Неизвестная ошибка'
    });
  }
});

export default router; 
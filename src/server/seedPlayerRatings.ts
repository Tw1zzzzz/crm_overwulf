import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User';
import PlayerRating from './models/PlayerRating';

// Загрузка переменных окружения
dotenv.config();

// Подключение к MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/esports-mood-tracker');
    console.log('MongoDB подключена...');
  } catch (error) {
    console.error('Ошибка подключения к MongoDB:', error);
    process.exit(1);
  }
};

// Заполнение базы данных тестовыми рейтингами
const seedPlayerRatings = async () => {
  try {
    // Очистка коллекции рейтингов
    await PlayerRating.deleteMany({});
    console.log('PlayerRating коллекция очищена');

    // Получение всех пользователей
    const users = await User.find({ role: 'player' });
    console.log(`Найдено ${users.length} игроков`);

    if (users.length === 0) {
      console.log('Игроки не найдены в базе данных. Добавьте пользователей через API регистрации.');
      process.exit(0);
    }

    // Создание рейтингов для каждого игрока
    const playerRatings = users.map(user => {
      const gamePoints = Math.floor(Math.random() * 1000);
      const nonGamePoints = Math.floor(Math.random() * 800);
      const discipline = Math.floor(70 + Math.random() * 30); // От 70 до 100
      
      return {
        userId: user._id,
        gamePoints,
        nonGamePoints,
        rating: gamePoints + nonGamePoints,
        discipline,
        updatedAt: new Date()
      };
    });

    await PlayerRating.insertMany(playerRatings);
    console.log(`Добавлено ${playerRatings.length} записей рейтинга игроков`);

    process.exit(0);
  } catch (error) {
    console.error('Ошибка при заполнении тестовыми данными:', error);
    process.exit(1);
  }
};

// Запуск скрипта
connectDB().then(() => {
  console.log('Запуск заполнения тестовыми данными рейтинга игроков...');
  seedPlayerRatings();
}); 
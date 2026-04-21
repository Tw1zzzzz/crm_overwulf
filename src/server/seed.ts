import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User';
import BalanceWheel from './models/BalanceWheel';
import bcrypt from 'bcryptjs';

// Загрузка переменных окружения
dotenv.config();

// Функция для создания тестовых данных
const seedDatabase = async () => {
  try {
    // Подключение к MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/esports-mood-tracker');
    console.log('Connected to MongoDB');

    // Проверяем, есть ли уже данные колеса баланса
    const balanceWheelsCount = await BalanceWheel.countDocuments();
    console.log(`Found ${balanceWheelsCount} existing balance wheels`);

    // Получаем список всех игроков
    const players = await User.find({ role: 'player' });
    console.log(`Found ${players.length} players`);

    if (players.length === 0) {
      console.log('No players found, creating a test player...');
      
      // Создаем тестового игрока
      const hashedPassword = await bcrypt.hash('password123', 10);
      const testPlayer = await User.create({
        name: 'Test Player',
        email: 'player@test.com',
        password: hashedPassword,
        role: 'player',
      });
      
      players.push(testPlayer);
      console.log('Created test player:', testPlayer._id);
    }

    // Создаем колеса баланса для каждого игрока
    for (const player of players) {
      console.log(`Creating balance wheels for player: ${player.name} (${player._id})`);
      
      // Проверяем, есть ли у этого игрока уже колеса баланса
      const playerWheelsCount = await BalanceWheel.countDocuments({ userId: player._id });
      
      if (playerWheelsCount > 0) {
        console.log(`Player ${player.name} already has ${playerWheelsCount} balance wheels, skipping...`);
        continue;
      }
      
      // Создаем три колеса баланса с разными датами
      const now = new Date();
      
      // Колесо за текущий месяц
      await BalanceWheel.create({
        userId: player._id,
        date: now,
        physical: Math.floor(Math.random() * 10) + 1,
        emotional: Math.floor(Math.random() * 10) + 1,
        intellectual: Math.floor(Math.random() * 10) + 1,
        spiritual: Math.floor(Math.random() * 10) + 1,
        occupational: Math.floor(Math.random() * 10) + 1,
        social: Math.floor(Math.random() * 10) + 1,
        environmental: Math.floor(Math.random() * 10) + 1,
        financial: Math.floor(Math.random() * 10) + 1
      });

      // Колесо за предыдущий месяц
      const lastMonth = new Date(now);
      lastMonth.setMonth(now.getMonth() - 1);
      
      await BalanceWheel.create({
        userId: player._id,
        date: lastMonth,
        physical: Math.floor(Math.random() * 10) + 1,
        emotional: Math.floor(Math.random() * 10) + 1,
        intellectual: Math.floor(Math.random() * 10) + 1,
        spiritual: Math.floor(Math.random() * 10) + 1,
        occupational: Math.floor(Math.random() * 10) + 1,
        social: Math.floor(Math.random() * 10) + 1,
        environmental: Math.floor(Math.random() * 10) + 1,
        financial: Math.floor(Math.random() * 10) + 1
      });

      // Колесо за 2 месяца назад
      const twoMonthsAgo = new Date(now);
      twoMonthsAgo.setMonth(now.getMonth() - 2);
      
      await BalanceWheel.create({
        userId: player._id,
        date: twoMonthsAgo,
        physical: Math.floor(Math.random() * 10) + 1,
        emotional: Math.floor(Math.random() * 10) + 1,
        intellectual: Math.floor(Math.random() * 10) + 1,
        spiritual: Math.floor(Math.random() * 10) + 1,
        occupational: Math.floor(Math.random() * 10) + 1,
        social: Math.floor(Math.random() * 10) + 1,
        environmental: Math.floor(Math.random() * 10) + 1,
        financial: Math.floor(Math.random() * 10) + 1
      });
      
      console.log(`Created 3 balance wheels for player ${player.name}`);
      
      // Обновляем статус игрока, что он заполнил колесо баланса
      await User.findByIdAndUpdate(player._id, { completedBalanceWheel: true });
    }

    console.log('Database seeding completed successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    // Закрываем соединение с MongoDB
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
};

// Запускаем функцию заполнения базы данных
seedDatabase(); 
import mongoose, { Schema, Document } from 'mongoose';

interface BalanceWheel {
  health: number;
  social: number;
  skills: number;
  [key: string]: number;
}

export interface IPlayerMetrics extends Document {
  userId: mongoose.Types.ObjectId;
  matchId?: mongoose.Types.ObjectId;
  mood: number; // от 1 до 10
  balanceWheel: BalanceWheel;
  createdAt: Date;
}

const PlayerMetricsSchema: Schema = new Schema({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  matchId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Match',
    default: null
  },
  mood: { 
    type: Number, 
    required: true,
    min: 1,
    max: 10 
  },
  balanceWheel: {
    health: { type: Number, min: 0, max: 10 },
    social: { type: Number, min: 0, max: 10 },
    skills: { type: Number, min: 0, max: 10 },
    // Дополнительные поля могут быть добавлены динамически
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Создание индексов для быстрой выборки
PlayerMetricsSchema.index({ userId: 1, createdAt: -1 });

// TTL-индекс: автоматическое удаление документов старше 1 года
PlayerMetricsSchema.index({ createdAt: 1 }, { 
  expireAfterSeconds: 60 * 60 * 24 * 365 // 1 год
});

export default mongoose.model<IPlayerMetrics>('PlayerMetrics', PlayerMetricsSchema); 
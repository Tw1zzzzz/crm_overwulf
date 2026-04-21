import mongoose, { Schema, Document } from 'mongoose';

export interface IPlayerRating extends Document {
  userId: mongoose.Types.ObjectId;
  rating: number;
  gamePoints: number;
  nonGamePoints: number;
  discipline: number;
  updatedAt: Date;
}

const PlayerRatingSchema: Schema = new Schema({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    required: true,
    unique: true
  },
  rating: { 
    type: Number, 
    default: 0
  },
  gamePoints: { 
    type: Number, 
    default: 0
  },
  nonGamePoints: { 
    type: Number, 
    default: 0
  },
  discipline: { 
    type: Number, 
    default: 100,
    min: 0,
    max: 100
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Создание индекса для сортировки по рейтингу
PlayerRatingSchema.index({ rating: -1 });

export default mongoose.model<IPlayerRating>('PlayerRating', PlayerRatingSchema); 
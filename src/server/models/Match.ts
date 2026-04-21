import mongoose, { Schema, Document } from 'mongoose';

export interface IMatch extends Document {
  faceitAccountId: mongoose.Types.ObjectId;
  matchId: string;
  gameType: string;
  map: string;
  result: 'win' | 'loss' | 'draw';
  eloBefore: number;
  eloAfter: number;
  playedAt: Date;
  rawData: Record<string, any>;
}

const MatchSchema: Schema = new Schema({
  faceitAccountId: { 
    type: Schema.Types.ObjectId, 
    ref: 'FaceitAccount',
    required: true 
  },
  matchId: { 
    type: String, 
    required: true 
  },
  gameType: { 
    type: String, 
    required: true 
  },
  map: { 
    type: String, 
    required: true 
  },
  result: { 
    type: String, 
    enum: ['win', 'loss', 'draw'],
    required: true 
  },
  eloBefore: { 
    type: Number
  },
  eloAfter: { 
    type: Number
  },
  playedAt: { 
    type: Date, 
    required: true 
  },
  rawData: { 
    type: Schema.Types.Mixed 
  }
});

// Создание индекса для быстрой выборки матчей по аккаунту и дате
MatchSchema.index({ faceitAccountId: 1, playedAt: -1 });

export default mongoose.model<IMatch>('Match', MatchSchema); 
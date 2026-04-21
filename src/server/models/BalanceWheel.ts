import mongoose from 'mongoose';

const balanceWheelSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  physical: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  emotional: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  intellectual: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  spiritual: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  occupational: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  social: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  environmental: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  financial: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  }
}, { timestamps: true });

const BalanceWheel = mongoose.model('BalanceWheel', balanceWheelSchema);

export default BalanceWheel; 
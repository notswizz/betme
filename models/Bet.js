import mongoose from 'mongoose';

const BetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ["Spread", "Moneyline", "Over/Under", "Parlay", "Prop", "Future"]
  },
  sport: {
    type: String,
    required: true
  },
  team1: String,
  team2: String,
  line: String,
  odds: {
    type: Number,
    required: true
  },
  stake: {
    type: Number,
    required: true
  },
  payout: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'won', 'lost', 'cancelled'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.models.Bet || mongoose.model('Bet', BetSchema); 
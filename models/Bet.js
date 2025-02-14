import mongoose from 'mongoose';

// Delete the model if it exists to force schema recompilation
if (mongoose.models.Bet) {
  delete mongoose.models.Bet;
}

const BetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  challengerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  type: {
    type: String,
    required: true,
    enum: ['Moneyline', 'Spread', 'Over/Under', 'Parlay', 'Prop']
  },
  sport: {
    type: String,
    required: true
  },
  team1: {
    type: String,
    required: true
  },
  team2: {
    type: String,
    required: true
  },
  line: {
    type: String,
    required: true
  },
  odds: {
    type: String,
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
    enum: ['pending', 'matched', 'completed', 'cancelled'],
    default: 'pending'
  },
  winnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  matchedAt: {
    type: Date,
    default: null
  }
});

// Create and export the model
const Bet = mongoose.models.Bet || mongoose.model('Bet', BetSchema);
export default Bet; 
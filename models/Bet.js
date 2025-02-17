import mongoose from 'mongoose';

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
  challengerStake: {
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
  winningTeam: {
    type: String,
    default: null
  },
  votes: {
    type: [{ userId: mongoose.Schema.Types.ObjectId, team: String }],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  matchedAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  }
});

// Handle model compilation in a way that works in development and production
let Bet;
try {
  // Try to get the existing model
  Bet = mongoose.model('Bet');
} catch (error) {
  // Model doesn't exist, create it
  Bet = mongoose.model('Bet', BetSchema);
}

export default Bet; 
import mongoose from 'mongoose';

// User Schema
const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  tokenBalance: {
    type: Number,
    default: 1000
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Bet Schema
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

// Function to get models with schema registration handling
export function getModels() {
  // Delete existing models in development to force schema recompilation
  if (process.env.NODE_ENV === 'development') {
    if (mongoose.models.User) delete mongoose.models.User;
    if (mongoose.models.Bet) delete mongoose.models.Bet;
  }

  // Register models
  const User = mongoose.models.User || mongoose.model('User', UserSchema);
  const Bet = mongoose.models.Bet || mongoose.model('Bet', BetSchema);

  return { User, Bet };
}

// Export a function to ensure models are registered
export async function ensureModels() {
  await mongoose.connect(process.env.MONGODB_URI);
  return getModels();
} 
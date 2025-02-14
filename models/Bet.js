import mongoose from 'mongoose';
import { getModels } from '@/utils/models';

// Delete the model if it exists to force schema recompilation
if (mongoose.models.Bet) {
  delete mongoose.models.Bet;
}

const VoteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  team: {
    type: String,
    required: true
  },
  votedAt: {
    type: Date,
    default: Date.now
  }
});

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
    enum: ['pending', 'matched', 'voting', 'completed', 'cancelled'],
    default: 'pending'
  },
  votes: {
    type: [VoteSchema],
    default: []
  },
  votingEndsAt: {
    type: Date,
    default: null
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

// Add method to get vote counts
BetSchema.methods.getVoteCounts = function() {
  const counts = {
    [this.team1]: 0,
    [this.team2]: 0
  };
  
  if (Array.isArray(this.votes)) {
    this.votes.forEach(vote => {
      counts[vote.team] = (counts[vote.team] || 0) + 1;
    });
  }
  
  return counts;
};

// Add method to get winning team based on votes
BetSchema.methods.getWinningTeam = function() {
  const counts = this.getVoteCounts();
  if (counts[this.team1] > counts[this.team2]) return this.team1;
  if (counts[this.team2] > counts[this.team1]) return this.team2;
  return null; // Tie
};

// Create and export the model
const Bet = mongoose.models.Bet || mongoose.model('Bet', BetSchema);

// Export the Bet model
export default Bet; 
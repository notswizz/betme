import mongoose from 'mongoose';

// Delete the model if it exists to force schema recompilation
if (mongoose.models.Conversation) {
  delete mongoose.models.Conversation;
}

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    required: true,
    enum: ['user', 'assistant']
  },
  type: {
    type: String,
    required: false,
    default: 'text',
    enum: ['text', 'betslip', 'natural_bet', 'open_bets', 'image', 'bet_success', 'player_stats', 'bet_list']
  },
  content: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const conversationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  messages: [messageSchema],
  active: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Force model compilation with new schema
const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation; 
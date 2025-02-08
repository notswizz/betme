import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    required: true,
    enum: ['user', 'assistant']
  },
  content: {
    type: String,
    required: true
  },
  requiresConfirmation: {
    type: Boolean,
    default: false
  },
  action: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  }
});

const conversationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  messages: [messageSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Conversation = mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema);

export default Conversation; 
import mongoose from 'mongoose';

// Define the schema
const UserSchema = new mongoose.Schema({
  email: {
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
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Prevent mongoose from creating the model multiple times
export default mongoose.models.User || mongoose.model('User', UserSchema); 
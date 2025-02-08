import mongoose from 'mongoose';

// Define the schema
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required']
  },
  tokenBalance: {
    type: Number,
    default: 0,
    min: [0, 'Token balance cannot be negative']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Prevent mongoose from creating the model multiple times
const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User; 
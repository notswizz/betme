import mongoose from 'mongoose';

// Define the schema
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  googleId: { type: String, unique: true },
  tokenBalance: { type: Number, default: 1000 },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Create a more robust model registration function
const getModel = () => {
  try {
    // Try to get existing model
    return mongoose.model('User');
  } catch {
    // If model doesn't exist, define and return it
    return mongoose.model('User', UserSchema);
  }
};

// Export the model getter
export default getModel; 
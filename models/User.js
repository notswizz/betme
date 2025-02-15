import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  googleId: { type: String, unique: true },
  tokenBalance: { type: Number, default: 1000 },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Function to get or create the User model
const getUserModel = () => {
  // Delete any existing model to force a clean schema
  if (mongoose.models.User) {
    delete mongoose.models.User;
  }
  return mongoose.model('User', UserSchema);
};

export default getUserModel(); 
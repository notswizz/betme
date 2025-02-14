import mongoose from 'mongoose';

// Delete any existing model to force a clean schema
if (mongoose.models.User) {
  delete mongoose.models.User;
}

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  googleId: { type: String, required: true },
  tokenBalance: { type: Number, default: 1000 },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('User', UserSchema); 
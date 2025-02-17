import mongoose from 'mongoose';

// Define the schema
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  googleId: { type: String, unique: true },
  tokenBalance: { type: Number, default: 1000 },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Handle model compilation in a way that works in development and production
let User;
try {
  // Try to get the existing model
  User = mongoose.model('User');
} catch (error) {
  // Model doesn't exist, create it
  User = mongoose.model('User', UserSchema);
}

// Export both the model getter and the schema
export const Schema = UserSchema;
export default User; 
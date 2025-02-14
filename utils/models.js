import mongoose from 'mongoose';
import User from '@/models/User';
import Bet from '@/models/Bet';

// Export a function to ensure models are registered
export async function ensureModels() {
  await mongoose.connect(process.env.MONGODB_URI);
  return { User, Bet };
}

// Export models directly
export function getModels() {
  return { User, Bet };
} 
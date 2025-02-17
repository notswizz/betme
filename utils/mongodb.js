import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

// Ensure all models are registered
function registerModels() {
  // Only register models if they haven't been registered yet
  if (!mongoose.models.User) {
    require('@/models/User');
  }
  if (!mongoose.models.Bet) {
    require('@/models/Bet');
  }
  if (!mongoose.models.Conversation) {
    require('@/models/Conversation');
  }
}

// Export an enhanced connect function that ensures models are registered
export default async function connectDBWithModels() {
  const conn = await connectDB();
  registerModels();
  return conn;
}

export { connectDB, registerModels };

// Helper functions using Mongoose
export async function getUser(userId) {
  await connectDB();
  const User = mongoose.models.User;
  return User.findById(userId);
}

export async function getUserBalance(userId) {
  await connectDB();
  const User = mongoose.models.User;
  const user = await User.findById(userId).select('tokenBalance');
  return user?.tokenBalance || 0;
} 
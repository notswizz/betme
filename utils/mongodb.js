import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('MongoDB URI is missing');
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
      console.log('Connected to MongoDB');
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (e) {
    cached.promise = null;
    throw e;
  }
}

export default connectDB;

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
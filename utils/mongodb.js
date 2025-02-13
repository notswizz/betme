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
  try {
    if (cached.conn) {
      return cached.conn;
    }

    if (!cached.promise) {
      const opts = {
        bufferCommands: false,
        dbName: 'chatbet',  // Force database name
        useNewUrlParser: true,
        useUnifiedTopology: true
      };

      // Parse the connection string to remove any database name if present
      let uri = MONGODB_URI;
      if (uri.includes('?')) {
        uri = uri.replace(/\/[^/?]+\?/, '/chatbet?');
      } else {
        uri = uri + '/chatbet';
      }

      // Clear all models from the cache
      Object.keys(mongoose.models).forEach(modelName => {
        delete mongoose.models[modelName];
      });

      cached.promise = mongoose.connect(uri, opts).then((mongoose) => {
        console.log('Connected to MongoDB database:', mongoose.connection.db.databaseName);
        return mongoose;
      });
    }

    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
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
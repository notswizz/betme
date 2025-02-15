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
  if (mongoose.models.User) {
    return mongoose.models.User;
  }
  
  return mongoose.model('User', UserSchema);
};

// Export both the model getter and the schema
export const User = getModel();
export const Schema = UserSchema;
export default User; 
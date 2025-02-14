import mongoose from 'mongoose';

// Delete the model if it exists to force schema recompilation
if (mongoose.models.User) {
  delete mongoose.models.User;
}

// Define the schema
const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  tokenBalance: {
    type: Number,
    default: 1000
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create and export the model
const User = mongoose.models.User || mongoose.model('User', UserSchema);
export default User; 
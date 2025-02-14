import connectDB from '@/utils/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();
    const { email, password, username } = req.body;

    // Validate email, password and username
    if (!email || !password || !username) {
      return res.status(400).json({ error: 'Email, password and username are required' });
    }

    // Check if user exists (by email or username)
    const existingUser = await User.findOne({ 
      $or: [
        { email },
        { username }
      ]
    }).select('_id email username');
    
    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ error: 'Email already registered' });
      }
      if (existingUser.username === username) {
        return res.status(400).json({ error: 'Username already taken' });
      }
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      email,
      username,
      password: hashedPassword,
      tokenBalance: 0
    });

    // Generate JWT
    const token = jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        username: user.username
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ 
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    // More specific error messages
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: 'Invalid input data' });
    }
    res.status(500).json({ error: 'Error creating user' });
  }
} 
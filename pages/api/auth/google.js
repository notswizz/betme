import { OAuth2Client } from 'google-auth-library';
import connectDB from '@/utils/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ error: 'No token provided' });

    // Verify the Google token
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, given_name, family_name, sub } = payload;

    // Connect to database
    await connectDB();

    // Try to find existing user
    let user = await User.findOne({ email });
    
    if (!user) {
      // Create new user
      const username = given_name ? `${given_name}${family_name || ''}` : email.split('@')[0];
      
      try {
        user = await User.create({
          email,
          username,
          googleId: sub
        });
      } catch (createError) {
        console.error('User creation failed:', createError);
        return res.status(500).json({ 
          error: 'Failed to create user',
          details: createError.message 
        });
      }
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username
      }
    });

  } catch (error) {
    console.error('Google auth failed:', error);
    return res.status(500).json({ 
      error: 'Authentication failed',
      details: error.message 
    });
  }
} 
import { OAuth2Client } from 'google-auth-library';
import connectDB from '@/utils/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function generateUniqueUsername(baseUsername) {
  // Try the base username first
  let username = baseUsername;
  let attempts = 0;
  
  while (attempts < 10) {
    try {
      // Check if username exists
      const existingUser = await User.findOne({ username });
      if (!existingUser) {
        return username;
      }
      // If username exists, add a random number
      username = `${baseUsername}${Math.floor(Math.random() * 10000)}`;
      attempts++;
    } catch (error) {
      console.error('Error checking username:', error);
      throw error;
    }
  }
  throw new Error('Could not generate unique username after multiple attempts');
}

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
    }).catch(error => {
      console.error('Google token verification failed:', error);
      throw new Error('Failed to verify Google token');
    });

    const payload = ticket.getPayload();
    const { email, given_name, family_name, sub } = payload;

    console.log('Google auth payload:', { email, given_name, family_name, sub });

    // Connect to database
    await connectDB();
    console.log('Connected to database');

    // Try to find existing user
    let user = await User.findOne({ email }).catch(error => {
      console.error('Error finding user:', error);
      throw new Error('Database query failed');
    });
    
    console.log('Existing user found:', !!user);

    if (!user) {
      // Create new user
      const baseUsername = given_name ? `${given_name}${family_name || ''}` : email.split('@')[0];
      console.log('Generating unique username from base:', baseUsername);
      
      try {
        const username = await generateUniqueUsername(baseUsername);
        console.log('Generated unique username:', username);

        user = await User.create({
          email,
          username,
          googleId: sub
        });
        console.log('New user created successfully:', user._id);
      } catch (createError) {
        console.error('User creation failed - Full error:', createError);
        console.error('Error details:', {
          name: createError.name,
          message: createError.message,
          stack: createError.stack
        });
        if (createError.errors) {
          console.error('Validation errors:', createError.errors);
        }
        return res.status(500).json({ 
          error: 'Failed to create user',
          details: createError.message,
          validationErrors: createError.errors
        });
      }
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    console.log('JWT generated for user:', user._id);

    return res.status(200).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username
      }
    });

  } catch (error) {
    console.error('Auth error - Full error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    return res.status(500).json({ 
      error: 'Authentication failed',
      details: error.message
    });
  }
} 
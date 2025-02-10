import User from '@/models/User';
import mongoose from 'mongoose';
import { verifyToken } from '@/utils/auth';
import connectDB from '@/utils/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();
    
    // Get auth header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    // Extract and verify token
    const token = authHeader.split(' ')[1];
    const userId = await verifyToken(token);
    if (!userId) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (req.method === 'GET') {
      return res.status(200).json({ balance: user.tokenBalance });
    }

    // Handle POST - add tokens
    const { amount } = req.body;
    
    // Validate amount
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Update balance
    user.tokenBalance += Number(amount);
    await user.save();

    return res.status(200).json({ 
      balance: user.tokenBalance,
      message: `Successfully added ${amount} tokens to your balance`
    });

  } catch (error) {
    console.error('Balance management error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    return res.status(500).json({ error: 'Error managing balance' });
  }
}

// Keep existing functions for other parts of the app
export async function checkBalance(userId) {
  const user = await User.findById(userId);
  
  if (!user) {
    throw new Error('User not found');
  }
  
  return {
    role: 'assistant',
    content: `Your current balance is ${user.tokenBalance} tokens.`
  };
}

export async function addTokens(userId, amount) {
  try {
    // Convert amount to a clean integer
    let tokenAmount = 0;
    
    if (typeof amount === 'object' && amount.$numberInt) {
      tokenAmount = Number(amount.$numberInt);
    } else if (typeof amount === 'string') {
      tokenAmount = Number(amount);
    } else if (typeof amount === 'number') {
      tokenAmount = amount;
    }

    // Ensure it's a valid positive integer
    tokenAmount = Math.floor(Math.abs(tokenAmount));

    if (tokenAmount <= 0) {
      return {
        success: false,
        message: 'Token amount must be greater than 0',
        error: 'INVALID_AMOUNT'
      };
    }

    // First get the current user
    const user = await User.findById(userId);
    if (!user) {
      return {
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      };
    }

    // Update the balance
    user.tokenBalance += tokenAmount;
    await user.save();

    return {
      success: true,
      message: `Successfully added ${tokenAmount} tokens to your balance. New balance: ${user.tokenBalance} tokens.`
    };

  } catch (error) {
    console.error('Error adding tokens:', error);
    return {
      success: false,
      message: 'Error updating balance',
      error: error.message
    };
  }
} 
import User from '@/models/User';
import mongoose from 'mongoose';

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
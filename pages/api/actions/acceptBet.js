import { verifyToken } from '@/utils/auth';
import connectDB from '@/utils/mongodb';
import mongoose from 'mongoose';
import { ensureModels } from '@/utils/models';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Connect to database and ensure models are registered
    await connectDB();
    const { User, Bet } = await ensureModels();

    // Get user ID from token
    const token = req.headers.authorization?.split(' ')[1];
    const userId = await verifyToken(token);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { betId } = req.body;
    if (!betId) {
      return res.status(400).json({ error: 'Bet ID is required' });
    }

    console.log('Accepting bet:', { betId, userId });

    // Find the bet
    const bet = await Bet.findById(betId);
    if (!bet) {
      return res.status(404).json({ error: 'Bet not found' });
    }

    console.log('Found bet:', JSON.stringify(bet, null, 2));

    // Check if bet is still pending
    if (bet.status !== 'pending') {
      return res.status(400).json({ error: 'This bet is no longer available' });
    }

    // Check if user is trying to accept their own bet
    if (bet.userId.toString() === userId) {
      return res.status(400).json({ error: 'You cannot accept your own bet' });
    }

    // Check if user has enough tokens
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.tokenBalance < bet.stake) {
      return res.status(400).json({ 
        error: `Insufficient tokens. Required: ${bet.stake}, Available: ${user.tokenBalance}` 
      });
    }

    // Start a session for the transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      console.log('Starting transaction to accept bet');

      // Update bet with challenger info
      const updatedBet = await Bet.findByIdAndUpdate(
        betId,
        {
          $set: {
            challengerId: new mongoose.Types.ObjectId(userId),
            status: 'matched',
            matchedAt: new Date()
          }
        },
        { new: true, session, runValidators: true }
      ).populate('userId', 'username')
       .populate('challengerId', 'username');

      if (!updatedBet) {
        throw new Error('Failed to update bet');
      }

      // Verify the update was successful within the same transaction
      const verifyBet = await Bet.findById(betId).session(session);
      console.log('Verification of updated bet:', JSON.stringify(verifyBet, null, 2));

      if (!verifyBet || verifyBet.status !== 'matched' || verifyBet.challengerId.toString() !== userId) {
        throw new Error('Bet update verification failed - please try again');
      }

      // Deduct tokens from challenger
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $inc: { tokenBalance: -bet.stake } },
        { new: true, session }
      );

      if (!updatedUser) {
        throw new Error('Failed to update user balance');
      }

      console.log('Updated user balance:', updatedUser.tokenBalance);

      // Commit the transaction
      await session.commitTransaction();
      console.log('Transaction committed successfully');

      return res.status(200).json({
        success: true,
        message: 'Bet accepted successfully',
        bet: {
          ...updatedBet.toObject(),
          challengerId: userId
        }
      });

    } catch (error) {
      // If anything fails, abort the transaction
      await session.abortTransaction();
      console.error('Transaction failed:', error);
      throw error;
    } finally {
      session.endSession();
    }

  } catch (error) {
    console.error('Error accepting bet:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to accept bet',
      details: error.toString()
    });
  }
} 
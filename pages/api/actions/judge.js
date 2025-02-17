import connectDBWithModels from '@/utils/mongodb';
import { verifyToken } from '@/utils/auth';
import Bet from '@/models/Bet';
import mongoose from 'mongoose';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDBWithModels();

    // Get user ID from token
    const token = req.headers.authorization?.split(' ')[1];
    const userId = await verifyToken(token);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { action, betId, winner } = req.body;

    // Validate betId
    if (!mongoose.Types.ObjectId.isValid(betId)) {
      return res.status(400).json({ error: 'Invalid bet ID' });
    }

    // Get the bet
    const bet = await Bet.findById(betId);
    if (!bet) {
      return res.status(404).json({ error: 'Bet not found' });
    }

    // Verify bet is matched and user is not involved
    if (bet.status !== 'matched') {
      return res.status(400).json({ error: 'Bet is not in matched status' });
    }

    if (bet.userId.toString() === userId || (bet.challengerId && bet.challengerId.toString() === userId)) {
      return res.status(400).json({ error: 'Cannot judge your own bet' });
    }

    // Handle different actions
    switch (action) {
      case 'choose_winner':
        if (!winner) {
          return res.status(400).json({ error: 'Winner must be specified' });
        }
        if (winner !== bet.team1 && winner !== bet.team2) {
          return res.status(400).json({ error: 'Invalid winner specified' });
        }

        // Add vote
        const existingVoteIndex = bet.votes.findIndex(v => v.userId.toString() === userId);
        if (existingVoteIndex >= 0) {
          bet.votes[existingVoteIndex].team = winner;
        } else {
          bet.votes.push({ userId: new mongoose.Types.ObjectId(userId), team: winner });
        }

        await bet.save();
        break;

      case 'game_not_over':
        // Remove user's vote if they previously voted
        bet.votes = bet.votes.filter(v => v.userId.toString() !== userId);
        await bet.save();
        break;

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    return res.status(200).json({
      success: true,
      message: action === 'choose_winner' ? 'Vote recorded' : 'Vote removed'
    });

  } catch (error) {
    console.error('Error in judge handler:', error);
    return res.status(500).json({ 
      error: 'Failed to process judging action',
      details: error.message
    });
  }
} 
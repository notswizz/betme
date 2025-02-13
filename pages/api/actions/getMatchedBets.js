import { verifyToken } from '@/utils/auth';
import connectDB from '@/utils/mongodb';
import Bet from '@/models/Bet';
import User from '@/models/User';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    // Get user ID from token
    const token = req.headers.authorization?.split(' ')[1];
    const userId = await verifyToken(token);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Find all matched bets where the user is either the creator or challenger
    const matchedBets = await Bet.find({
      $and: [
        { status: 'matched' },
        {
          $or: [
            { userId: userId },
            { challengerId: userId }
          ]
        }
      ]
    })
    .populate('userId', 'username')
    .populate('challengerId', 'username')
    .sort({ matchedAt: -1, createdAt: -1 })
    .lean();

    // Format the bets for display
    const formattedBets = matchedBets.map(bet => ({
      _id: bet._id.toString(),
      creator: {
        id: bet.userId._id.toString(),
        username: bet.userId.username
      },
      challenger: bet.challengerId ? {
        id: bet.challengerId._id.toString(),
        username: bet.challengerId.username
      } : null,
      type: bet.type,
      sport: bet.sport,
      team1: bet.team1,
      team2: bet.team2,
      line: bet.line,
      odds: bet.odds,
      stake: bet.stake,
      payout: parseFloat(bet.payout).toFixed(2),
      status: bet.status,
      createdAt: new Date(bet.createdAt).toLocaleString(),
      matchedAt: bet.matchedAt ? new Date(bet.matchedAt).toLocaleString() : null
    }));

    return res.status(200).json({
      success: true,
      bets: formattedBets
    });

  } catch (error) {
    console.error('Error fetching matched bets:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch matched bets',
      details: error.toString()
    });
  }
} 
import { verifyToken } from '@/utils/auth';
import connectDB from '@/utils/mongodb';
import Bet from '@/models/Bet';
import User from '@/models/User';
import mongoose from 'mongoose';

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

    // Convert userId to ObjectId
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Get all user's bets (both as creator and challenger)
    const userBets = await Bet.find({
      $or: [
        { userId: userObjectId },
        { challengerId: userObjectId }
      ]
    }).lean();

    // Calculate statistics
    const stats = {
      total: userBets.length,
      pending: 0,
      matched: 0,
      completed: 0,
      created: 0,
      accepted: 0,
      won: 0,
      totalStaked: 0,
      potentialPayout: 0,
      activeBets: 0,
      winnings: 0
    };

    userBets.forEach(bet => {
      // Count by status
      stats[bet.status] = (stats[bet.status] || 0) + 1;

      // Count created vs accepted bets
      if (bet.userId.toString() === userId) {
        stats.created++;
        // If user created the bet and won
        if (bet.status === 'completed' && bet.winnerId?.toString() === userId) {
          stats.won++;
          stats.winnings += bet.payout;
        }
      } else if (bet.challengerId?.toString() === userId) {
        stats.accepted++;
        // If user accepted the bet and won
        if (bet.status === 'completed' && bet.winnerId?.toString() === userId) {
          stats.won++;
          stats.winnings += bet.payout;
        }
      }

      // Calculate financial stats
      if (bet.status === 'pending' || bet.status === 'matched') {
        stats.totalStaked += bet.stake;
        stats.potentialPayout += bet.payout;
        stats.activeBets++;
      }
    });

    // Get user's token balance
    const user = await User.findById(userId).select('tokenBalance').lean();

    // Get user's rank based on total bets
    const userRank = await Bet.aggregate([
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$challengerId', null] },
              '$userId',
              '$challengerId'
            ]
          },
          totalBets: { $sum: 1 }
        }
      },
      { $sort: { totalBets: -1 } }
    ]);

    const rankIndex = userRank.findIndex(rank => 
      rank._id.toString() === userId
    );

    return res.status(200).json({
      success: true,
      stats: {
        betting: {
          total: stats.total,
          pending: stats.pending,
          matched: stats.matched,
          completed: stats.completed,
          created: stats.created,
          accepted: stats.accepted,
          won: stats.won
        },
        financial: {
          tokenBalance: user?.tokenBalance || 0,
          totalStaked: stats.totalStaked,
          potentialPayout: stats.potentialPayout,
          activeBets: stats.activeBets,
          winnings: stats.winnings
        },
        rank: {
          position: rankIndex + 1,
          totalUsers: userRank.length,
          percentile: Math.round(((userRank.length - (rankIndex + 1)) / userRank.length) * 100)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching bet stats:', error);
    // Log more details about the error
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    return res.status(500).json({ 
      error: 'Failed to fetch bet statistics',
      details: error.message,
      code: error.code
    });
  }
} 
import { verifyToken } from '@/utils/auth';
import connectDB from '@/utils/mongodb';
import User from '@/models/User';
import Bet from '@/models/Bet';
import mongoose from 'mongoose';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Connect to database first
    await connectDB();

    // Get user ID from token
    const token = req.headers.authorization?.split(' ')[1];
    const userId = await verifyToken(token);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get stats type from query
    const { type = 'personal' } = req.query;

    // Convert userId to ObjectId
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Verify user exists
    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({ error: 'User not found' });
    }

    let userBets;
    if (type === 'personal') {
      // Get all user's bets (both as creator and challenger)
      userBets = await Bet.find({
        $or: [
          { userId: userObjectId },
          { challengerId: userObjectId }
        ]
      }).lean();
    } else {
      // Get all bets for global stats
      userBets = await Bet.find({}).lean();
    }

    // Calculate statistics
    const stats = {
      total: userBets.length,
      pending: 0,  // open/unmatched bets (no matchedAt time)
      matched: 0,  // total matched bets (both active and completed)
      completed: 0,
      created: 0,
      accepted: 0,
      won: 0,
      totalStaked: 0,
      potentialPayout: 0,
      activeBets: 0,  // bets with matchedAt time but not completed
      winnings: 0
    };

    userBets.forEach(bet => {
      if (type === 'personal') {
        // Personal stats calculations
        if (bet.userId.toString() === userId) {
          stats.created++;
          if (bet.status === 'completed' && bet.winnerId?.toString() === userId) {
            stats.won++;
            stats.winnings += bet.payout;
          }
        } else if (bet.challengerId?.toString() === userId) {
          stats.accepted++;
          if (bet.status === 'completed' && bet.winnerId?.toString() === userId) {
            stats.won++;
            stats.winnings += bet.payout;
          }
        }

        // Calculate financial stats based on matchedAt for personal view
        if (!bet.matchedAt && bet.userId.toString() === userId) {
          // Open bets (no matchedAt time) - only count if user created them
          stats.pending++;
          stats.totalStaked += bet.stake;
          stats.potentialPayout += bet.payout;
        } else if (bet.matchedAt && bet.status !== 'completed') {
          // Active bets (has matchedAt time but not completed)
          stats.activeBets++;
          if (bet.userId.toString() === userId) {
            // For creator: use their original stake and potential payout
            stats.totalStaked += bet.stake;
            stats.potentialPayout += bet.payout;
          } else if (bet.challengerId?.toString() === userId) {
            // For challenger: their stake is the creator's payout minus creator's stake
            const challengerStake = bet.payout - bet.stake;
            stats.totalStaked += challengerStake;
            stats.potentialPayout += (bet.stake + challengerStake); // Total pooled amount
          }
        }
      } else {
        // Global stats calculations
        if (!bet.matchedAt) {
          // Open bets (no matchedAt time)
          stats.pending++;
          stats.totalStaked += bet.stake;
          stats.potentialPayout += bet.payout;
        } else if (bet.matchedAt && bet.status !== 'completed') {
          // Active bets (has matchedAt time but not completed)
          stats.activeBets++;
          // For global view, count total pooled amount
          const challengerStake = bet.payout - bet.stake;
          stats.totalStaked += (bet.stake + challengerStake);
          stats.potentialPayout += (bet.stake + challengerStake);
        }

        // Track other global stats
        if (bet.challengerId) {
          stats.matched++;
        } else {
          stats.created++;
        }
        if (bet.status === 'completed' && bet.winnerId) {
          stats.won++;
          stats.winnings += bet.payout;
        }
      }
    });

    // Get user's token balance for personal stats
    const user = type === 'personal' ? 
      await User.findById(userId).select('tokenBalance').lean() :
      { tokenBalance: 0 };

    // Get rank statistics
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

    const rankIndex = type === 'personal' ?
      userRank.findIndex(rank => rank._id.toString() === userId) :
      -1;

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
        rank: type === 'personal' ? {
          position: rankIndex + 1,
          totalUsers: userRank.length,
          percentile: Math.round(((userRank.length - (rankIndex + 1)) / userRank.length) * 100)
        } : null
      }
    });

  } catch (error) {
    console.error('Error fetching bet stats:', error);
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
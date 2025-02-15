import { verifyToken } from '@/utils/auth';
import connectDB from '@/utils/mongodb';
import { User } from '@/models/User';
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

    // Initialize default stats
    const defaultStats = {
      betting: {
        total: 0,
        pending: 0,
        matched: 0,
        completed: 0,
        created: 0,
        accepted: 0,
        won: 0
      },
      financial: {
        tokenBalance: userExists.tokenBalance || 0,
        totalStaked: 0,
        potentialPayout: 0,
        activeBets: 0,
        winnings: 0
      },
      rank: type === 'personal' ? {
        position: 0,
        totalUsers: 0,
        percentile: 0
      } : null
    };

    // Get user's bets
    let userBets;
    try {
      if (type === 'personal') {
        userBets = await Bet.find({
          $or: [
            { userId: userObjectId },
            { challengerId: userObjectId }
          ]
        }).lean();
      } else {
        userBets = await Bet.find({}).lean();
      }
    } catch (error) {
      console.error('Error fetching bets:', error);
      userBets = [];
    }

    // Calculate stats from bets
    const stats = calculateStats(userBets, userId, type, defaultStats);

    return res.status(200).json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Error fetching bet stats:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch bet statistics',
      details: error.message
    });
  }
}

function calculateStats(bets, userId, type, defaultStats) {
  const stats = { ...defaultStats };
  
  bets.forEach(bet => {
    if (type === 'personal') {
      // Personal stats calculations
      if (bet.userId.toString() === userId) {
        stats.betting.created++;
        if (bet.status === 'completed' && bet.winnerId?.toString() === userId) {
          stats.betting.won++;
          stats.financial.winnings += bet.payout;
        }
      } else if (bet.challengerId?.toString() === userId) {
        stats.betting.accepted++;
        if (bet.status === 'completed' && bet.winnerId?.toString() === userId) {
          stats.betting.won++;
          stats.financial.winnings += bet.payout;
        }
      }

      // Calculate financial stats based on matchedAt for personal view
      if (!bet.matchedAt && bet.userId.toString() === userId) {
        // Open bets (no matchedAt time) - only count if user created them
        stats.betting.pending++;
        stats.financial.totalStaked += bet.stake;
        stats.financial.potentialPayout += bet.payout;
      } else if (bet.matchedAt && bet.status !== 'completed') {
        // Active bets (has matchedAt time but not completed)
        stats.financial.activeBets++;
        if (bet.userId.toString() === userId) {
          // For creator: use their original stake and potential payout
          stats.financial.totalStaked += bet.stake;
          stats.financial.potentialPayout += bet.payout;
        } else if (bet.challengerId?.toString() === userId) {
          // For challenger: their stake is the creator's payout minus creator's stake
          const challengerStake = bet.payout - bet.stake;
          stats.financial.totalStaked += challengerStake;
          stats.financial.potentialPayout += (bet.stake + challengerStake); // Total pooled amount
        }
      }
    } else {
      // Global stats calculations
      if (!bet.matchedAt) {
        // Open bets (no matchedAt time)
        stats.betting.pending++;
        stats.financial.totalStaked += bet.stake;
        stats.financial.potentialPayout += bet.payout;
      } else if (bet.matchedAt && bet.status !== 'completed') {
        // Active bets (has matchedAt time but not completed)
        stats.financial.activeBets++;
        // For global view, count total pooled amount
        const challengerStake = bet.payout - bet.stake;
        stats.financial.totalStaked += (bet.stake + challengerStake);
        stats.financial.potentialPayout += (bet.stake + challengerStake);
      }

      // Track other global stats
      if (bet.status === 'completed' && bet.winnerId) {
        stats.betting.won++;
        stats.financial.winnings += bet.payout;
      }
    }
  });

  // Calculate totals and other aggregate stats
  stats.betting.total = bets.length;
  stats.betting.matched = bets.filter(bet => bet.matchedAt).length;
  stats.betting.completed = bets.filter(bet => bet.status === 'completed').length;

  // Calculate rank if personal stats
  if (type === 'personal') {
    try {
      // Get total number of users with bets
      const uniqueUsers = new Set(bets.flatMap(bet => [
        bet.userId.toString(),
        bet.challengerId?.toString()
      ].filter(Boolean)));

      // Calculate user's position based on total bets
      const userBets = bets.filter(bet => 
        bet.userId.toString() === userId || 
        bet.challengerId?.toString() === userId
      ).length;

      const totalUsers = uniqueUsers.size;
      const position = Array.from(uniqueUsers)
        .map(id => ({
          id,
          total: bets.filter(bet => 
            bet.userId.toString() === id || 
            bet.challengerId?.toString() === id
          ).length
        }))
        .sort((a, b) => b.total - a.total)
        .findIndex(user => user.id === userId) + 1;

      stats.rank = {
        position,
        totalUsers,
        percentile: Math.round(((totalUsers - position) / totalUsers) * 100)
      };
    } catch (error) {
      console.error('Error calculating rank:', error);
      // Keep default rank values if calculation fails
    }
  }

  return stats;
} 
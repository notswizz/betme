import { verifyToken } from '@/utils/auth';
import connectDB from '@/utils/mongodb';
import Bet from '@/models/Bet';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const token = req.headers.authorization?.split(' ')[1];
    const userId = await verifyToken(token);
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Connect to database
    await connectDB();

    // Get total bets
    const total = await Bet.countDocuments({ userId });

    // Get pending bets
    const pending = await Bet.countDocuments({ 
      userId, 
      status: 'pending'
    });

    // Get won bets
    const won = await Bet.countDocuments({ 
      userId, 
      status: 'won'
    });

    // Get judging stats
    const totalJudged = await Bet.countDocuments({
      userId,
      hasJudged: true
    });

    const accurateJudgments = await Bet.countDocuments({
      userId,
      hasJudged: true,
      judgmentAccurate: true
    });

    // Calculate accuracy rate
    const accuracyRate = totalJudged > 0 
      ? Math.round((accurateJudgments / totalJudged) * 100) 
      : 0;

    // Get user's judging rank (simplified example - you might want to implement more sophisticated ranking)
    const allUsers = await Bet.aggregate([
      { $match: { hasJudged: true } },
      { $group: { 
        _id: '$userId',
        accurateCount: { 
          $sum: { $cond: [{ $eq: ['$judgmentAccurate', true] }, 1, 0] }
        },
        totalCount: { $sum: 1 }
      }},
      { $project: {
        accuracy: { 
          $multiply: [
            { $divide: ['$accurateCount', { $max: ['$totalCount', 1] }] },
            100
          ]
        }
      }},
      { $sort: { accuracy: -1 } }
    ]);

    const userRank = allUsers.findIndex(u => u._id.toString() === userId.toString()) + 1;

    return res.status(200).json({
      total,
      pending,
      won,
      reputation: {
        totalJudged,
        accurateJudgments,
        accuracyRate,
        rank: userRank || 'N/A'
      }
    });

  } catch (error) {
    console.error('Error fetching bet stats:', error);
    return res.status(500).json({ error: 'Failed to fetch betting statistics' });
  }
} 
import { verifyToken } from '@/utils/auth';
import { connectToDatabase } from '@/utils/mongodb';
import { ObjectId } from 'mongodb';
import { rateLimit } from '@/utils/rateLimit';

const limiter = rateLimit({
  interval: 60 * 1000, // 60 seconds
  uniqueTokenPerInterval: 500, // Max 500 users per second
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Rate limiting
    await limiter.check(res, 5, 'PLACE_BET_RATE_LIMIT');

    // Verify authentication
    const user = await verifyToken(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { gameId, selectedTeam, betAmount } = req.body;

    if (!gameId || !selectedTeam || !betAmount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { db } = await connectToDatabase();

    // Check user's token balance
    const userDoc = await db.collection('users').findOne({ _id: new ObjectId(user.id) });
    
    if (!userDoc) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (userDoc.tokens < betAmount) {
      return res.status(400).json({ error: 'Insufficient tokens' });
    }

    // Create bet document
    const bet = {
      userId: new ObjectId(user.id),
      gameId,
      selectedTeam,
      amount: betAmount,
      status: 'active',
      createdAt: new Date(),
      odds: 2.0, // Default 1:1 odds for now
    };

    // Start a session for the transaction
    const session = db.client.startSession();

    try {
      await session.withTransaction(async () => {
        // Insert bet
        await db.collection('bets').insertOne(bet, { session });

        // Update user's token balance
        await db.collection('users').updateOne(
          { _id: new ObjectId(user.id) },
          { $inc: { tokens: -betAmount } },
          { session }
        );
      });

      // Get updated user balance
      const updatedUser = await db.collection('users').findOne(
        { _id: new ObjectId(user.id) }
      );

      return res.status(200).json({
        message: 'Bet placed successfully',
        balance: updatedUser.tokens,
        betId: bet._id
      });
    } catch (error) {
      console.error('Transaction error:', error);
      return res.status(500).json({ error: 'Failed to place bet' });
    } finally {
      await session.endSession();
    }
  } catch (error) {
    console.error('Bet placement error:', error);
    return res.status(500).json({ error: 'Failed to place bet' });
  }
} 
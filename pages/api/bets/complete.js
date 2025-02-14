import { verifyToken } from '@/utils/auth';
import connectDB from '@/utils/mongodb';
import Bet from '@/models/Bet';
import User from '@/models/User';
import mongoose from 'mongoose';

const VOTING_DURATION_HOURS = 24; // How long voting stays open
const REPUTATION_REWARD = 10; // Reputation points for correct votes

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Connect to database
    await connectDB();

    // Get user ID from token
    const token = req.headers.authorization?.split(' ')[1];
    const userId = await verifyToken(token);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { betId, team } = req.body;
    if (!betId || !team) {
      return res.status(400).json({ error: 'Bet ID and team are required' });
    }

    // Find the bet
    const bet = await Bet.findById(betId);
    if (!bet) {
      return res.status(404).json({ error: 'Bet not found' });
    }

    // Verify bet is matched
    if (bet.status !== 'matched' && bet.status !== 'voting') {
      return res.status(400).json({ error: 'Bet must be matched before it can be voted on' });
    }

    // Verify team is valid
    if (team !== bet.team1 && team !== bet.team2) {
      return res.status(400).json({ error: 'Invalid team selection' });
    }

    // Start a session for the transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Initialize votes array if it doesn't exist
      if (!Array.isArray(bet.votes)) {
        bet.votes = [];
      }

      // If this is the first vote, set up voting period
      if (bet.status === 'matched') {
        // Update the bet status and voting period
        bet.status = 'voting';
        bet.votingEndsAt = new Date(Date.now() + VOTING_DURATION_HOURS * 60 * 60 * 1000);
      }

      // Check if user has already voted
      const existingVote = bet.votes.find(v => v.userId.toString() === userId);
      if (existingVote) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ error: 'You have already voted on this bet' });
      }

      // Add the vote
      bet.votes.push({
        userId: new mongoose.Types.ObjectId(userId),
        team: team,
        votedAt: new Date()
      });

      // Save the updated bet first to ensure the status change is valid
      await bet.save({ session });

      // Check if voting period has ended
      if (bet.votingEndsAt && new Date() >= bet.votingEndsAt) {
        // Get winning team
        const winningTeam = bet.getWinningTeam();
        if (!winningTeam) {
          throw new Error('No winning team determined');
        }

        // Determine winner user ID
        const winnerId = winningTeam === bet.team1 ? bet.userId : bet.challengerId;

        // Update bet status
        bet.status = 'completed';
        bet.winnerId = winnerId;
        bet.winningTeam = winningTeam;
        bet.completedAt = new Date();

        // Save the updated status
        await bet.save({ session });

        // Add winnings to winner's balance
        const winner = await User.findByIdAndUpdate(
          winnerId,
          { $inc: { tokenBalance: bet.payout } },
          { new: true, session }
        );

        if (!winner) {
          throw new Error('Failed to update winner balance');
        }

        // Award reputation points to correct voters
        const correctVoters = bet.votes
          .filter(vote => vote.team === winningTeam)
          .map(vote => vote.userId);

        if (correctVoters.length > 0) {
          await User.updateMany(
            { _id: { $in: correctVoters } },
            { $inc: { reputation: REPUTATION_REWARD } },
            { session }
          );
        }
      }

      // Commit the transaction
      await session.commitTransaction();

      // Get the final vote counts
      const voteCounts = bet.getVoteCounts();

      return res.status(200).json({
        success: true,
        message: bet.status === 'completed' ? 'Bet completed successfully' : 'Vote recorded successfully',
        bet: {
          ...bet.toObject(),
          voteCounts
        }
      });

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

  } catch (error) {
    console.error('Error completing bet:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to complete bet',
      details: error.toString()
    });
  }
} 
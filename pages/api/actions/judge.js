import connectDBWithModels from '@/utils/mongodb';
import { verifyToken } from '@/utils/auth';
import Bet from '@/models/Bet';
import User from '@/models/User';
import mongoose from 'mongoose';
import { BETTING_CONFIG } from '@/utils/config';

async function processPayout(bet, winningTeam) {
  // Determine winner and loser IDs
  const winnerId = bet.team1 === winningTeam ? bet.userId : bet.challengerId;
  const loserId = bet.team1 === winningTeam ? bet.challengerId : bet.userId;

  // Get winner and loser documents
  const winner = await User.findById(winnerId);
  const loser = await User.findById(loserId);

  if (!winner || !loser) {
    throw new Error('Could not find users for payout');
  }

  // Calculate payout
  const totalPayout = parseFloat(bet.payout);

  // Update winner's balance
  winner.tokenBalance += totalPayout;
  await winner.save();

  // Update bet status
  bet.status = 'completed';
  bet.winningTeam = winningTeam;
  bet.winnerId = winnerId;
  bet.completedAt = new Date();
  await bet.save();

  return {
    winnerId: winnerId.toString(),
    winningTeam,
    payout: totalPayout
  };
}

async function checkVotingThreshold(bet) {
  const totalVotes = bet.votes.length;
  if (totalVotes < BETTING_CONFIG.VOTE_THRESHOLD) {
    return null;
  }

  // Count votes for each team
  const team1Votes = bet.votes.filter(v => v.team === bet.team1).length;
  const team2Votes = bet.votes.filter(v => v.team === bet.team2).length;

  // Calculate percentages
  const team1Percentage = team1Votes / totalVotes;
  const team2Percentage = team2Votes / totalVotes;

  // Check if either team has met the required percentage
  if (team1Percentage >= BETTING_CONFIG.VOTE_PERCENTAGE_REQUIRED) {
    return bet.team1;
  } else if (team2Percentage >= BETTING_CONFIG.VOTE_PERCENTAGE_REQUIRED) {
    return bet.team2;
  }

  return null;
}

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

        // Check if voting threshold has been met
        const winningTeam = await checkVotingThreshold(bet);
        if (winningTeam) {
          // Process payout if threshold is met
          const payoutResult = await processPayout(bet, winningTeam);
          return res.status(200).json({
            success: true,
            message: `Bet completed! ${winningTeam} won and payout of ${payoutResult.payout} tokens has been processed.`,
            payoutResult
          });
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
      message: action === 'choose_winner' 
        ? `Vote recorded (${bet.votes.length} total votes)` 
        : 'Vote removed',
      votesNeeded: BETTING_CONFIG.VOTE_THRESHOLD - bet.votes.length
    });

  } catch (error) {
    console.error('Error in judge handler:', error);
    return res.status(500).json({ 
      error: 'Failed to process judging action',
      details: error.message
    });
  }
} 
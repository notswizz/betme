import connectDBWithModels from '@/utils/mongodb';
import User from '@/models/User';
import Bet from '@/models/Bet';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

export async function getBets(userId, action = 'view_open_bets') {
  try {
    // Connect to DB and ensure models are registered
    await connectDBWithModels();
    console.log('Getting bets with action:', action, 'for userId:', userId);
    
    // Ensure userId is a valid string before converting to ObjectId
    if (!userId || typeof userId !== 'string') {
      throw new Error('Invalid userId provided');
    }

    // Convert string ID to ObjectId
    const userObjectId = mongoose.Types.ObjectId.isValid(userId) 
      ? new mongoose.Types.ObjectId(userId)
      : null;

    if (!userObjectId) {
      throw new Error('Invalid userId format');
    }

    // Create base query
    let query = {};
    let messageText = '';
    
    // Build query based on action
    switch (action) {
      case 'view_my_bets':
        // Show all bets where user is either creator or challenger
        query = { 
          $or: [
            { userId: userObjectId }, // All bets created by user
            { challengerId: userObjectId } // All bets accepted by user
          ]
        };
        break;
      case 'judge_bets':
        // Show only matched bets where user is not involved
        query = {
          status: 'matched',
          $and: [
            { userId: { $ne: userObjectId } },
            { challengerId: { $ne: userObjectId } }
          ]
        };
        break;
      default: // view_open_bets
        // Show only pending bets from other users
        query = {
          status: 'pending',
          userId: { $ne: userObjectId },
          challengerId: null
        };
    }

    console.log('Final query:', JSON.stringify(query, null, 2));
    
    // Get bets with query and sort by most recent first
    const bets = await Bet.find(query)
      .sort({ createdAt: -1 })
      .populate('userId', 'username')
      .populate('challengerId', 'username')
      .lean();
    
    console.log('Raw bets from query:', JSON.stringify(bets, null, 2));

    // Format the bets
    const formattedBets = bets.map(bet => {
      // Determine view-specific properties
      const isJudgeable = action === 'judge_bets' && 
                         bet.status === 'matched' && 
                         bet.userId._id.toString() !== userObjectId.toString() && 
                         bet.challengerId?._id.toString() !== userObjectId.toString();

      const canAccept = action === 'view_open_bets' && 
                       bet.status === 'pending' && 
                       bet.userId._id.toString() !== userObjectId.toString() &&
                       bet.challengerId === null;

      console.log('Processing bet:', {
        betId: bet._id.toString(),
        status: bet.status,
        action,
        isJudgeable,
        canAccept,
        userId: bet.userId._id.toString(),
        challengerId: bet.challengerId?._id?.toString(),
        currentUserId: userObjectId.toString()
      });

      // Create the base bet object with flags explicitly set to boolean values
      const formattedBet = {
        _id: bet._id.toString(),
        userId: bet.userId._id.toString(),
        userUsername: bet.userId.username || 'Unknown User',
        challengerId: bet.challengerId ? bet.challengerId._id.toString() : null,
        challengerUsername: bet.challengerId ? bet.challengerId.username : null,
        type: bet.type || 'Moneyline',
        sport: bet.sport || 'NBA',
        team1: bet.team1,
        team2: bet.team2,
        line: bet.line || 'ML',
        odds: bet.odds,
        stake: parseFloat(bet.stake).toFixed(2),
        payout: parseFloat(bet.payout).toFixed(2),
        status: bet.status,
        createdAt: new Date(bet.createdAt).toLocaleString(),
        matchedAt: bet.matchedAt ? new Date(bet.matchedAt).toLocaleString() : null,
        votes: bet.votes || [],
        canJudge: Boolean(isJudgeable),
        canAccept: Boolean(canAccept)
      };

      // Add judge actions if applicable
      if (isJudgeable) {
        formattedBet.judgeActions = {
          chooseWinner: {
            teams: [
              { name: bet.team1, value: bet.team1 },
              { name: bet.team2, value: bet.team2 }
            ]
          }
        };
      }

      return formattedBet;
    });

    // Get appropriate message text
    switch (action) {
      case 'view_my_bets':
        messageText = formattedBets.length > 0 
          ? 'Here are all your bets, both created and matched:' 
          : "You haven't placed any bets yet. Would you like to place one?";
        break;
      case 'judge_bets':
        messageText = formattedBets.length > 0 
          ? 'Here are the matched bets available for judging. Choose a winner or indicate if the game is not over yet:' 
          : "There are no matched bets available for judging at the moment.";
        break;
      default: // view_open_bets
        messageText = formattedBets.length > 0 
          ? 'Here are the open bets you can accept:' 
          : 'No open bets available at the moment. Would you like to create one?';
    }

    console.log('Returning formatted bets:', formattedBets.map(bet => ({
      _id: bet._id,
      status: bet.status,
      canJudge: bet.canJudge,
      canAccept: bet.canAccept
    })));

    return {
      success: true,
      message: {
        role: 'assistant',
        type: 'bet_list',
        content: formattedBets,
        text: messageText
      }
    };

  } catch (error) {
    console.error('Error fetching bets:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch bets'
    };
  }
}

// API route handler
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // Just call the getBets function directly
    const result = await getBets(userId, req.query.action);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.status(200).json(result);

  } catch (error) {
    console.error('Error in getBets:', error);
    return res.status(500).json({ error: 'Failed to fetch bets' });
  }
} 
import connectDBWithModels from '@/utils/mongodb';
import User from '@/models/User';
import Bet from '@/models/Bet';
import mongoose from 'mongoose';

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
        query = { 
          $or: [
            { userId: userObjectId, status: { $in: ['pending', 'matched'] } },
            { challengerId: userObjectId, status: 'matched' }
          ]
        };
        break;
      case 'judge_bets':
        query = {
          status: 'matched',
          userId: { $ne: userObjectId },
          challengerId: { $ne: userObjectId }
        };
        break;
      case 'view_matched_bets':
        query = {
          status: 'matched',
          $or: [
            { userId: userObjectId },
            { challengerId: userObjectId }
          ]
        };
        break;
      default: // view_open_bets
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
    const formattedBets = bets.map(bet => ({
      _id: bet._id.toString(),
      userId: bet.userId._id ? bet.userId._id.toString() : bet.userId.toString(),
      userUsername: bet.userId.username || 'Unknown User',
      challengerId: bet.challengerId ? (bet.challengerId._id ? bet.challengerId._id.toString() : bet.challengerId.toString()) : null,
      challengerUsername: bet.challengerId ? (bet.challengerId.username || 'Unknown Challenger') : null,
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
      matchedAt: bet.matchedAt ? new Date(bet.matchedAt).toLocaleString() : null
    }));

    // Get appropriate message text
    switch (action) {
      case 'view_my_bets':
        messageText = formattedBets.length > 0 
          ? 'Here are your bets:' 
          : "You haven't placed any bets yet. Would you like to place one?";
        break;
      case 'judge_bets':
        messageText = formattedBets.length > 0 
          ? 'Here are the matched bets available for judging. You can help determine the winners:' 
          : "There are no matched bets available for judging at the moment.";
        break;
      case 'view_matched_bets':
        messageText = formattedBets.length > 0 
          ? 'Here are your matched bets:' 
          : "You don't have any matched bets yet.";
        break;
      default:
        messageText = formattedBets.length > 0 
          ? 'Here are the available open bets you can accept:' 
          : 'No open bets available at the moment. Would you like to create one?';
    }

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
    const { userId, action } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const result = await getBets(userId, action);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in bets API:', error);
    return res.status(500).json({ 
      error: 'Failed to process request',
      details: error.message
    });
  }
} 
import connectDB from '@/utils/mongodb';
import { generateAIResponse } from '@/utils/venice';
import Conversation from '@/models/Conversation';
import { verifyToken } from '@/utils/auth';
import { analyzeConversation, handleAction } from '@/utils/analyze';
import { ObjectId } from 'mongodb';
import { handleNormalChat } from '@/pages/api/actions/chat';
import { checkBalance } from '@/pages/api/actions/balance';
import { getListings } from '@/pages/api/actions/listing';
import mongoose from 'mongoose';
import { getPlayerStats, getTeamNextGame, handleBasketballQuery, fetchPlayerStatistics } from '@/utils/nbaApi';

// Import models directly
import User from '@/models/User';
import Bet from '@/models/Bet';

// Constants for validation
const VALID_INTENTS = ['basketball_query', 'place_bet', 'view_bets', 'view_open_bets', 'chat', 'betting', 'judge_bets'];
const VALID_MESSAGE_TYPES = ['text', 'player_stats', 'betslip', 'open_bets', 'image', 'bet_success', 'bet_list'];

// Helper function to handle Venice API responses
function handleVeniceResponse(response) {
  // Debug logging
  console.log('Venice API Response:', response);
  
  const { content, role } = response;
  
  // If no content, return empty response
  if (!content) {
    return {
      message: {
        role: 'assistant',
        type: 'text',
        content: ''
      },
      intent: { intent: 'chat', confidence: 1.0 }
    };
  }

  // Try to extract JSON from content
  let jsonData;
  let textContent = content;
  const jsonMatch = content.match(/\{.*\}/s);

  try {
    if (jsonMatch) {
      jsonData = JSON.parse(jsonMatch[0]);
      console.log('Parsed JSON data:', jsonData);
      
      // If this is a betting intent, preserve the natural_bet type
      if (jsonData.intent === 'betting' || jsonData.type === 'betslip') {
        const betData = {
          type: jsonData.type || 'Moneyline',
          sport: jsonData.sport || 'NBA',
          team1: jsonData.team1 || '',
          team2: jsonData.team2 || '',
          line: jsonData.line || 'ML',
          odds: jsonData.odds || -110,
          stake: parseFloat(jsonData.stake) || 100,
          payout: parseFloat(jsonData.payout) || 190.91
        };

        return {
          message: {
            role: 'assistant',
            type: 'betslip',
            content: betData,
            text: textContent || "Let's set up your bet. Fill in the details below.",
            requiresConfirmation: false,
            timestamp: new Date()
          },
          intent: {
            intent: 'betting',
            confidence: jsonData.confidence || 0.9
          }
        };
      }
      
      // Remove the JSON from the text content if it exists
      textContent = content.replace(jsonMatch[0], '').trim();
    }
    
    // Handle view intents with improved type checking
    if (jsonData?.intent && VALID_INTENTS.includes(jsonData.intent)) {
      if (jsonData.intent === 'view_bets' || jsonData.intent.includes('view_')) {
        // Determine the specific type of bets to show
        let action = 'view_open_bets'; // default
        const lowerContent = textContent.toLowerCase();
        
        // First check for specific bet types - these take precedence
        if (lowerContent.includes('my') || lowerContent.includes('mine')) {
          action = 'view_my_bets';
        } else if (lowerContent.includes('accept') || lowerContent.includes('match')) {
          action = 'view_matched_bets';
        } else if (lowerContent.includes('open')) {
          action = 'view_open_bets';
        } else if (lowerContent.includes('all')) {
          // Only use 'all' if no other specific type was requested
          if (!lowerContent.includes('match') && !lowerContent.includes('accept') && 
              !lowerContent.includes('my') && !lowerContent.includes('mine') &&
              !lowerContent.includes('open')) {
            action = 'view_open_bets';
          }
        }
        
        return {
          message: {
            role: 'assistant',
            type: 'bet_list',
            action: action,
            content: 'Fetching your bets...'
          },
          intent: {
            intent: 'view_bets',
            action: action,
            confidence: 0.95
          }
        };
      }
      
      if (isViewIntent(jsonData.intent)) {
        return {
          message: {
            role: 'assistant',
            type: 'bet_list',
            action: 'view_open_bets',
            content: textContent
          },
          intent: {
            intent: 'view_bets',
            confidence: 0.95
          }
        };
      }
      
      return {
        message: {
          role: 'assistant',
          type: 'text',
          content: textContent
        },
        intent: {
          intent: jsonData.intent,
          confidence: jsonData.confidence || 0.9
        }
      };
    }

    // Default case with validated content
    return {
      message: {
        role: 'assistant',
        type: 'text',
        content: textContent
      },
      intent: { intent: 'chat', confidence: 1.0 }
    };

  } catch (error) {
    console.error('Error processing Venice response:', error);
    console.error('Raw content:', content);
    
    // Return graceful fallback
    return {
      message: {
        role: 'assistant',
        type: 'text',
        content: content.trim()
      },
      intent: { intent: 'chat', confidence: 1.0 }
    };
  }
}

// Helper functions for validation
function isValidIntentFormat(data) {
  return data && 
         (data.intent || data.type) && 
         (!data.confidence || typeof data.confidence === 'number');
}

function isViewIntent(intent) {
  return intent === 'view_bets' || intent === 'view_open_bets';
}

function validateAndFormatBetSlip(data) {
  return {
    type: data.type || 'moneyline',
    sport: data.sport,
    team1: data.team1 || '',
    team2: data.team2 || '',
    line: data.line || '',
    odds: data.odds || '-110',
    pick: data.pick || '',
    stake: data.stake || '10',
    payout: calculatePayout(
      parseFloat(data.stake || 10),
      parseInt(data.odds || -110)
    ).toFixed(2)
  };
}

// Helper function to calculate payout
function calculatePayout(stake, odds) {
  const numOdds = parseInt(odds);
  if (numOdds > 0) {
    return stake + (stake * numOdds) / 100;
  } else if (numOdds < 0) {
    return stake + (stake * 100) / Math.abs(numOdds);
  }
  return stake;
}

// Function to get all bets and filter based on type
async function getBets(userId, action = 'view_open_bets') {
  try {
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
    const formattedBets = bets.map(bet => {
      // Determine view-specific properties
      const isJudgeable = action === 'judge_bets' && 
                         bet.status === 'matched' && 
                         bet.userId._id.toString() !== userObjectId.toString() && 
                         (!bet.challengerId || bet.challengerId._id.toString() !== userObjectId.toString());

      const canAccept = action === 'view_open_bets' && 
                       bet.status === 'pending' && 
                       bet.userId._id.toString() !== userObjectId.toString() &&
                       !bet.challengerId;

      const isMyBet = action === 'view_my_bets' && (
        bet.userId._id.toString() === userObjectId.toString() ||
        (bet.challengerId && bet.challengerId._id.toString() === userObjectId.toString())
      );

      console.log('Processing bet flags:', {
        betId: bet._id.toString(),
        status: bet.status,
        action,
        isJudgeable,
        canAccept,
        isMyBet,
        conditions: {
          isViewOpenBets: action === 'view_open_bets',
          isPending: bet.status === 'pending',
          isNotCreator: bet.userId._id.toString() !== userObjectId.toString(),
          hasNoChallenger: !bet.challengerId,
          isMyBet
        }
      });

      // Create the base bet object with flags explicitly set to boolean values
      return {
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
        canJudge: isJudgeable,
        canAccept: canAccept,
        isMyBet: isMyBet
      };
    });

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

// More natural formatting
const formatStatValue = (stat, value) => {
  switch(stat.toLowerCase()) {
    case 'points': return `${value} PPG`;
    case 'assists': return `${value} APG`;
    case 'rebounds': return `${value} RPG`;
    case 'steals': return `${value} SPG`;
    case 'blocks': return `${value} BPG`;
    case 'fgp': return `${value} FG%`;
    case 'tpp': return `${value} 3P%`;
    case 'ftp': return `${value} FT%`;
    default: return value;
  }
};

// Function to handle bet confirmation
async function handleBetConfirmation(userId, betData) {
  try {
    console.log('Handling bet confirmation:', { userId, betData });

    // Extract bet data from the action object
    const bet = betData.action;
    if (!bet) {
      throw new Error('No bet data provided');
    }

    // Validate bet data
    const requiredFields = ['stake', 'odds', 'team1', 'team2'];
    const missingFields = requiredFields.filter(field => !bet[field]);
    
    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Get user
    console.log('Fetching user with ID:', userId);
    const user = await User.findById(userId).select('+username');
    console.log('Found user:', {
      id: user?._id,
      username: user?.username,
      hasUsername: Boolean(user?.username),
      fields: Object.keys(user?._doc || {})
    });
    
    if (!user) {
      console.error('User not found:', userId);
      throw new Error('User not found');
    }
    
    if (!user.username) {
      console.error('Username not found for user:', userId);
      throw new Error('Username not found for user');
    }

    // Check if user has enough tokens
    const stake = parseFloat(bet.stake);
    console.log('Checking balance:', { userTokens: user.tokenBalance, requiredStake: stake });
    
    if (user.tokenBalance < stake) {
      throw new Error(`Insufficient tokens. Required: ${stake}, Available: ${user.tokenBalance}`);
    }

    // Create new bet
    const newBet = new Bet({
      userId,
      userUsername: user.username,
      type: bet.type === 'betslip' ? 'Moneyline' : bet.type || 'Moneyline',
      sport: bet.sport || 'NBA',
      team1: bet.team1,
      team2: bet.team2,
      line: bet.line || 'ML',
      odds: bet.odds,
      stake: stake,
      payout: bet.payout || calculatePayout(stake, bet.odds),
      status: 'pending',
      pick: bet.pick || bet.team1
    });

    console.log('Created bet:', newBet);

    // Save bet
    await newBet.save();

    // Update user token balance
    user.tokenBalance -= stake;
    await user.save();

    console.log('Updated user balance:', user.tokenBalance);

    // Return success without a message
    return {
      success: true
    };
  } catch (error) {
    console.error('Error confirming bet:', error);
    return {
      success: false,
      error: error.message || 'Failed to place bet'
    };
  }
}

// Main API route handler
export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      // Connect to database first
      await connectDB();
      
      // Get user ID from token
      const token = req.headers.authorization?.split(' ')[1];
      const userId = await verifyToken(token);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get conversation ID and messages from request
      const { messages, conversationId, confirmAction, gameState } = req.body;
      
      // Validate messages
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'Invalid messages format' });
      }

      // Insert the following block immediately after verifying the token and before getting or creating the conversation
      if (confirmAction) {
        let conversation;
        if (conversationId) {
          conversation = await Conversation.findById(conversationId);
          if (!conversation) {
            conversation = new Conversation({ userId, messages: [] });
          }
        } else {
          conversation = new Conversation({ userId, messages: [] });
        }

        const actionResult = await handleAction(confirmAction, userId, token, gameState);
        if (!actionResult.success) {
          return res.status(400).json({ error: actionResult.message || actionResult.error || 'Failed to process action' });
        }

        let actionMessage;
        if (confirmAction.name && confirmAction.name.toLowerCase() === 'place_bet') {
          actionMessage = {
            role: 'assistant',
            type: 'bet_success',
            content: actionResult.bet || actionResult.message || 'Bet placed successfully.'
          };
        } else {
          actionMessage = {
            role: 'assistant',
            type: confirmAction.name,
            content: actionResult.message || `Action ${confirmAction.name} processed successfully.`
          };
        }

        conversation.messages.push({
          role: 'user',
          content: `${confirmAction.name} action confirmed`
        });
        conversation.messages.push(actionMessage);
        await conversation.save();
        return res.status(200).json({
          message: actionMessage,
          conversationId: conversation._id.toString()
        });
      }

      // Get or create conversation
      let conversation;
      if (conversationId) {
        conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          return res.status(404).json({ error: 'Conversation not found' });
        }
      } else {
        conversation = new Conversation({
          userId,
          messages: []
        });
      }

      // Get AI response and analyze intent
      const { message: responseMessage, intent } = await analyzeConversation(messages);
      console.log('Processed response:', { responseMessage, intent });

      // Handle view bets request based on AI intent
      if (responseMessage.type === 'bet_list') {
        console.log('Handling bet viewing request with action:', responseMessage.action);
        
        // Get all bets and filter based on action
        const betsResult = await getBets(userId, responseMessage.action);
        
        if (!betsResult.success) {
          return res.status(400).json({ error: betsResult.error });
        }
        
        // Save the view bets request and response
        conversation.messages.push({
          role: 'user',
          content: messages[messages.length - 1].content
        });
        conversation.messages.push(betsResult.message);
        await conversation.save();
        
        return res.status(200).json({
          message: betsResult.message,
          conversationId: conversation._id.toString()
        });
      }

      // Insert the following block after the console.log('Processed response:', { responseMessage, intent }); line
      if (intent && intent.intent === 'token_balance') {
        // Fetch user balance from MongoDB
        const user = await User.findById(userId);
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }
        const balanceMessage = {
          role: 'assistant',
          type: 'text',
          content: `Your current balance is ${user.tokenBalance} tokens.`
        };

        // Save conversation with user message and response
        conversation.messages.push({
          role: 'user',
          content: messages[messages.length - 1].content
        });
        conversation.messages.push(balanceMessage);
        await conversation.save();

        return res.status(200).json({
          message: balanceMessage,
          conversationId: conversation._id.toString()
        });
      }

      // Handle bet-related actions
      if (typeof responseMessage.content === 'string' && (
          responseMessage.content.toLowerCase().includes('show me my bets') || 
          responseMessage.content.toLowerCase().includes('view my bets'))) {
        console.log('Fetching user bets...');
        const bets = await getBets(userId, 'view_my_bets');
        console.log('Fetched bets:', bets);
        
        return res.status(200).json({
          message: {
            role: 'assistant',
            type: 'bet_list',
            content: bets,
            text: 'Here are your bets:'
          }
        });
      }

      if (typeof responseMessage.content === 'string' && (
          responseMessage.content.toLowerCase().includes('show me open bets') || 
          responseMessage.content.toLowerCase().includes('view open bets'))) {
        console.log('Fetching open bets...');
        const bets = await getBets(userId, 'view_open_bets');
        console.log('Fetched bets:', bets);
        
        return res.status(200).json({
          message: {
            role: 'assistant',
            type: 'bet_list',
            content: bets,
            text: 'Here are the open bets you can accept:'
          }
        });
      }

      if (typeof responseMessage.content === 'string' && (
          responseMessage.content.toLowerCase().includes('show me bets to judge') || 
          responseMessage.content.toLowerCase().includes('view bets to judge'))) {
        console.log('Fetching judgeable bets...');
        const bets = await getBets(userId, 'judge_bets');
        console.log('Fetched bets:', bets);
        
        return res.status(200).json({
          message: {
            role: 'assistant',
            type: 'bet_list',
            content: bets,
            text: 'Here are the matched bets available for judging:'
          }
        });
      }

      // For other messages, save and return
      if (messages.length > 0) {
        conversation.messages.push({
          role: 'user',
          content: messages[messages.length - 1].content
        });
      }
      conversation.messages.push(responseMessage);
      await conversation.save();

      return res.status(200).json({
        message: responseMessage,
        conversationId: conversation._id.toString()
      });

    } catch (error) {
      console.error('Error in chat process:', error);
      return res.status(500).json({ 
        error: error.message || 'Internal server error',
        details: error.toString()
      });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 
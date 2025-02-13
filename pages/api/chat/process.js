import connectDB from '@/utils/mongodb';
import { generateAIResponse } from '@/utils/venice';
import Conversation from '@/models/Conversation';
import { verifyToken } from '@/utils/auth';
import { analyzeConversation, handleAction } from '@/utils/analyze';
import { ObjectId } from 'mongodb';
import { handleNormalChat } from '@/pages/api/actions/chat';
import { checkBalance } from '@/pages/api/actions/balance';
import { getListings } from '@/pages/api/actions/listing';
import User from '@/models/User';
import Bet from '@/models/Bet';
import mongoose from 'mongoose';
import { getPlayerStats, getTeamNextGame, handleBasketballQuery, fetchPlayerStatistics } from '@/utils/nbaApi';
import { findPlayerByName } from '@/services/playerService';

// Constants for validation
const VALID_INTENTS = ['basketball_query', 'place_bet', 'view_bets', 'view_open_bets', 'chat', 'betting'];
const VALID_MESSAGE_TYPES = ['text', 'player_stats', 'betslip', 'natural_bet', 'open_bets', 'image', 'bet_success'];

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
          type: 'betslip',
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
      if (jsonData.intent === 'view_bets') {
        return {
          message: {
            role: 'assistant',
            type: 'bet_list',
            action: 'view_bets'
          },
          intent: {
            type: 'direct',
            action: 'view_bets',
            confidence: jsonData.confidence || 0.9
          }
        };
      }
      
      if (isViewIntent(jsonData.intent)) {
        return {
          message: {
            role: 'assistant',
            type: jsonData.intent,
            content: textContent
          },
          intent: {
            type: 'direct',
            action: jsonData.intent,
            confidence: jsonData.confidence || 0.9
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

// Function to get open bets
async function getOpenBets(userId) {
  try {
    const openBets = await Bet.find({
      userId: { $ne: userId },
      status: 'pending'
    })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

    const formattedBets = openBets.map(bet => ({
      ...bet,
      formattedTime: new Date(bet.createdAt).toLocaleString(),
      payout: bet.payout || calculatePayout(bet.stake, bet.odds).toFixed(2),
      line: bet.line || '-'
    }));

    return {
      success: true,
      message: {
        role: 'assistant',
        type: 'open_bets',
        content: JSON.stringify(formattedBets)
      }
    };
  } catch (error) {
    console.error('Error fetching open bets:', error);
    return {
      success: false,
      error: 'Failed to fetch open bets'
    };
  }
}

// Function to get user bets
async function getUserBets(userId) {
  try {
    const userBets = await Bet.find({
      userId: userId
    })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

    // Format bets to match the expected structure
    const formattedBets = userBets.map(bet => ({
      _id: bet._id.toString(),
      userId: bet.userId.toString(),
      type: bet.type,
      sport: bet.sport,
      team1: bet.team1,
      team2: bet.team2,
      line: bet.line,
      odds: bet.odds,
      stake: bet.stake,
      payout: parseFloat(bet.payout).toFixed(2),
      status: bet.status,
      createdAt: bet.createdAt
    }));

    return {
      success: true,
      message: {
        role: 'assistant',
        type: 'bet_list',
        content: formattedBets,
        timestamp: new Date()
      }
    };
  } catch (error) {
    console.error('Error fetching user bets:', error);
    return {
      success: false,
      error: 'Failed to fetch your bets'
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
    const user = await User.findById(userId);
    if (!user) {
      console.error('User not found:', userId);
      throw new Error('User not found');
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

    // Handle view bets request
    if (responseMessage.type === 'bet_list' && responseMessage.action === 'view_bets') {
      console.log('Handling view bets request');
      const betsResult = await getUserBets(userId);
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
    console.error('Error processing message:', error);
    return res.status(500).json({ 
      error: 'Failed to process message',
      details: error.message 
    });
  }
} 
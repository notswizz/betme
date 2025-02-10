import connectDB from '@/utils/mongodb';
import { generateAIResponse } from '@/utils/venice';
import Conversation from '@/models/Conversation';
import { verifyToken } from '@/utils/auth';
import { analyzeConversation, handleAction } from '@/utils/convoAnalyze';
import { ObjectId } from 'mongodb';
import { handleNormalChat } from '@/pages/api/actions/chat';
import { checkBalance } from '@/pages/api/actions/balance';
import { getListings } from '@/pages/api/actions/listing';
import User from '@/models/User';
import Bet from '@/models/Bet';
import mongoose from 'mongoose';
import { handleBasketballQuery } from '@/utils/nbaApi';

// Helper function to handle Venice API responses
function handleVeniceResponse(response) {
  // Debug logging
  console.log('Handling Venice response:', JSON.stringify(response, null, 2));

  let content;
  let intent = { intent: 'chat', confidence: 1.0 };
  
  // Handle both direct response format and choices format
  if (response.content) {
    content = response.content;
  } else if (response?.choices?.[0]?.message?.content) {
    content = response.choices[0].message.content;
  } else {
    throw new Error('Invalid response format from Venice API');
  }

  // Try to extract JSON using a more robust method
  const jsonMatch = content.match(/\{(?:[^{}]|(\{[^{}]*\}))*\}$/);
  if (!jsonMatch) {
    return {
      message: {
        role: 'assistant',
        type: 'text',
        content: content.trim()
      },
      intent
    };
  }

  try {
    const jsonStr = jsonMatch[0];
    const textContent = content.slice(0, content.lastIndexOf(jsonStr)).trim();
    const jsonData = JSON.parse(jsonStr);
    
    // Validate JSON structure
    if (!isValidIntentFormat(jsonData)) {
      console.warn('Invalid intent format:', jsonData);
      return {
        message: {
          role: 'assistant',
          type: 'text',
          content: content.trim()
        },
        intent
      };
    }

    // Handle basketball queries with improved structure
    if (jsonData.intent === 'basketball_query') {
      return {
        message: {
          role: 'assistant',
          type: 'basketball_stats',
          content: {
            query: {
              type: jsonData.type,
              player: jsonData.player,
              stat: jsonData.stat
            },
            response: textContent
          }
        },
        intent: jsonData
      };
    }
    
    // Handle betting intents with validation
    if (jsonData.type === 'betting' && jsonData.sport) {
      const betSlip = validateAndFormatBetSlip(jsonData);
      return {
        message: {
          role: 'assistant',
          type: 'betslip',
          content: JSON.stringify(betSlip)
        },
        intent: { 
          intent: 'place_bet', 
          confidence: jsonData.confidence || 0.9 
        }
      };
    }
    
    // Handle view intents with improved type checking
    if (jsonData.intent && VALID_INTENTS.includes(jsonData.intent)) {
      if (isViewIntent(jsonData.intent)) {
        return {
          message: {
            role: 'assistant',
            type: 'text',
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

// Constants for validation
const VALID_INTENTS = ['basketball_query', 'place_bet', 'view_bets', 'view_open_bets', 'chat'];
const VALID_MESSAGE_TYPES = ['text', 'basketball_stats', 'betslip', 'open_bets'];

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

    const formattedBets = userBets.map(bet => ({
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
    console.error('Error fetching user bets:', error);
    return {
      success: false,
      error: 'Failed to fetch your bets'
    };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Debug logging
  console.log('Request body:', req.body);
  console.log('Message type:', typeof req.body.message);
  console.log('Message content:', req.body.message);

  try {
    await connectDB();
    
    // Verify auth token
    const authHeader = req.headers.authorization;
    if (!authHeader || typeof authHeader !== 'string') {
      return res.status(401).json({ message: 'Missing authorization header' });
    }

    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const userId = await verifyToken(token);
    if (!userId) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const { message, conversationId, confirmAction, type } = req.body;

    // More detailed validation with error messages
    if (!confirmAction) {
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }
      if (typeof message === 'object') {
        if (!message.content) {
          return res.status(400).json({ error: 'Message content is required' });
        }
        if (!message.type) {
          return res.status(400).json({ error: 'Message type is required' });
        }
        if (!message.role) {
          return res.status(400).json({ error: 'Message role is required' });
        }
      }
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check token balance
    if (user.tokenBalance < 1) {
      return res.status(400).json({ error: 'Insufficient tokens' });
    }

    // Get or create conversation
    let conversation = conversationId 
      ? await Conversation.findById(conversationId)
      : new Conversation({ messages: [], userId: userId });
    
    if (!conversation) {
      conversation = new Conversation({ messages: [], userId: userId });
    }

    if (!conversation._id) {
      await conversation.save();
    }

    // Add user message to conversation
    const userMessage = {
      role: 'user',
      content: typeof message === 'object' ? 
        typeof message.content === 'object' ? 
          JSON.stringify(message.content) : 
          message.content : 
        message,
      type: message.type || 'text'
    };
    
    conversation.messages.push(userMessage);

    try {
      // Get AI response
      console.log('Getting AI response for messages:', conversation.messages);
      const aiResponse = await generateAIResponse([...conversation.messages]);
      console.log('AI Response:', JSON.stringify(aiResponse, null, 2));

      // Handle the Venice response
      const { message: responseMessage, intent } = handleVeniceResponse(aiResponse);
      console.log('Processed response:', { message: responseMessage, intent });

      // If this is a basketball query
      if (intent.intent === 'basketball_query') {
        console.log('Processing basketball query...', intent);
        try {
          const basketballResponse = await handleBasketballQuery({
            type: intent.type,
            player: intent.player,
            stat: intent.stat
          });
          console.log('Basketball API response:', basketballResponse);

          if (!basketballResponse || basketballResponse.error) {
            console.error('Basketball query error:', basketballResponse?.error || 'No response');
            return res.status(200).json({
              message: {
                role: 'assistant',
                type: 'text',
                content: basketballResponse?.error || 'Sorry, I had trouble getting those stats. Please try again.'
              },
              conversationId: conversation._id.toString()
            });
          }

          // Add the response to conversation and return
          conversation.messages.push(basketballResponse);
          await conversation.save();

          return res.status(200).json({
            message: basketballResponse,
            conversationId: conversation._id.toString()
          });
        } catch (error) {
          console.error('Basketball query error:', error);
          return res.status(200).json({
            message: {
              role: 'assistant',
              type: 'text',
              content: 'Sorry, I had trouble getting those stats. Please try again.'
            },
            conversationId: conversation._id.toString()
          });
        }
      }

      // For other messages, save and return
      conversation.messages.push(responseMessage);
      await conversation.save();

      return res.status(200).json({
        message: responseMessage,
        conversationId: conversation._id.toString()
      });

    } catch (error) {
      console.error('Error processing message:', error);
      return res.status(500).json({ 
        error: 'Error processing message',
        message: 'Sorry, there was an error processing your message. Please try again.',
        details: error.message
      });
    }

  } catch (error) {
    console.error('Chat process error:', error);
    return res.status(500).json({ 
      error: 'Error processing message',
      message: 'Sorry, there was an error processing your message. Please try again.',
      details: error.message
    });
  }
} 
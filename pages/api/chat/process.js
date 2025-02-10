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

  // Try to separate message and JSON
  const parts = content.split(/(\{.*\})$/s);
  
  // If we have a JSON part, try to parse it
  if (parts[1]) {
    try {
      const jsonData = JSON.parse(parts[1]);
      
      // Check if this is a betting intent
      if (jsonData.type && jsonData.sport) {
        // This is a bet slip, format it appropriately
        return {
          message: {
            role: 'assistant',
            type: 'betslip',
            content: JSON.stringify({
              type: jsonData.type,
              sport: jsonData.sport,
              team1: jsonData.team1 || '',
              team2: jsonData.team2 || '',
              line: jsonData.line || '',
              odds: jsonData.odds || '-110',
              pick: jsonData.pick || '',
              stake: jsonData.stake || '10',
              payout: calculatePayout(parseFloat(jsonData.stake || 10), parseInt(jsonData.odds || -110)).toFixed(2)
            })
          },
          intent: { intent: 'place_bet', confidence: jsonData.confidence || 0.9 }
        };
      }
      
      // Handle view_bets and other direct intents
      if (jsonData.intent) {
        intent = {
          intent: jsonData.intent,
          confidence: jsonData.confidence || 0.9
        };
        
        // For view intents, set the type to direct and include the action
        if (jsonData.intent === 'view_bets' || jsonData.intent === 'view_open_bets') {
          return {
            message: {
              role: 'assistant',
              type: 'text',
              content: parts[0].trim()
            },
            intent: {
              type: 'direct',
              action: jsonData.intent,
              confidence: jsonData.confidence || 0.9
            }
          };
        }
      }
    } catch (e) {
      console.error('Error parsing JSON from Venice response:', e);
    }
  }

  return {
    message: {
      role: 'assistant',
      type: 'text',
      content: parts[0].trim()
    },
    intent
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

  // Get auth header
  const authHeader = req.headers.authorization;
  if (!authHeader || typeof authHeader !== 'string') {
    return res.status(401).json({ message: 'Missing authorization header' });
  }

  // Extract token
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    await connectDB();
    
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

    // Handle action confirmation
    if (confirmAction) {
      // Debug logging
      console.log('Processing action confirmation:', JSON.stringify(confirmAction, null, 2));

      // Get or create conversation first
      let conversation = conversationId 
        ? await Conversation.findById(conversationId)
        : new Conversation({ 
            messages: [],
            userId: userId
          });

      // Extract the actual action from the confirmation message
      const action = confirmAction.action || confirmAction;
      
      // Validate action format
      if (!action || !action.name) {
        return res.status(400).json({ 
          error: 'Invalid action format',
          message: 'The action format is invalid. Please try again.'
        });
      }

      const result = await handleAction(action, userId, token);
      
      if (result.success) {
        let confirmationMessages;
        
        // Special handling for bet placement
        if (action.name === 'place_bet' && result.bet) {
          const betSuccessData = {
            _id: result.bet._id,
            type: result.bet.type,
            sport: result.bet.sport,
            team1: result.bet.team1,
            team2: result.bet.team2,
            line: result.bet.line,
            odds: result.bet.odds,
            stake: result.bet.stake,
            payout: result.bet.payout
          };

          confirmationMessages = [
            { role: 'user', content: 'Confirmed' },
            { 
              role: 'assistant',
              type: 'text',
              content: JSON.stringify({
                type: 'bet_success',
                data: betSuccessData
              })
            }
          ];

          // Add messages to conversation
          conversation.messages.push(...confirmationMessages);
          await conversation.save();

          // Return the object format for the UI
          return res.status(200).json({
            message: { 
              role: 'assistant',
              type: 'bet_success',
              content: betSuccessData
            },
            conversationId: conversation._id.toString()
          });
        } else {
          confirmationMessages = [
            { role: 'user', content: 'Confirmed' },
            { role: 'assistant', content: result.message }
          ];
          
          // Add messages to conversation
          conversation.messages.push(...confirmationMessages);
          await conversation.save();

          return res.status(200).json({
            message: confirmationMessages[1],
            conversationId: conversation._id.toString()
          });
        }
      } else {
        return res.status(400).json({ 
          error: result.error || 'Failed to process action',
          message: result.message || 'There was an error processing your request. Please try again.'
        });
      }
    }

    // Get or create conversation for non-confirmation flows
    let conversation;
    try {
      conversation = conversationId 
        ? await Conversation.findById(conversationId)
        : new Conversation({ 
            messages: [],
            userId: userId
          });
      
      // If conversation wasn't found by ID, create a new one
      if (!conversation) {
        conversation = new Conversation({
          messages: [],
          userId: userId
        });
      }

      // Save new conversation if it was just created
      if (!conversation._id) {
        await conversation.save();
      }
    } catch (error) {
      console.error('Error creating/retrieving conversation:', error);
      return res.status(500).json({ message: 'Error managing conversation' });
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
    
    // Special handling for bet slips and images
    if (message.type === 'betslip') {
      const betSlipContent = typeof message.content === 'object' ? 
        message.content : 
        JSON.parse(message.content);

      // Add bet slip - ensure content is stringified
      const betSlipMessage = {
        role: 'assistant',
        type: 'betslip',
        content: JSON.stringify(betSlipContent)
      };
      
      conversation.messages.push(betSlipMessage);
      await conversation.save();

      return res.status(200).json({
        message: {
          ...betSlipMessage,
          content: betSlipContent // Send as object for UI
        },
        conversationId: conversation._id.toString()
      });
    }
    
    // For images, just save the message and return
    if (message.type === 'image') {
      conversation.messages.push(userMessage);
      await conversation.save();
      
      return res.status(200).json({
        message: userMessage,
        conversationId: conversation._id.toString()
      });
    }

    // For regular messages, continue with normal flow
    conversation.messages.push(userMessage);

    // Get AI response
    const aiResponse = await generateAIResponse([...conversation.messages]);
    console.log('AI Response:', JSON.stringify(aiResponse, null, 2));

    // Handle the Venice response
    try {
      const { message, intent } = handleVeniceResponse(aiResponse);
      
      // If this is a betting intent that returned a bet slip
      if (message.type === 'betslip') {
        conversation.messages.push(message);
        await conversation.save();
        
        return res.status(200).json({
          message: {
            ...message,
            content: JSON.parse(message.content) // Send as object for UI
          },
          conversationId: conversation._id.toString()
        });
      }

      // For other intents, continue with normal flow
      const analysis = { type: intent.intent || 'chat' };

      // Handle direct responses
      if (analysis.type === 'direct' || intent.type === 'direct') {
        let result;
        const action = intent.action || analysis.action;
        
        switch (action) {
          case 'view_open_bets':
            result = await getOpenBets(userId);
            break;
          case 'view_bets':
            result = await getUserBets(userId);
            break;
          case 'balance_check':
            result = {
              success: true,
              message: {
                role: 'assistant',
                type: 'text',
                content: `Your current balance is ${user.tokenBalance} tokens.`
              }
            };
            break;
          default:
            result = {
              success: false,
              error: 'Unknown direct action'
            };
        }

        if (!result.success) {
          return res.status(500).json({ error: result.error });
        }

        // Ensure message content is stringified before saving
        const messageToSave = {
          ...result.message,
          content: typeof result.message.content === 'object' ? 
            JSON.stringify(result.message.content) : 
            result.message.content
        };

        conversation.messages.push(messageToSave);
        await conversation.save();

        // For bet views, parse the content back to an object for the UI
        if (result.message.type === 'open_bets') {
          return res.status(200).json({
            message: {
              ...result.message,
              content: typeof result.message.content === 'string' ? 
                JSON.parse(result.message.content) : 
                result.message.content
            },
            conversationId: conversation._id.toString()
          });
        }

        return res.status(200).json({
          message: result.message,
          conversationId: conversation._id.toString()
        });
      }

      // For chat messages, save and return
      conversation.messages.push(message);
      await conversation.save();

      return res.status(200).json({
        message,
        conversationId: conversation._id.toString()
      });

    } catch (error) {
      console.error('Error handling Venice response:', error);
      return res.status(500).json({
        error: 'Error processing message',
        message: 'Sorry, there was an error processing your message. Please try again.'
      });
    }

  } catch (error) {
    console.error('Chat process error:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error',
      message: 'Sorry, there was an error processing your message. Please try again.'
    });
  }
} 
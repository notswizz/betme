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
      // Get or create conversation first
      let conversation = conversationId 
        ? await Conversation.findById(conversationId)
        : new Conversation({ 
            messages: [],
            userId: userId
          });

      const result = await handleAction(confirmAction, userId, token);
      
      if (result.success) {
        let confirmationMessages;
        
        // Special handling for bet placement
        if (confirmAction.name === 'place_bet' && result.bet) {
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
              type: 'bet_success',
              content: JSON.stringify(betSuccessData)
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
          error: result.error,
          message: result.message 
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

    // Analyze conversation intent
    const analysis = await analyzeConversation([...conversation.messages]);
    console.log('Conversation analysis:', analysis); // Add debug logging

    // Handle direct responses
    if (analysis.type === 'direct') {
      let result;
      
      switch (analysis.action) {
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

      return res.status(200).json({
        message: result.message,
        conversationId: conversation._id.toString()
      });
    }

    // Get AI response for non-direct actions
    const aiResponse = await generateAIResponse([
      ...conversation.messages
    ]);

    // Extract JSON from response if it exists
    let jsonResponse = null;
    let conversationalResponse = '';
    
    try {
      const content = aiResponse.content;
      // Find JSON object in the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          jsonResponse = JSON.parse(jsonMatch[0]);
          // Get the conversational part (everything before the JSON)
          conversationalResponse = content.substring(0, jsonMatch.index).trim();
        } catch (e) {
          console.error('Error parsing JSON from AI response:', e);
          // Continue with just the conversational response
          conversationalResponse = content;
        }
      } else {
        conversationalResponse = content;
      }
    } catch (error) {
      console.error('Error processing AI response:', error);
      conversationalResponse = aiResponse.content || "I'm not sure how to help with that. Would you like to place a bet, view open bets, or check your balance?";
    }

    // First check for betting intent in the JSON response
    if (jsonResponse && jsonResponse.type && jsonResponse.sport) {
      const betSlipContent = {
        type: jsonResponse.type,
        sport: jsonResponse.sport,
        team1: jsonResponse.team1 || '',
        team2: jsonResponse.team2 || '',
        line: jsonResponse.line || '',
        odds: jsonResponse.odds || '-110',
        stake: jsonResponse.stake || '10',
        pick: jsonResponse.pick || '',
        payout: calculatePayout(parseFloat(jsonResponse.stake) || 10, jsonResponse.odds || '-110').toFixed(2)
      };

      // Add conversational response
      if (conversationalResponse) {
        conversation.messages.push({
          role: 'assistant',
          type: 'text',
          content: conversationalResponse
        });
      }

      // Add bet slip - ensure content is stringified
      const betSlipMessage = {
        role: 'assistant',
        type: 'betslip',
        content: JSON.stringify(betSlipContent)
      };
      
      conversation.messages.push(betSlipMessage);
      await conversation.save();

      return res.status(200).json({
        messages: [
          ...(conversationalResponse ? [{
            role: 'assistant',
            type: 'text',
            content: conversationalResponse
          }] : []),
          {
            ...betSlipMessage,
            content: betSlipContent // Send as object for UI
          }
        ],
        conversationId: conversation._id.toString()
      });
    }
    
    // Then check for viewing intents
    if (jsonResponse && jsonResponse.intent) {
      let result;
      
      switch (jsonResponse.intent) {
        case 'view_open_bets':
          result = await getOpenBets(userId);
          break;
        case 'view_bets':
          result = await getUserBets(userId);
          break;
        case 'check_balance':
          result = {
            success: true,
            message: {
              role: 'assistant',
              type: 'text',
              content: `Your current balance is ${user.tokenBalance} tokens.`
            }
          };
          break;
      }

      if (result && result.success) {
        // Add conversational response first
        if (conversationalResponse) {
          conversation.messages.push({
            role: 'assistant',
            type: 'text',
            content: conversationalResponse
          });
        }
        
        // Then add the actual data response - ensure content is stringified
        const messageToSave = {
          ...result.message,
          content: typeof result.message.content === 'object' ? 
            JSON.stringify(result.message.content) : 
            result.message.content
        };
        
        conversation.messages.push(messageToSave);
        await conversation.save();

        return res.status(200).json({
          messages: [
            ...(conversationalResponse ? [{
              role: 'assistant',
              type: 'text',
              content: conversationalResponse
            }] : []),
            result.message
          ],
          conversationId: conversation._id.toString()
        });
      }
    }

    // Default to regular chat response
    const regularResponse = {
      role: 'assistant',
      type: 'text',
      content: conversationalResponse || "I'm not sure how to help with that. Would you like to place a bet, view open bets, or check your balance?"
    };

    conversation.messages.push(regularResponse);
    await conversation.save();

    return res.status(200).json({
      message: regularResponse,
      conversationId: conversation._id.toString()
    });

  } catch (error) {
    console.error('Chat process error:', error);
    return res.status(500).json({ message: 'Error processing chat' });
  }
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

// Add this function near the top with other handlers
async function getOpenBets(userId) {
  try {
    const openBets = await Bet.find({
      userId: { $ne: userId },
      status: 'pending'
    })
    .sort({ createdAt: -1 })
    .limit(50)  // Increased from 20 to 50
    .lean();

    // Add formatted timestamps and ensure all required fields
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

// Add this function near the top with other handlers
async function getUserBets(userId) {
  try {
    const userBets = await Bet.find({
      userId: userId
    })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

    return {
      success: true,
      message: {
        role: 'assistant',
        type: 'open_bets',
        content: JSON.stringify(userBets) // Stringify the content
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
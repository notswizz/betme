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
import mongoose from 'mongoose';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

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

    // Validate input
    if (!confirmAction && (!message || typeof message !== 'string')) {
      return res.status(400).json({ error: 'Invalid message format' });
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
        }
        
        conversation.messages.push(...confirmationMessages);
        await conversation.save();

        return res.status(200).json({
          message: confirmationMessages[1],
          conversationId: conversation._id.toString()
        });
      } else {
        return res.status(400).json({ 
          error: result.error,
          message: result.message 
        });
      }
    }

    // Get or create conversation
    let conversation = conversationId 
      ? await Conversation.findById(conversationId)
      : new Conversation({ 
          messages: [],
          userId: userId  // Add the required userId field
        });

    // Add user message to conversation
    const userMessage = {
      role: 'user',
      content: typeof message === 'string' ? message : message.content,
      type: message.type || 'text'
    };
    
    conversation.messages.push(userMessage);

    // Get AI response
    const aiResponse = await generateAIResponse([
      ...conversation.messages
    ]);

    // Check if the response contains a bet slip
    let betSlip = null;
    try {
      const content = aiResponse.content;
      // Try to parse JSON from the response
      if (typeof content === 'string' && (content.includes('"type":') || content.includes('"sport":'))) {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          betSlip = JSON.parse(jsonMatch[0]);
        }
      }
    } catch (error) {
      console.error('Error parsing bet slip:', error);
    }

    // If we detected a bet slip, format it for the UI
    if (betSlip && betSlip.type && betSlip.sport) {
      const betSlipContent = {
        type: betSlip.type,
        sport: betSlip.sport,
        team1: betSlip.team1,
        team2: betSlip.team2,
        line: betSlip.line || '',
        odds: betSlip.odds || '-110',
        stake: betSlip.stake || '10',
        pick: betSlip.pick,
        payout: calculatePayout(parseFloat(betSlip.stake) || 10, betSlip.odds || '-110').toFixed(2)
      };

      const formattedResponse = {
        role: 'assistant',
        type: 'betslip',
        content: JSON.stringify(betSlipContent) // Stringify for conversation storage
      };

      conversation.messages.push(formattedResponse);
      await conversation.save();

      return res.status(200).json({
        message: {
          ...formattedResponse,
          content: betSlipContent // Send the object for UI rendering
        },
        conversationId: conversation._id.toString()
      });
    }

    // Handle regular chat response
    const regularResponse = {
      role: 'assistant',
      content: aiResponse.content,
      type: 'text'
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
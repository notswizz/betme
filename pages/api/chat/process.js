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

    // Get or create conversation
    let conversation;
    if (conversationId) {
      try {
        conversation = await Conversation.findOne({
          _id: conversationId,
          userId: userId
        });
        if (!conversation) {
          return res.status(404).json({ error: 'Conversation not found' });
        }
      } catch (err) {
        return res.status(400).json({ error: 'Invalid conversation ID' });
      }
    } else {
      conversation = new Conversation({
        userId: userId,
        messages: []
      });
      await conversation.save();
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

    // Analyze conversation
    const currentMessages = [...conversation.messages, { role: 'user', content: message }];
    const analysis = await analyzeConversation(currentMessages);

    // Handle action requests
    if (analysis.type === 'action') {
      const confirmMessage = {
        role: 'assistant',
        content: analysis.content,
        requiresConfirmation: true,
        action: analysis.tool_calls[0]
      };

      conversation.messages.push(
        { role: 'user', content: message },
        confirmMessage
      );
      await conversation.save();

      return res.status(200).json({
        message: confirmMessage,
        conversationId: conversation._id.toString()
      });
    }

    // Handle direct responses
    if (analysis.type === 'direct') {
      let responseMessage;
      
      if (analysis.action === 'balance_check') {
        responseMessage = await checkBalance(userId);
      } else if (analysis.action === 'view_listings') {
        const result = await getListings(userId);
        responseMessage = {
          role: 'assistant',
          content: result.message
        };
      }

      if (responseMessage) {
        conversation.messages.push(
          { role: 'user', content: message },
          responseMessage
        );
        await conversation.save();

        return res.status(200).json({
          message: responseMessage,
          conversationId: conversation._id.toString()
        });
      }
    }

    // Normal chat response
    const aiResponse = await handleNormalChat(currentMessages);
    
    conversation.messages.push(
      { role: 'user', content: message },
      aiResponse
    );
    await conversation.save();

    // Deduct token
    user.tokenBalance -= 1;
    await user.save();

    res.status(200).json({
      message: aiResponse,
      conversationId: conversation._id.toString(),
      action: analysis.type === 'action' ? analysis.tool_calls[0] : null,
      remainingTokens: user.tokenBalance
    });

    // Handle image upload and bet slip analysis
    if (type === 'betslip_analysis') {
      // Add the image message to conversation first
      const imageMessage = {
        role: 'user',
        type: 'image',
        content: message.text || 'Uploaded bet slip',
        imageUrl: message.imageUrl
      };
      
      conversation.messages.push(imageMessage);
      await conversation.save();

      // Use AI to analyze bet slip
      const analysis = await generateAIResponse([
        {
          role: "system",
          content: "You are a sports betting expert. Analyze bet slips and extract key information."
        },
        {
          role: "user",
          content: message.text || 'Please analyze this bet slip'
        }
      ]);

      // Add AI response to conversation
      const aiMessage = {
        role: 'assistant',
        content: analysis.content,
        type: 'betslip',
        content: {
          type: 'Spread',
          sport: 'NFL',
          team1: 'Kansas City Chiefs',
          team2: 'Philadelphia Eagles',
          line: '10',
          odds: '-105',
          stake: '10',
          payout: '19.52'
        }
      };

      conversation.messages.push(aiMessage);
      await conversation.save();

      return res.status(200).json({
        success: true,
        message: aiMessage,
        conversationId: conversation._id.toString()
      });
    }

  } catch (error) {
    console.error('Chat process error:', error);
    return res.status(500).json({ message: 'Error processing chat' });
  }
} 
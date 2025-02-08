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
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();
    
    const userId = await verifyToken(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
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
      const result = await handleAction(confirmAction, userId);
      
      if (result.success) {
        const confirmationMessages = [
          { role: 'user', content: 'Confirmed' },
          { role: 'assistant', content: result.message }
        ];
        
        conversation.messages.push(...confirmationMessages);
        await conversation.save();

        return res.status(200).json({
          message: { role: 'assistant', content: result.message },
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

    if (type === 'betslip_analysis') {
      // Use AI to analyze bet slip
      const analysis = await generateAIResponse([
        {
          role: "system",
          content: "You are a sports betting expert. Analyze bet slips and extract key information."
        },
        {
          role: "user",
          content: message
        }
      ]);

      return res.status(200).json({
        success: true,
        message: analysis
      });
    }

  } catch (error) {
    console.error('Chat processing error:', error);
    res.status(500).json({ 
      error: 'Error processing message',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 
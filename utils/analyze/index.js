import { generateAIResponse } from '../venice.js';
import { handleBasketballIntent } from './basketballHandler';
import { handleAction } from './actionHandler';
import { parseAIResponse } from './intentParser';
import { handleBettingIntent, handleViewBetsIntent } from './betHandler';
import { handleViewIntent, handleAddTokensIntent } from './viewHandler';
import { processBetSlipImage } from './betSlipParser';
import { handleBasketballQuery } from './basketballHandler';
import { parseIntent } from './intentParser';

/**
 * Analyzes conversation to decide what to do
 */
export async function analyzeConversation(messages, options = {}) {
  try {
    // Debug log the incoming messages
    console.log('Analyzing conversation with messages:', messages);

    // Check for Venice API key
    if (!process.env.VENICE_API_KEY) {
      console.error('VENICE_API_KEY is not set in environment variables');
      throw new Error('Venice API configuration missing');
    }

    // Handle image-based bet slip if present
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.type === 'image') {
      console.log('Processing image-based bet slip');
      
      try {
        // Process the image and get result
        const result = await processBetSlipImage(lastMessage);
        
        // Return the processed bet slip message
        return {
          message: result.message,
          intent: result.intent
        };
      } catch (error) {
        console.error('Failed to process bet slip:', error);
        return {
          message: {
            role: 'assistant',
            type: 'text',
            content: error.message || 'Sorry, I had trouble reading that bet slip. Could you try uploading a clearer image?'
          },
          intent: { type: 'error', confidence: 1.0 }
        };
      }
    }

    // Handle bet slip message if present
    if (lastMessage?.type === 'betslip') {
      return {
        message: lastMessage,
        intent: { type: 'betting', confidence: 0.95 }
      };
    }

    // Get AI response for intent detection
    const aiResponse = await generateAIResponse(messages);
    console.log('Raw AI Response:', aiResponse);

    // If we got no response from the AI, default to chat
    if (!aiResponse) {
      console.log('No valid AI response, defaulting to chat');
      return { 
        message: {
          role: 'assistant',
          type: 'text',
          content: "I'm having trouble understanding that right now. Could you try rephrasing?"
        },
        intent: { type: 'chat' }
      };
    }

    // Parse the AI response
    const { parsedIntent, conversationalResponse } = parseAIResponse(aiResponse);
    console.log('Final parsed response:', { conversationalResponse, parsedIntent });

    // Handle view bets intent - simplified for consolidated approach
    if (parsedIntent?.intent === 'view_bets' || 
        (lastMessage?.content?.toLowerCase().includes('bet') && 
         (lastMessage?.content?.toLowerCase().includes('view') || 
          lastMessage?.content?.toLowerCase().includes('show') || 
          lastMessage?.content?.toLowerCase().includes('see')))) {
      
      const content = lastMessage?.content || '';
      const lowerContent = content.toLowerCase();
      
      // First check for specific bet types - these take precedence
      let action = 'view_open_bets'; // default
      
      if (lowerContent.includes('my') || lowerContent.includes('mine')) {
        action = 'view_my_bets';
      } else if (lowerContent.includes('judge') || lowerContent.includes('complete')) {
        action = 'view_matched_bets_to_judge';
      } else if (lowerContent.includes('accept') || lowerContent.includes('match')) {
        action = 'view_matched_bets';
      } else if (lowerContent.includes('open')) {
        action = 'view_open_bets';
      } else if (lowerContent.includes('all')) {
        // Only use 'all' if no other specific type was requested
        if (!lowerContent.includes('match') && !lowerContent.includes('accept') && 
            !lowerContent.includes('my') && !lowerContent.includes('mine') &&
            !lowerContent.includes('open') && !lowerContent.includes('judge')) {
          action = 'view_open_bets';
        }
      }
      
      // If AI detected a specific action, use that instead
      if (parsedIntent?.intent === 'view_bets' && parsedIntent?.action) {
        action = parsedIntent.action;
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

    // Handle betting intent
    if (parsedIntent?.intent === 'betting' || parsedIntent?.type === 'betslip') {
      return handleBettingIntent(parsedIntent, options, conversationalResponse);
    }

    // Handle basketball query intent
    if (parsedIntent?.intent === 'basketball_query') {
      console.log('Detected basketball query');
      try {
        const response = await handleBasketballIntent(parsedIntent);
        console.log('Basketball API response:', response);
        
        if (response.type === 'error') {
          console.log('Basketball query failed:', response.message);
          return { 
            message: {
              role: 'assistant',
              type: 'text',
              content: response.message
            },
            intent: parsedIntent || { intent: 'chat', confidence: 1.0 }
          };
        }
        
        return {
          message: {
            role: 'assistant',
            type: 'text',
            content: conversationalResponse ? `${conversationalResponse}\n\n${response}` : response
          },
          intent: parsedIntent
        };
      } catch (error) {
        console.error('Basketball query error:', error);
        return {
          message: {
            role: 'assistant',
            type: 'text',
            content: 'Sorry, I had trouble processing that basketball query.'
          },
          intent: parsedIntent || { intent: 'chat', confidence: 1.0 }
        };
      }
    }

    // Handle add tokens intent
    if (parsedIntent?.intent === 'add_tokens') {
      return handleAddTokensIntent(parsedIntent);
    }

    // Default to chat if no clear intent or just conversational
    return {
      message: {
        role: 'assistant',
        type: 'text',
        content: conversationalResponse || aiResponse.content || 'I apologize, but I could not process that request.'
      },
      intent: parsedIntent || { intent: 'chat', confidence: 1.0 }
    };
  } catch (error) {
    console.error('Error in analyzeConversation:', error);
    return {
      message: {
        role: 'assistant',
        type: 'text',
        content: 'Sorry, I encountered an error processing your request. Please try again.'
      },
      intent: { intent: 'chat', confidence: 1.0 }
    };
  }
}

// Export everything
export * from './constants';
export * from './basketballHandler';
export * from './actionHandler';
export * from './betHandler';
export * from './viewHandler';
export * from './intentParser'; 
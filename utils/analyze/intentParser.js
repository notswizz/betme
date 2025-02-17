/**
 * Extracts intent and conversational response from AI response
 */
export function parseAIResponse(aiResponse) {
  if (!aiResponse) {
    return {
      parsedIntent: null,
      conversationalResponse: ''
    };
  }

  let parsedIntent;
  let conversationalResponse = '';

  try {
    // Update to capture multi-line JSON
    const parts = aiResponse.content.split(/(\{[\s\S]*\})$/);
    if (parts.length > 1) {
      conversationalResponse = parts[0].trim();
      parsedIntent = JSON.parse(parts[1]);
      console.log('Split response into:', { conversationalResponse, parsedIntent });
    } else {
      parsedIntent = JSON.parse(aiResponse.content);
      console.log('Parsed JSON from content string:', parsedIntent);
    }
  } catch (e) {
    // If content isn't pure JSON, try to extract JSON from it
    const jsonMatch = aiResponse.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      conversationalResponse = aiResponse.content.replace(jsonMatch[0], '').trim();
      parsedIntent = JSON.parse(jsonMatch[0]);
      console.log('Extracted JSON from content:', { conversationalResponse, parsedIntent });
    }
  }

  return {
    parsedIntent,
    conversationalResponse
  };
}

import { generateAIResponse } from '../venice';

export async function parseIntent(messages) {
  try {
    // Get AI response
    const response = await generateAIResponse(messages);
    
    // Extract JSON from response
    const jsonMatch = response.content.match(/\{.*\}/s);
    if (!jsonMatch) {
      return {
        intent: 'chat',
        confidence: 1.0,
        response
      };
    }

    // Parse JSON data
    const jsonData = JSON.parse(jsonMatch[0]);
    
    // Handle view bets intents
    if (jsonData.intent === 'view_bets') {
      let action = jsonData.action || 'view_open_bets';
      
      // Map different view types to specific actions
      switch (action) {
        case 'view_my_bets':
        case 'view_open_bets':
        case 'judge_bets':
          // These are valid actions, keep them as is
          break;
        default:
          // Default to view_open_bets for unknown actions
          action = 'view_open_bets';
      }

      return {
        intent: 'view_bets',
        action: action,
        confidence: jsonData.confidence || 0.9,
        response
      };
    }

    // Handle other intents
    return {
      intent: jsonData.intent || 'chat',
      confidence: jsonData.confidence || 1.0,
      response,
      ...jsonData
    };

  } catch (error) {
    console.error('Error parsing intent:', error);
    return {
      intent: 'chat',
      confidence: 1.0,
      error: error.message
    };
  }
} 
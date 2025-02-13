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

export function parseIntent(content) {
  const lowerContent = content.toLowerCase();

  // Betting intents
  if (lowerContent.includes('place bet') || lowerContent.includes('make bet')) {
    return {
      intent: 'betting',
      confidence: 0.9
    };
  }

  // View bets intents - simplified to work with consolidated approach
  if (lowerContent.includes('bet') || lowerContent.includes('wager')) {
    // Determine the specific type of bets to show
    let action = 'view_open_bets'; // default
    if (lowerContent.includes('my') || lowerContent.includes('mine')) {
      action = 'view_my_bets';
    } else if (lowerContent.includes('match') || lowerContent.includes('accept')) {
      action = 'view_matched_bets';
    }
    
    return {
      intent: 'view_bets',
      action: action,
      confidence: 0.95
    };
  }

  // Basketball query intents
  if (lowerContent.includes('stats') || lowerContent.includes('player')) {
    return {
      intent: 'basketball_query',
      confidence: 0.8
    };
  }

  // Default to unknown intent
  return {
    intent: 'unknown',
    confidence: 0.5
  };
} 
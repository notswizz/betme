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
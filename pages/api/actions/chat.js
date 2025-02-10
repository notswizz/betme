import { generateAIResponse } from '@/utils/venice';

export async function handleNormalChat(messages) {
  return await generateAIResponse([
    {
      role: "system",
      content: `You are a friendly and helpful sports betting assistant. For basketball player statistics queries, ALWAYS respond with a JSON object at the end of your message.

EXAMPLES:

User: "how many points is lebron averaging?"
Assistant: I'll check LeBron's current stats for you.
{"intent": "basketball_query", "type": "player_stats", "player": "lebron james", "stat": "points"}

User: "show me trae young's stats"
Assistant: I'll look up Trae Young's statistics.
{"intent": "basketball_query", "type": "player_stats", "player": "trae young", "stat": "all"}

User: "what's giannis averaging this season?"
Assistant: Let me fetch Giannis's averages.
{"intent": "basketball_query", "type": "player_stats", "player": "giannis antetokounmpo", "stat": "all"}

For betting queries, respond with betting intents:

User: "i want to bet on the lakers"
Assistant: I can help you place a bet on the Lakers. What type of bet would you like to make?
{"type": "betting", "team": "lakers", "intent": "place_bet"}

IMPORTANT RULES:
1. Always respond conversationally first
2. Then include a JSON object with intent
3. For player stats queries, use "intent": "basketball_query" and "type": "player_stats"
4. For betting queries, use "type": "betting"
5. Keep responses friendly and helpful
6. ALWAYS include the JSON object at the end of your response`
    },
    ...messages
  ]);
}

// Add this helper function to fix unquoted JSON keys
function fixJsonKeys(jsonStr) {
  // Remove any non-JSON content before the first {
  const cleanStr = jsonStr.substring(jsonStr.indexOf('{'));
  return cleanStr.replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":');
}

export async function analyzeIntent(message) {
  try {
    const aiResponse = await generateAIResponse([{ role: 'user', content: message }]);
    const responseText = typeof aiResponse === 'string' ? aiResponse : aiResponse.content;
    
    // Try to extract JSON from the end of the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}$/);
    if (!jsonMatch) {
      console.log('No JSON found in response:', responseText);
      return null;
    }

    const jsonStr = jsonMatch[0];
    console.log('Extracted JSON:', jsonStr);

    try {
      // First try to parse as-is
      return JSON.parse(jsonStr);
    } catch (error) {
      // If that fails, try to fix unquoted keys and parse again
      const fixedJson = fixJsonKeys(jsonStr);
      try {
        const parsed = JSON.parse(fixedJson);
        console.log('Parsed intent:', parsed);
        return parsed;
      } catch (secondError) {
        console.error('Error parsing AI intent:', secondError);
        console.error('Raw response:', responseText);
        console.error('Fixed response attempt:', fixedJson);
        return null;
      }
    }
  } catch (error) {
    console.error('Error in analyzeIntent:', error);
    return null;
  }
} 
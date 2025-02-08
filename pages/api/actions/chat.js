import { generateAIResponse } from '@/utils/venice';

export async function handleNormalChat(messages) {
  return await generateAIResponse(messages);
}

export async function analyzeIntent(message) {
  try {
    const analysis = await generateAIResponse([
      {
        role: "system",
        content: `You are an intent analyzer. Analyze the user's message and respond with a JSON object containing:
        - intent: "check_balance" | "add_tokens" | "create_listing" | "view_listings" | "other"
        - amount: number (if adding tokens)
        - listingTitle: string (if creating listing)
        - listingPrice: number (if creating listing)
        - confidence: number (0-1)
        
        Respond ONLY with the JSON object, no other text.`
      },
      {
        role: "user",
        content: message
      }
    ]);

    // Clean the response before parsing
    let jsonStr = analysis.content.trim();
    // Remove any markdown code block markers
    jsonStr = jsonStr.replace(/```json\s*|\s*```/g, '');
    
    try {
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('Error parsing AI intent:', error);
      console.error('Raw response:', jsonStr);
      return {
        intent: "other",
        confidence: 0
      };
    }
  } catch (error) {
    console.error('Error analyzing intent:', error);
    return null;
  }
} 
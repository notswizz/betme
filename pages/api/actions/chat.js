import { generateAIResponse } from '@/utils/venice';

export async function handleNormalChat(messages) {
  return await generateAIResponse(messages);
}

// Add this helper function to fix unquoted JSON keys
function fixJsonKeys(str) {
  // Add quotes around unquoted keys
  return str.replace(/(\s*?{\s*?|\s*?,\s*?)(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '$1"$3":');
}

export async function analyzeIntent(message) {
  try {
    const aiResponse = await generateAIResponse([{ role: 'user', content: message }]);
    const jsonStr = typeof aiResponse === 'string' ? aiResponse : aiResponse.content;
    
    try {
      // First try to parse as-is
      return JSON.parse(jsonStr);
    } catch (error) {
      // If that fails, try to fix unquoted keys and parse again
      const fixedJson = fixJsonKeys(jsonStr);
      try {
        return JSON.parse(fixedJson);
      } catch (secondError) {
        console.error('Error parsing AI intent:', secondError);
        console.error('Raw response:', jsonStr);
        console.error('Fixed response attempt:', fixedJson);
        return null;
      }
    }
  } catch (error) {
    console.error('Error in analyzeIntent:', error);
    return null;
  }
} 
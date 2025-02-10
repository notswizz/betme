import { generateAIResponse } from '@/utils/venice';

export async function handleNormalChat(messages) {
  return await generateAIResponse(messages);
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

function parse(jsonStr) {
  // Try to find JSON object at the end of the string
  const jsonMatch = jsonStr.match(/\{[\s\S]*\}$/);
  
  if (!jsonMatch) {
    console.log('No JSON found in response');
    return null;
  }

  try {
    // Extract just the JSON part
    const jsonPart = jsonMatch[0];
    const fixedJson = fixJsonKeys(jsonPart);
    return JSON.parse(fixedJson);
  } catch (error) {
    console.error('Error parsing AI intent:', error);
    console.error('Raw response:', jsonStr);
    return null;
  }
} 
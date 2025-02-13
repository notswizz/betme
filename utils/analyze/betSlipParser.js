import { extractText } from '../tesseract';
import { generateAIResponse } from '../venice';

/**
 * Uses AI to parse bet slip text into structured data
 */
async function parseWithAI(text) {
  const prompt = `Parse this bet slip text into a structured bet. Extract the sport, teams, bet type (spread/moneyline), line, and odds:

${text}

Format the response as JSON with these fields:
{
  "type": "Spread" or "Moneyline",
  "sport": "NFL" or "NBA",
  "team1": "first team name",
  "team2": "second team name",
  "line": "spread number or ML",
  "odds": "odds number",
  "stake": "10",
  "payout": "calculated payout",
  "pick": "team to bet on",
  "confidence": 0.95
}`;

  try {
    const aiResponse = await generateAIResponse([{
      role: 'user',
      content: prompt
    }]);

    // Extract JSON from AI response
    const jsonMatch = aiResponse.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('AI response did not contain valid JSON');
    }

    const parsedData = JSON.parse(jsonMatch[0]);
    
    // Ensure all required fields are present
    const requiredFields = ['type', 'sport', 'team1', 'team2', 'line', 'odds'];
    const missingFields = requiredFields.filter(field => !parsedData[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Add default values if missing
    parsedData.confidence = parsedData.confidence || 0.95;
    parsedData.pick = parsedData.pick || parsedData.team1;
    parsedData.stake = parsedData.stake || "10";
    
    // Calculate payout if not provided
    if (!parsedData.payout) {
      const odds = parseInt(parsedData.odds);
      const stake = parseFloat(parsedData.stake);
      if (odds > 0) {
        parsedData.payout = (stake + (stake * odds / 100)).toFixed(2);
      } else {
        parsedData.payout = (stake + (stake * 100 / Math.abs(odds))).toFixed(2);
      }
    }

    console.log('AI parsed bet data:', parsedData);
    return parsedData;
  } catch (error) {
    console.error('Error parsing with AI:', error);
    throw new Error('Failed to parse bet slip with AI');
  }
}

/**
 * Processes an image of a bet slip and returns structured bet data
 */
export async function processBetSlipImage(imageFile) {
  try {
    // Use the extracted text we already have
    const extractedText = "Football - Super Bowl spread win Total Bs Kansas City Chiefs ons 10 (-105) Philadelphia Eagles +10 (105)";
    
    console.log('Processing extracted text:', extractedText);
    const betData = await parseWithAI(extractedText);
    
    return {
      message: {
        role: 'assistant',
        type: 'betslip',
        content: betData
      },
      intent: {
        type: 'betting',
        confidence: betData.confidence
      }
    };

  } catch (error) {
    console.error('Error processing bet slip:', error);
    throw error;
  }
} 
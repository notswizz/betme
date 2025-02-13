import { Configuration, OpenAIApi } from 'openai';
import { verifyToken } from '@/utils/auth';
import { rateLimit } from '@/utils/rateLimit';
import { connectToDatabase } from '@/utils/mongodb';
import Bet from '@/models/Bet';

const limiter = rateLimit({
  interval: 60 * 1000,
  uniqueTokenPerInterval: 500,
});

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Rate limiting
    await limiter.check(res, 10, 'PROCESS_BET_RATE_LIMIT');

    // Verify authentication
    const user = await verifyToken(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { betDescription, gameState } = req.body;

    if (!betDescription) {
      return res.status(400).json({ error: 'Missing bet description' });
    }

    // Format context for AI
    const context = `
You are a sports betting assistant. When a user makes a betting request, you MUST return a properly formatted bet slip JSON object.

Current Game State:
${gameState ? `
Game Status: ${gameState.status}
${gameState.team1.name} Score: ${gameState.team1.score}
${gameState.team2.name} Score: ${gameState.team2.score}
` : 'No specific game selected'}

User's Bet Description: "${betDescription}"

ALWAYS return a JSON object in this exact format:
{
  "type": "betslip",
  "sport": "NBA",
  "team1": "Team 1 name",
  "team2": "Team 2 name",
  "line": "Point spread or total (e.g. -5.5, +3.5, o220.5)",
  "odds": "-110",
  "stake": 100,
  "payout": 190.91,
  "explanation": "Brief explanation of the bet"
}

Rules:
1. If no stake is specified, default to 100 tokens
2. If no odds are specified, default to -110
3. For moneyline bets, set line to "ML"
4. For over/under bets, prefix line with "o" or "u" (e.g. "o220.5")
5. Calculate payout based on odds and stake
6. ALWAYS return valid JSON - this is critical

Example bet requests and responses:
1. "bet 50 on lakers"
{
  "type": "betslip",
  "sport": "NBA",
  "team1": "Lakers",
  "team2": "Opponent",
  "line": "ML",
  "odds": "-110",
  "stake": 50,
  "payout": 95.45,
  "explanation": "50 token moneyline bet on Lakers"
}

2. "hawks -5.5 for 200"
{
  "type": "betslip",
  "sport": "NBA",
  "team1": "Hawks",
  "team2": "Opponent",
  "line": "-5.5",
  "odds": "-110",
  "stake": 200,
  "payout": 381.82,
  "explanation": "200 token spread bet on Hawks -5.5"
}

3. "over 220.5 knicks game"
{
  "type": "betslip",
  "sport": "NBA",
  "team1": "Knicks",
  "team2": "Opponent",
  "line": "o220.5",
  "odds": "-110",
  "stake": 100,
  "payout": 190.91,
  "explanation": "100 token over bet on Knicks game total o220.5"
}

Parse the user's bet description and return the appropriate JSON structure.`.trim();

    // Get AI analysis
    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a sports betting expert AI. Your ONLY job is to convert natural language bet requests into structured bet slips. ALWAYS return a valid JSON object in the exact format specified."
        },
        {
          role: "user",
          content: context
        }
      ],
      max_tokens: 500,
      temperature: 0.1,
    });

    // Parse the AI response
    const analysisText = completion.data.choices[0].message.content;
    let betStructure;
    try {
      betStructure = JSON.parse(analysisText);
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return res.status(500).json({ error: 'Failed to parse bet structure' });
    }

    // Validate the bet structure
    const requiredFields = ['type', 'sport', 'odds', 'stake'];
    for (const field of requiredFields) {
      if (!betStructure[field]) {
        return res.status(400).json({ error: `Missing required field: ${field}` });
      }
    }

    // Calculate payout if not provided
    if (!betStructure.payout) {
      betStructure.payout = betStructure.stake * betStructure.odds;
    }

    // Return the structured bet for the BetSlipMessage component
    return res.status(200).json({
      type: 'betslip',
      content: betStructure,
      requiresConfirmation: true,
      action: {
        name: 'place_bet',
        ...betStructure
      }
    });

  } catch (error) {
    console.error('Bet processing error:', error);
    return res.status(500).json({ error: 'Failed to process bet' });
  }
} 
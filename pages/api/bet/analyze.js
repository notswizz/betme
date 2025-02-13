import { Configuration, OpenAIApi } from 'openai';
import { verifyToken } from '@/utils/auth';
import { rateLimit } from '@/utils/rateLimit';

const limiter = rateLimit({
  interval: 60 * 1000, // 60 seconds
  uniqueTokenPerInterval: 500, // Max 500 users per second
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
    await limiter.check(res, 10, 'ANALYZE_BET_RATE_LIMIT');

    // Verify authentication
    const user = await verifyToken(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { gameId, selectedTeam, betAmount, gameState } = req.body;

    if (!gameId || !selectedTeam || !betAmount || !gameState) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Format game state for AI analysis
    const gameContext = `
Game Status: ${gameState.status}
${gameState.team1.name} Score: ${gameState.team1.score}
${gameState.team2.name} Score: ${gameState.team2.score}
Selected Team: ${selectedTeam}
Bet Amount: ${betAmount} tokens
    `.trim();

    // Get AI analysis
    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a sports betting analysis AI. Analyze the given game state and bet details to provide a concise, one-paragraph recommendation. Consider the current score, game status, and historical performance. Be direct and clear in your advice."
        },
        {
          role: "user",
          content: `Please analyze this bet:\n${gameContext}`
        }
      ],
      max_tokens: 150,
      temperature: 0.7,
    });

    const analysis = completion.data.choices[0].message.content;

    return res.status(200).json({ analysis });
  } catch (error) {
    console.error('Bet analysis error:', error);
    return res.status(500).json({ error: 'Failed to analyze bet' });
  }
} 
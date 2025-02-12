import { Configuration, OpenAIApi } from 'openai';
import { getPlayerStats } from './nbaApi.js';

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

/**
 * Generates a response from the OpenAI API, handling function calls if necessary.
 * @param {Array} messages - The message history between the user and assistant.
 * @returns {Object} - The assistant's reply.
 */
async function generateAIResponse(messages) {
  try {
    const response = await openai.createChatCompletion({
      model: 'gpt-4-0613',
      messages: [
        {
          role: 'system',
          content: `You are a friendly and helpful sports assistant. When users ask for NBA statistics or information, provide a conversational response and include function calls with the intent and parameters matching our API.

Examples:

User: "How many points is LeBron averaging this season?"
Assistant: LeBron James is currently averaging 25.8 points per game this season.
(Function Call: get_player_stats({"player": "LeBron James", "stat": "points", "season": "2024"}))

User: "Show me Trae Young's stats"
Assistant: Let me fetch Trae Young's statistics for you.
(Function Call: get_player_stats({"player": "Trae Young", "stat": "all", "season": "2024"}))

IMPORTANT RULES:
1. Always respond conversationally first.
2. Use function calls to provide structured data.
3. Always include season (current year) for player_stats queries.
4. Keep responses friendly and helpful.`,
        },
        ...messages,
      ],
      temperature: 0.1,
      max_tokens: 500,
      functions: [
        {
          name: 'get_player_stats',
          description: 'Retrieve NBA player statistics',
          parameters: {
            type: 'object',
            properties: {
              player: {
                type: 'string',
                description: 'Full name of the NBA player',
              },
              stat: {
                type: 'string',
                enum: ['points', 'assists', 'rebounds', 'all'],
                description: 'Statistic to retrieve',
              },
              season: {
                type: 'string',
                description: 'Season year, e.g., "2024"',
              },
            },
            required: ['player', 'stat', 'season'],
          },
        },
        // Add more function schemas as needed
      ],
      function_call: 'auto',
    });

    const message = response.data.choices[0].message;

    // Check if the assistant wants to call a function
    if (message.function_call) {
      const functionName = message.function_call.name;
      const functionArgs = JSON.parse(message.function_call.arguments);

      // Handle the function call (e.g., get player stats)
      const functionResponse = await handleFunctionCall(functionName, functionArgs);

      // Return the assistant's response along with function results
      const finalResponse = await openai.createChatCompletion({
        model: 'gpt-4-0613',
        messages: [
          ...messages,
          message,
          {
            role: 'function',
            name: functionName,
            content: JSON.stringify(functionResponse),
          },
        ],
        temperature: 0.1,
      });

      return finalResponse.data.choices[0].message;
    }

    // If no function call is needed, return the assistant's message
    return message;
  } catch (error) {
    console.error('OpenAI API Error:', error);
    return {
      content: "I apologize, but I'm having technical difficulties. Please try again in a moment.",
      role: 'assistant',
    };
  }
}

/**
 * Handles function calls from the assistant by invoking the appropriate function.
 * @param {string} functionName - The name of the function to call.
 * @param {Object} functionArgs - Arguments for the function.
 * @returns {Object} - The result of the function call.
 */
async function handleFunctionCall(functionName, functionArgs) {
  switch (functionName) {
    case 'get_player_stats':
      return await getPlayerStats(functionArgs);
    // Handle other functions as needed
    default:
      throw new Error(`Unknown function: ${functionName}`);
  }
}

/**
 * Fetches NBA player statistics.
 * @param {Object} params - Parameters including player name, stat, and season.
 * @returns {Object} - The player's statistics.
 */
async function getPlayerStats({ player, stat, season }) {
  try {
    // Implement your logic to fetch player stats, e.g., call NBA API
    // For demonstration purposes, let's assume you have a function nbaApi.getPlayerStats
    const stats = await getPlayerStats(player, season);

    // Process and return the requested data
    let result;
    if (stat === 'points') {
      result = { points_per_game: stats.points_per_game };
    } else if (stat === 'assists') {
      result = { assists_per_game: stats.assists_per_game };
    } else if (stat === 'rebounds') {
      result = { rebounds_per_game: stats.rebounds_per_game };
    } else if (stat === 'all') {
      result = stats;
    }

    return result;
  } catch (error) {
    console.error('Error fetching player stats:', error);
    return { error: `Could not retrieve stats for ${player} in season ${season}.` };
  }
}

export { generateAIResponse };

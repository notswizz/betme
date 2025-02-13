const VENICE_API_KEY = process.env.VENICE_API_KEY;

// Define structured basketball query types
const BASKETBALL_QUERY_TYPES = {
  PLAYER: {
    STATS: {
      SEASON: 'season_stats',
      LAST_N: 'last_n_games',
      CAREER: 'career_stats',
      VS_TEAM: 'vs_team_stats'
    },
    INFO: 'player_info',
    COMPARISON: 'player_compare'
  },
  TEAM: {
    STATS: {
      SEASON: 'team_season',
      STREAK: 'team_streak',
      HOME: 'team_home',
      AWAY: 'team_away'
    },
    ROSTER: 'team_roster',
    SCHEDULE: 'team_schedule'
  },
  GAME: {
    LIVE: 'live_games',
    UPCOMING: 'upcoming_games',
    RECENT: 'recent_games',
    HEAD_TO_HEAD: 'h2h_games'
  },
  BETTING: {
    ODDS: 'game_odds',
    PROPS: 'player_props',
    TRENDS: 'betting_trends'
  }
};

export async function generateAIResponse(messages) {
  // Ensure messages is an array and has content
  if (!Array.isArray(messages)) {
    messages = [];
  }

  // Format messages to ensure they are valid
  const formattedMessages = messages.map(msg => ({
    role: msg.role || 'user',
    content: typeof msg.content === 'object' ? JSON.stringify(msg.content) : (msg.content || '')
  }));

  const systemMessage = {
    role: "system",
    content: `You are a sports betting assistant. Your primary job is to detect user intents and return properly formatted responses.

IMPORTANT INTENTS:

1. VIEW BETS - When user wants to see their bets
Examples:
- "show my bets"
- "view bets"
- "list bets"
Response: {"intent": "view_bets"}

2. PLACE BET - When user wants to place a bet
Examples:
- "bet 100 on Lakers"
- "hawks -5.5"
- "over 220.5 in the knicks game"
Response: {"intent": "betting", "type": "betslip", "sport": "NBA", "team1": "Lakers", "team2": "Opponent", "line": "ML", "odds": "-110", "stake": 100, "payout": 190.91}

3. BASKETBALL QUERY - When user asks about stats
Examples:
- "How many points is LeBron averaging?"
Response: {"intent": "player_stats", "player": "LeBron James", "stat": "points", "season": "2024"}

RULES:
1. For ANY request, return ONLY the JSON object - no additional text
2. For bet requests, include intent: "betting" and type: "betslip"
3. For view requests, return ONLY {"intent": "view_bets"}
4. Default stake to 100 if not specified
5. Default odds to -110 if not specified
6. For moneyline bets, use line: "ML"
7. For over/under bets, prefix line with "o" or "u" (e.g. "o220.5")`
  };

  const options = {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${VENICE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: "llama-3.3-70b",
      messages: [systemMessage, ...formattedMessages],
      temperature: 0.1,
      max_tokens: 500
    })
  };

  try {
    const response = await fetch('https://api.venice.ai/api/v1/chat/completions', options);
    const data = await response.json();
    
    // Debug the API response
    console.log('Venice API Response:', data);
    
    // Handle API errors
    if (data.error) {
      console.error('Venice API returned error:', data.error);
      // Return a default chat response instead of throwing
      return {
        content: "I apologize, but I'm having trouble processing that right now. Could you try rephrasing your request?",
        role: "assistant"
      };
    }

    // Handle missing or malformed response
    if (!data || !data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Unexpected API response format:', data);
      // Return a default chat response instead of throwing
      return {
        content: "I apologize, but I'm having trouble understanding that. Could you try again?",
        role: "assistant"
      };
    }

    // Return just the message content
    return data.choices[0].message;
  } catch (error) {
    console.error('Venice API Error:', error);
    // Return a default chat response instead of throwing
    return {
      content: "I apologize, but I'm having technical difficulties. Please try again in a moment.",
      role: "assistant"
    };
  }
}

export async function extractTextFromImage(imageFile) {
  // Convert image to base64
  const base64Image = await fileToBase64(imageFile);

  const options = {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${VENICE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-vision",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              image: base64Image
            },
            {
              type: "text",
              text: "Please extract and summarize the text from this image, focusing on any betting information."
            }
          ]
        }
      ],
      max_tokens: 500
    })
  };

  try {
    const response = await fetch('https://api.venice.ai/api/v1/chat/completions', options);
    const data = await response.json();
    
    // Handle API errors
    if (data.error) {
      console.error('Venice API returned error:', data.error);
      return {
        content: "I apologize, but I couldn't process the image. Could you try uploading it again?",
        role: "assistant"
      };
    }

    // Handle missing or malformed response
    if (!data || !data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Unexpected API response format:', data);
      return {
        content: "I apologize, but I couldn't read the image properly. Could you try a clearer image?",
        role: "assistant"
      };
    }

    return data.choices[0].message;
  } catch (error) {
    console.error('Venice API Error:', error);
    return {
        content: "I apologize, but I'm having trouble processing images right now. Please try again later.",
        role: "assistant"
    };
  }
}

async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = error => reject(error);
  });
} 


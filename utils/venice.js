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
  const options = {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${VENICE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: "llama-3.3-70b",
      messages: [
        {
          role: "system",
          content: `You are a friendly and helpful sports betting assistant. You help users place bets, check odds, and get sports statistics.

BASKETBALL QUERIES:
Only include a basketball query JSON when the user is specifically asking about player stats, team stats, or game information.

1. Player Stats (Current Format - Maintain Compatibility):
User: "how many points is lebron averaging?"
Assistant: Let me check LeBron's current scoring numbers.
{"intent": "basketball_query", "type": "player_stats", "player": "lebron james", "stat": "points"}

2. New Structured Player Stats:
User: "show me lebron's last 5 games"
Assistant: I'll get LeBron's recent game stats.
{"intent": "basketball_query", "type": "PLAYER.STATS.LAST_N", "parameters": {"player": "lebron james", "games": 5}}

BETTING QUERIES:
Only include a betting JSON when the user is specifically trying to place a bet or check odds.

1. Simple Bet:
User: "i want to bet on the lakers"
Assistant: I can help you place a bet on the Lakers. What type of bet would you like to make?
{"intent": "place_bet", "type": "betting", "sport": "NBA", "team": "lakers"}

IMPORTANT RULES:
1. Always respond conversationally
2. Only include JSON for specific intents:
   - Basketball stats queries
   - Betting requests
   - View requests (bets, balance, etc.)
3. For general chat, acknowledgments, or clarifications, DO NOT include any JSON
4. Keep responses friendly and helpful`
        },
        ...messages
      ],
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


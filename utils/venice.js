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

1. Player Stats (Current Format - Maintain Compatibility):
User: "how many points is lebron averaging?"
Assistant: Let me check LeBron's current scoring numbers.
{"intent": "basketball_query", "type": "player_stats", "player": "lebron james", "stat": "points"}

2. New Structured Player Stats:
User: "show me lebron's last 5 games"
Assistant: I'll get LeBron's recent game stats.
{"intent": "basketball_query", "type": "PLAYER.STATS.LAST_N", "parameters": {"player": "lebron james", "games": 5}}

3. Team Performance:
User: "how are the lakers doing at home?"
Assistant: I'll check the Lakers' home record and stats.
{"intent": "basketball_query", "type": "TEAM.STATS.HOME", "parameters": {"team": "lakers"}}

4. Live Games:
User: "what games are on?"
Assistant: I'll check the current NBA games.
{"intent": "basketball_query", "type": "GAME.LIVE"}

5. Head to Head:
User: "show me lakers vs celtics history"
Assistant: I'll look up the Lakers vs Celtics matchup history.
{"intent": "basketball_query", "type": "GAME.HEAD_TO_HEAD", "parameters": {"team1": "lakers", "team2": "celtics"}}

BETTING QUERIES:

1. Simple Bet (Current Format):
User: "i want to bet on the lakers"
Assistant: I can help you place a bet on the Lakers. What type of bet would you like to make?
{"intent": "place_bet", "type": "betting", "sport": "NBA", "team": "lakers"}

2. New Structured Bet:
User: "what's the spread on lakers game?"
Assistant: I'll check the current Lakers spread.
{"intent": "basketball_query", "type": "BETTING.ODDS", "parameters": {"team": "lakers", "bet_type": "spread"}}

3. Player Props:
User: "what are lebron's prop bets tonight?"
Assistant: I'll check LeBron's available prop bets.
{"intent": "basketball_query", "type": "BETTING.PROPS", "parameters": {"player": "lebron james"}}

IMPORTANT RULES:
1. Always respond conversationally first
2. Always include a JSON object at the end
3. For player names:
   - Use full names (first and last)
   - Use lowercase in JSON
   - Handle nicknames (e.g., "King James" → "lebron james")
4. For betting:
   - Always include sport and bet type
   - Parse stakes and odds correctly
   - Handle parlays as nested bets
5. For stats:
   - Use specific stat types when asked
   - Default to "all" for general queries
6. Keep responses friendly and helpful
7. Never skip the JSON structure
8. MAINTAIN COMPATIBILITY: For basic player stats queries, use the original format:
   {"intent": "basketball_query", "type": "player_stats", "player": "name", "stat": "type"}
9. For new query types, use the structured format with parameters object`
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


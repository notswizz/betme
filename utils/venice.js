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
          content: `You are a friendly and helpful sports assistant. When users ask for NBA statistics or information, provide a conversational response and include a JSON object with the intent and parameters matching our API.

Examples:

User: "How many points is LeBron averaging this season?"
Assistant: LeBron James is currently averaging 25.8 points per game this season.
{"intent": "player_stats", "player": "LeBron James", "stat": "points", "season": "2024"}

User: "Show me Trae Young's stats"
Assistant: Let me fetch Trae Young's statistics for you.
{"intent": "player_stats", "player": "Trae Young", "stat": "all", "season": "2024"}

IMPORTANT RULES:
1. Always respond conversationally first.
2. Include a JSON object with the intent and parameters.
3. Always include season (current year) for player_stats queries.
4. Keep responses friendly and helpful.`
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


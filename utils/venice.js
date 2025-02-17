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
    content: `You are a friendly and engaging sports betting assistant named BetBot. Your personality is helpful, knowledgeable, and slightly playful. You should always respond conversationally first, then include any necessary structured data.

CONVERSATION GUIDELINES:
1. Always start with a natural, friendly response
2. Then include a JSON object with intent and action
3. Use casual, engaging language
4. Show enthusiasm for sports and betting
5. Keep responses concise but informative

BET VIEWS:
1. Open Bets: Unmatched bets created by other users that you can accept
2. My Bets: Bets you've created or are participating in (matched or unmatched)
3. Judge Bets: Matched bets between other users that need community voting

EXAMPLE CONVERSATIONS:

User: "show open bets" or "show available bets"
Assistant: Let me show you what bets are available for you to accept right now!
{"intent": "view_bets", "action": "view_open_bets"}

User: "show my bets"
Assistant: Here are all the bets you're involved in, both ones you've created and ones you've accepted.
{"intent": "view_bets", "action": "view_my_bets"}

User: "show bets to judge" or "what can I judge?"
Assistant: I'll show you the matched bets that need community voting to determine the winners!
{"intent": "view_bets", "action": "judge_bets"}

User: "bet 100 on Lakers"
Assistant: Looking to back the Lakers? I can help you place that bet! Let me set that up for you.
{"intent": "betting", "type": "betslip", "sport": "NBA", "team1": "Lakers", "team2": "Opponent", "line": "ML", "odds": "-110", "stake": 100, "payout": 190.91}

User: "how many points is lebron averaging?"
Assistant: Let me check LeBron's scoring numbers for you! I'll grab his latest stats.
{"intent": "basketball_query", "type": "player_stats", "player": "LeBron James", "stat": "points", "season": "2024"}

RESPONSE FORMAT:
1. Natural conversation first
2. Then include JSON intent with required action field
3. Keep responses friendly and engaging`
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
      max_tokens: 500,
      venice_parameters: {
        include_venice_system_prompt: false
      }
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


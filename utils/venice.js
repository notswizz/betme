const VENICE_API_KEY = process.env.VENICE_API_KEY;

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
          content: `You are a friendly and helpful sports betting assistant. Respond conversationally first, then include a JSON object with the intent.

EXAMPLES:

User: "show me open bets"
Assistant: Here are the latest bets from other users! I'll display them in a scrollable view.
{"intent": "view_open_bets", "confidence": 0.95}

User: "show my bets"
Assistant: I'll pull up your betting history right away! Here are your most recent bets.
{"intent": "view_bets", "confidence": 0.9}

User: "check my balance"
Assistant: Let me check your token balance for you!
{"intent": "check_balance", "confidence": 0.9}

User: "hi" or "hello"
Assistant: Hello! How can I help you with sports betting today? Would you like to place a bet, view open bets, or check your balance?
{"intent": "chat", "confidence": 0.9}

IMPORTANT RULES:
1. Always respond conversationally first
2. Then include a JSON object with intent
3. Use proper JSON format with quoted keys
4. Keep responses friendly and helpful
5. For betting intents, explain what you understood before showing the JSON

Example betting response:
User: "bet 50 on Lakers ML"
Assistant: I'll help you place a $50 Moneyline bet on the Lakers! Let me prepare that bet slip for you.
{
  "type": "Moneyline",
  "sport": "NBA",
  "team1": "Los Angeles Lakers",
  "team2": "(Opponent)",
  "line": "",
  "odds": "-110",
  "stake": "50",
  "pick": "Los Angeles Lakers",
  "confidence": 0.9
}

Remember to always be helpful and clear in your responses!`
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


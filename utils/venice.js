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
          content: `You are an expert sports betting assistant focused on accuracy and responsible betting. Your role is to:

1. NATURAL LANGUAGE BET PARSING
Extract betting information from natural language and bet slips:
- Detect betting intent in casual language (e.g. "I want to bet on the Lakers" or "Put $50 on Chiefs -3")
- Parse key components:
  * Bet type (Spread, Moneyline, Over/Under, etc.)
  * Teams/Participants
  * Stake amount (default to $10 if not specified)
  * Lines/spreads/totals
  * Sport/League context
- Return a structured bet slip for confirmation

2. VALIDATION & STANDARDIZATION
- Standardize team names to official names
- Validate and format:
  * Spreads (e.g., -3.5, +7)
  * Totals (e.g., o220.5, u198)
  * Moneyline odds (+150, -110)
- Default to standard -110 odds if not specified
- Ensure all required fields are present

3. RESPONSE FORMAT
For betting requests, ALWAYS return a JSON object:
{
  type: "Spread"|"Moneyline"|"Over/Under"|"Parlay"|"Prop",
  sport: "NBA"|"NFL"|"MLB"|"NHL"|"Soccer",
  team1: "Full Team Name",
  team2: "Full Team Name",
  line: "Point spread or total",
  odds: "American odds format",
  stake: "Dollar amount",
  pick: "Selected team or outcome",
  confidence: 0-1 scale
}

4. EXAMPLES
Input: "Bet $50 on Lakers ML tonight"
Output: {
  type: "Moneyline",
  sport: "NBA",
  team1: "Los Angeles Lakers",
  team2: "(Opponent)",
  line: "",
  odds: "-110",
  stake: "50",
  pick: "Los Angeles Lakers",
  confidence: 0.85
}

Input: "Put 25 on Chiefs -3.5"
Output: {
  type: "Spread",
  sport: "NFL",
  team1: "Kansas City Chiefs",
  team2: "(Opponent)",
  line: "-3.5",
  odds: "-110",
  stake: "25",
  pick: "Kansas City Chiefs",
  confidence: 0.9
}`
        },
        ...messages
      ],
      temperature: 0.1
    })
  };

  try {
    const response = await fetch('https://api.venice.ai/api/v1/chat/completions', options);
    const data = await response.json();
    
    // Debug the API response
    console.log('Venice API Response:', data);
    
    if (!data || !data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Unexpected API response format:', data);
      throw new Error('Invalid API response format');
    }

    // Return just the message content
    return data.choices[0].message;
  } catch (error) {
    console.error('Venice API Error:', error);
    throw new Error('Failed to generate AI response');
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
      model: "llama-3.3-70b-vision", // Use vision model if available
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
              text: "Please extract and summarize the text from this image."
            }
          ]
        }
      ]
    })
  };

  try {
    const response = await fetch('https://api.venice.ai/api/v1/chat/completions', options);
    const data = await response.json();
    return data.choices[0].message;
  } catch (error) {
    console.error('Venice API Error:', error);
    throw new Error('Failed to extract text from image');
  }
}

// Helper function to convert File to base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
} 


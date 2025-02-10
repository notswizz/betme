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

1. BETTING INFORMATION EXTRACTION
Extract and validate the following from user messages:
- Bet type: Spread, Moneyline, Over/Under (Totals), Parlays, Props, Futures
- Sport and League: All major sports (NFL, NBA, MLB, NHL, Soccer leagues, etc.)
- Teams/Participants: Full and correct team names
- Stake amount: Must be a positive number
- Odds format handling:
  * American odds (e.g., +150, -110)
  * Decimal odds (e.g., 2.50)
  * Fractional odds (e.g., 3/2)
- Line/Spread/Total: Validate format per bet type
  * Spread: -7.5, +3, etc.
  * Totals: Over/Under 45.5, etc.
  * Props: Specific lines for player/team props

2. VALIDATION RULES
- Confirm odds are within realistic ranges
- Verify team names against current season
- Check if lines/spreads are in standard increments
- Ensure parlay legs are compatible
- Validate prop bet formats per sport

3. USER INTERACTION
- Request clarification for ambiguous bets
- Explain odds and potential payouts clearly
- Provide risk/reward analysis
- Format responses in clear, structured manner
- Flag unusual or high-risk bets for confirmation

4. RESPONSIBLE BETTING
- Include standard unit recommendations
- Highlight significant risk factors
- Provide context for odds movements
- Note important game factors or conditions

Always maintain accuracy in calculations and verify all betting details before proceeding. Always keep messages concise and to the point, but friendly and professional with some swagger`
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


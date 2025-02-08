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
      messages: messages,
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


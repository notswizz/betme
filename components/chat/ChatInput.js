import { useState } from 'react';
import ImageUpload from './ImageUpload';
import { extractText } from '@/utils/tesseract';
import { generateAIResponse } from '@/utils/venice';
import { FaCamera } from 'react-icons/fa';

export default function ChatInput({ onSubmit, isLoading }) {
  const [message, setMessage] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    // Create message object
    const messageObject = {
      role: 'user',
      type: 'text',
      content: message.trim()
    };
    
    // Debug logging
    console.log('Submitting message:', messageObject);
    
    onSubmit(messageObject);
    setMessage('');
  };

  const handleImageUpload = async (file) => {
    try {
      setProcessing(true);
      const imageUrl = URL.createObjectURL(file);
      
      // Show image preview
      onSubmit({
        role: 'user',
        type: 'image',
        imageUrl,
        content: 'Analyzing bet slip...'
      });

      // 1. Extract text using Tesseract
      const extractedText = await extractText(file);
      console.log('Extracted Text:', extractedText);
      
      if (extractedText) {
        // 2. Use Venice AI to analyze the extracted text
        const aiResponse = await generateAIResponse([
          {
            role: "system",
            content: "You are a sports betting expert. Extract betting information from text and return a JSON object after your explanation. Always format your response as a natural language explanation followed by a single JSON object."
          },
          {
            role: "user",
            content: `Extract betting information from this text and return a JSON object with these fields:
{
  "type": "Spread"|"Moneyline"|"Over/Under"|"Parlay"|"Prop"|"Future",
  "sport": "NBA"|"NFL"|"MLB"|"NHL"|"Soccer"|"UFC"|"Boxing"|"Tennis"|"Golf"|"E-Sports",
  "team1": "first team name",
  "team2": "second team name",
  "line": "point spread/total",
  "odds": "odds number",
  "pick": "selected team",
  "confidence": 0-1
}

Text: ${extractedText}`
          }
        ]);

        // Log the AI response for debugging
        console.log('AI Response:', aiResponse);

        // Clean and parse the response
        const cleanAndParseJSON = (content) => {
          if (typeof content !== 'string') return null;
          
          // Find the last occurrence of a JSON object in the text
          const jsonMatch = content.match(/\{(?:[^{}]|(\{[^{}]*\}))*\}/g);
          if (!jsonMatch) return null;
          
          // Get the last JSON object (most likely to be the bet data)
          const lastJson = jsonMatch[jsonMatch.length - 1];
          
          // Attempt to parse the JSON
          try {
            return JSON.parse(lastJson);
          } catch (e) {
            console.error('JSON Parse Error:', e);
            console.log('Failed to parse:', lastJson);
            return {
              type: 'UNKNOWN',
              sport: 'Unknown',
              team1: '',
              team2: '',
              line: '',
              odds: '-110',
              pick: '',
              confidence: 0
            };
          }
        };

        const aiData = cleanAndParseJSON(aiResponse.content) || {
          type: 'UNKNOWN',
          sport: 'Unknown',
          team1: '',
          team2: '',
          line: '',
          odds: '-110',
          pick: '',
          confidence: 0
        };
        
        console.log('Cleaned AI Data:', aiData);

        // Create bet slip with AI-extracted data
        const betSlipData = {
          role: 'assistant',
          type: 'betslip',
          content: {
            type: aiData.type || 'Spread',
            sport: aiData.sport || 'NFL',
            team1: aiData.team1 || '',
            team2: aiData.team2 || '',
            line: aiData.line || '',
            odds: aiData.odds || '-110',
            pick: aiData.pick || '',
            stake: '10',
            payout: calculatePayout(10, aiData.odds || -110).toFixed(2)
          }
        };

        onSubmit(betSlipData);
      }
    } catch (error) {
      console.error('Error processing image:', error);
      onSubmit({
        role: 'assistant',
        type: 'text',
        content: 'Sorry, I had trouble processing that image. Please try again or enter the bet details manually.'
      });
    } finally {
      setProcessing(false);
    }
  };

  // Helper function to calculate payout
  function calculatePayout(stake, odds) {
    const numOdds = parseInt(odds);
    if (numOdds > 0) {
      return stake + (stake * numOdds) / 100;
    } else if (numOdds < 0) {
      return stake + (stake * 100) / Math.abs(numOdds);
    }
    return stake;
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center space-x-2">
      <ImageUpload 
        onUpload={handleImageUpload}
        disabled={isLoading || processing}
        className="p-2 text-gray-400 hover:text-gray-300 transition-colors"
      >
        <FaCamera className="w-5 h-5" />
      </ImageUpload>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={processing ? "Processing image..." : "Send a message"}
        disabled={isLoading || processing}
        className="flex-1 bg-gray-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {message.trim() && (
        <button
          type="submit"
          disabled={isLoading}
          className="p-2 text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50"
        >
          <svg className="w-5 h-5 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      )}
    </form>
  );
}
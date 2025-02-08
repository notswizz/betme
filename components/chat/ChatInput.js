import { useState } from 'react';
import ImageUpload from './ImageUpload';
import { extractText } from '@/utils/tesseract';
import { generateAIResponse } from '@/utils/venice';

export default function ChatInput({ onSendMessage, disabled }) {
  const [message, setMessage] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    onSendMessage(message);
    setMessage('');
  };

  const handleImageUpload = async (file) => {
    try {
      setProcessing(true);
      const imageUrl = URL.createObjectURL(file);
      
      // Show image preview
      onSendMessage({
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
            content: "You are a sports betting expert. Extract betting information from text and return ONLY a JSON object. Focus on identifying the sport and bet type. Do not include markdown formatting or backticks."
          },
          {
            role: "user",
            content: `Extract this bet slip data into a clean JSON object:
{
  type: "Spread"|"Moneyline"|"Over/Under"|"Parlay"|"Prop"|"Future",
  sport: "NBA"|"NFL"|"MLB"|"NHL"|"Soccer"|"UFC"|"Boxing"|"Tennis"|"Golf"|"E-Sports",
  team1: first team name,
  team2: second team name,
  line: point spread/total,
  odds: odds number,
  pick: selected team,
  confidence: 0-1
}

Text: ${extractedText}`
          }
        ]);

        // Log the AI response for debugging
        console.log('AI Response:', aiResponse);

        // Clean and parse the response
        const cleanAndParseJSON = (content) => {
          if (typeof content !== 'string') return content;
          
          // Remove markdown formatting if present
          let cleaned = content.replace(/```json\n|\n```|```/g, '');
          
          // Attempt to parse the cleaned JSON
          try {
            return JSON.parse(cleaned);
          } catch (e) {
            console.error('JSON Parse Error:', e);
            console.log('Failed to parse:', cleaned);
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

        const aiData = cleanAndParseJSON(aiResponse.content);
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
            payout: calculatePayout(10, aiData.odds || -110).toFixed(2),
            notes: `Confidence: ${(aiData.confidence * 100).toFixed(0)}%\nExtracted: ${extractedText}`
          }
        };

        onSendMessage(betSlipData);
      }
    } catch (error) {
      console.error('Error processing image:', error);
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
    <div className="border-t p-2 md:p-4 bg-gradient-to-b from-white to-gray-50 shadow-inner">
      <form onSubmit={handleSubmit} className="flex items-center gap-2 md:gap-3 max-w-4xl mx-auto">
        <ImageUpload 
          onUpload={handleImageUpload}
          disabled={disabled || processing}
          className="hover:opacity-80 transition-opacity"
        />
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={processing ? "Processing..." : "Type a message..."}
          disabled={disabled || processing}
          className="flex-1 p-2 md:p-3 text-sm md:text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 text-gray-600 shadow-sm"
        />
        <button
          type="submit"
          disabled={disabled || processing || !message.trim()}
          className={`px-4 md:px-6 py-2 md:py-3 rounded-xl font-medium ${
            disabled || processing || !message.trim()
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:scale-95'
          } text-white transition-all duration-200 shadow-md hover:shadow-lg text-sm md:text-base`}
        >
          Send
        </button>
      </form>
    </div>
  );
}
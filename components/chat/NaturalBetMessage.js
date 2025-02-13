import { useState, useEffect } from 'react';
import { BetSlipMessage } from './BetSlipMessage';
import ActionConfirmation from './ActionConfirmation';

export default function NaturalBetMessage({ gameState, onSubmit, initialData }) {
  const [betDescription, setBetDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [betSlip, setBetSlip] = useState(initialData || null);
  const [betProcessed, setBetProcessed] = useState(false);
  
  // New state for manual team override
  const [customTeam1, setCustomTeam1] = useState((initialData && initialData.team1) || (gameState && gameState.team1) || '');
  const [customTeam2, setCustomTeam2] = useState((initialData && initialData.team2) || (gameState && gameState.team2) || '');

  // Prevent re-updating betSlip after bet is processed
  useEffect(() => {
    if (!betProcessed && initialData) {
      setBetSlip(initialData);
    }
  }, [initialData, betProcessed]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/bet/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          betDescription,
          team1: customTeam1,
          team2: customTeam2,
          gameState
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to process bet');
      }

      if (data.type === 'betslip') {
        // Ensure bet slip data includes team names if missing
        const betData = data.content;
        betData.team1 = betData.team1 || customTeam1;
        betData.team2 = betData.team2 || customTeam2;
        setBetSlip(betData);
      } else {
        onSubmit(data);
        setBetDescription('');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBetConfirm = async (betData) => {
    console.log('handleBetConfirm triggered with betData:', betData);
    // Extract bet details from the confirmation message if available
    const details = betData.action ? betData.action : betData;

    // Create the formatted bet data object using custom team values if provided
    const formattedBetData = {
      name: 'place_bet',
      // If details.type is 'betslip', convert it to 'Moneyline'; otherwise, use details.type
      type: details.type && details.type.toLowerCase() !== 'betslip' ? details.type : 'Moneyline',
      sport: details.sport || 'NBA',
      team1: customTeam1.trim() !== '' ? customTeam1 : details.team1,
      team2: customTeam2.trim() !== '' ? customTeam2 : details.team2,
      line: details.line || 'ML',
      odds: details.odds ? parseInt(details.odds) : -110,
      stake: parseFloat(details.stake) || 100,
      payout: parseFloat(details.payout) || 190.91,
      pick: details.pick || (customTeam1.trim() !== '' ? customTeam1 : details.team1)
    };

    // Validate that team1 and team2 are provided
    if (!formattedBetData.team1 || !formattedBetData.team2) {
      setError('Both teams are required');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/chat/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          messages: [],
          confirmAction: formattedBetData,
          conversationId: null, // adjust if you have a conversation ID
          gameState
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to place bet');
      }
      console.log('Bet placed successfully, server response:', data);
      // Instead of calling onSubmit, we simply set betProcessed to true so ChatContainer doesn't re-trigger confirmation
      setBetProcessed(true);
    } catch (err) {
      setError(err.message);
    }
    setBetSlip(null);
  };

  if (betProcessed) {
    return (
      <div className="w-full p-6 bg-gradient-to-br from-green-700 to-green-500 rounded-xl shadow-2xl text-center text-white">
        <div className="flex items-center justify-center mb-4">
          <div className="w-14 h-14 flex items-center justify-center bg-green-400 rounded-full mr-3">
            <span className="text-3xl">✔</span>
          </div>
          <h2 className="text-3xl font-bold">Bet Placed!</h2>
        </div>
        <p className="text-lg">Your bet has been successfully processed. Good luck!</p>
      </div>
    );
  }

  if (betSlip) {
    return <BetSlipMessage initialData={betSlip} onSubmit={handleBetConfirm} />;
  }

  return (
    <div className="w-full bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-3 border border-gray-700/50">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-2">
          <textarea
            value={betDescription}
            onChange={(e) => setBetDescription(e.target.value)}
            placeholder="Describe your bet in natural language (e.g., 'I want to bet 100 tokens on the Lakers to win')"
            className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 min-h-[80px] text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            disabled={loading}
          />
        </div>

        {/* New inputs for team names if missing */}
        {((!customTeam1 || !customTeam2) || (customTeam1.trim() === '' || customTeam2.trim() === '')) && (
          <div className="space-y-2">
            <input 
              type="text"
              value={customTeam1}
              onChange={(e) => setCustomTeam1(e.target.value)}
              placeholder="Enter Team 1"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 text-sm"
            />
            <input 
              type="text"
              value={customTeam2}
              onChange={(e) => setCustomTeam2(e.target.value)}
              placeholder="Enter Team 2"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 text-sm"
            />
          </div>
        )}
  
        {error && (
          <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-2">
            {error}
          </div>
        )}
  
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || !betDescription.trim()}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium text-sm disabled:opacity-50 hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
          >
            {loading ? 'Processing...' : 'Process Bet'}
          </button>
        </div>
      </form>
    </div>
  );
} 
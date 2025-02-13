import { useState } from 'react';
import { BetSlipMessage } from './BetSlipMessage';
import ActionConfirmation from './ActionConfirmation';

export default function NaturalBetMessage({ gameState, onSubmit, initialData }) {
  const [betDescription, setBetDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [betSlip, setBetSlip] = useState(initialData || null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/bet/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          betDescription,
          gameState
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process bet');
      }

      if (data.type === 'betslip') {
        setBetSlip(data.content);
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

  const handleBetConfirm = (betData) => {
    // Ensure all required fields are present and properly formatted
    const formattedBetData = {
      name: 'place_bet',
      type: betData.type || 'betslip',
      sport: betData.sport || 'NBA',
      team1: betData.team1,
      team2: betData.team2,
      line: betData.line || 'ML',
      odds: betData.odds || '-110',
      stake: parseFloat(betData.stake) || 100,
      payout: parseFloat(betData.payout) || 190.91,
      pick: betData.pick || betData.team1
    };

    onSubmit({
      role: 'assistant',
      type: 'text',
      requiresConfirmation: true,
      content: `Would you like to place this bet?\n` +
              `${formattedBetData.team1} vs ${formattedBetData.team2}\n` +
              `${formattedBetData.type} bet @ ${formattedBetData.odds}\n` +
              `Line: ${formattedBetData.line}\n` +
              `Stake: $${formattedBetData.stake}\n` +
              `Potential Payout: $${formattedBetData.payout}`,
      action: formattedBetData
    });
    setBetSlip(null);
  };

  if (initialData || betSlip) {
    return <BetSlipMessage initialData={initialData || betSlip} onSubmit={handleBetConfirm} />;
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
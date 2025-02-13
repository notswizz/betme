import { useState } from 'react';

export default function NaturalBetInput({ gameState, onBetConfirmed }) {
  const [betDescription, setBetDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [betStructure, setBetStructure] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setBetStructure(null);

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

      setBetStructure(data);
      setShowConfirmation(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/bets/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(betStructure),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to place bet');
      }

      // Reset form
      setBetDescription('');
      setBetStructure(null);
      setShowConfirmation(false);

      // Notify parent
      if (onBetConfirmed) {
        onBetConfirmed(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Natural Language Input */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm text-gray-300">Describe Your Bet</label>
          <textarea
            value={betDescription}
            onChange={(e) => setBetDescription(e.target.value)}
            placeholder="Example: I want to bet 100 tokens on the Lakers to win against the Warriors"
            className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 min-h-[100px]"
            disabled={loading}
          />
        </div>

        {error && (
          <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-2">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !betDescription.trim()}
          className="w-full py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium text-sm disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Process Bet'}
        </button>
      </form>

      {/* Bet Confirmation Modal */}
      {showConfirmation && betStructure && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 w-full max-w-md mx-4 border border-gray-700/50">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Confirm Bet</h3>
              <button 
                onClick={() => setShowConfirmation(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Bet Details */}
              <div className="space-y-2">
                <div className="bg-gray-800/50 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Type:</span>
                    <span className="text-white font-medium">{betStructure.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Sport:</span>
                    <span className="text-white font-medium">{betStructure.sport}</span>
                  </div>
                  {betStructure.team1 && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Team 1:</span>
                      <span className="text-white font-medium">{betStructure.team1}</span>
                    </div>
                  )}
                  {betStructure.team2 && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Team 2:</span>
                      <span className="text-white font-medium">{betStructure.team2}</span>
                    </div>
                  )}
                  {betStructure.line && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Line:</span>
                      <span className="text-white font-medium">{betStructure.line}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-400">Odds:</span>
                    <span className="text-white font-medium">{betStructure.odds}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Stake:</span>
                    <span className="text-white font-medium">{betStructure.stake} tokens</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Potential Payout:</span>
                    <span className="text-white font-medium">{betStructure.payout} tokens</span>
                  </div>
                </div>

                {betStructure.explanation && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                    <p className="text-sm text-gray-300">{betStructure.explanation}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="flex-1 py-2 rounded-lg bg-gray-700 text-white font-medium text-sm hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  className="flex-1 py-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white font-medium text-sm disabled:opacity-50"
                >
                  {loading ? 'Confirming...' : 'Confirm Bet'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
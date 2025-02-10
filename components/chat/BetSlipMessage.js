import { useState, useEffect, useCallback, memo } from 'react';
import { submitBet } from '../../utils/betSubmission';

const SPORTS = [
  "NBA", "NFL", "MLB", "NHL", "Soccer", "UFC", "Boxing", "Tennis", "Golf", "E-Sports"
];

const BET_TYPES = [
  "Spread", "Moneyline", "Over/Under", "Parlay", "Prop", "Future"
];

const BetSlipMessage = memo(function BetSlipMessage({ initialData, onSubmit }) {
  const [betSlip, setBetSlip] = useState(() => ({
    type: initialData.type || 'Spread',
    sport: initialData.sport || 'NFL',
    team1: initialData.team1 || '',
    team2: initialData.team2 || '',
    line: initialData.type === 'Moneyline' ? 'ML' : (initialData.line || ''),
    odds: initialData.odds || '-110',
    pick: initialData.pick || initialData.team1 || '',
    stake: parseFloat(initialData.stake || '10'),
    payout: parseFloat(initialData.payout || '19.52')
  }));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState(null);

  // Memoize the payout calculation
  const calculatePayout = useCallback((stake, odds) => {
    if (!stake || !odds) return 0;
    const numStake = parseFloat(stake);
    const numOdds = parseInt(odds.replace(/[^-\d]/g, ''));
    
    if (isNaN(numStake) || isNaN(numOdds)) return 0;
    
    if (numOdds > 0) {
      return numStake + (numStake * numOdds) / 100;
    } else if (numOdds < 0) {
      return numStake + (numStake * 100) / Math.abs(numOdds);
    }
    return numStake;
  }, []);

  // Update payout when stake or odds change
  useEffect(() => {
    const payout = calculatePayout(betSlip.stake, betSlip.odds);
    if (payout !== parseFloat(betSlip.payout)) {
      setBetSlip(prev => ({
        ...prev,
        payout: payout.toFixed(2)
      }));
    }
  }, [betSlip.stake, betSlip.odds, calculatePayout]);

  // Handle bet type changes
  const handleBetTypeChange = useCallback((type) => {
    setBetSlip(prev => ({
      ...prev,
      type,
      line: type === 'Moneyline' ? 'ML' : prev.line
    }));
  }, []);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (isSubmitting || isSubmitted) return;

    // Validate required fields
    if (!betSlip.team1 || !betSlip.team2) {
      setError('Both teams are required');
      return;
    }

    if (!betSlip.odds) {
      setError('Odds are required');
      return;
    }

    // Ensure line is set for Moneyline bets
    const submissionData = {
      ...betSlip,
      line: betSlip.type === 'Moneyline' ? 'ML' : betSlip.line
    };

    setIsSubmitting(true);
    
    try {
      const confirmationMessage = {
        role: 'assistant',
        type: 'text',
        requiresConfirmation: true,
        content: `Would you like to place this bet?\n` +
                `${submissionData.team1} vs ${submissionData.team2}\n` +
                `${submissionData.type} bet @ ${submissionData.odds}\n` +
                `Line: ${submissionData.line}\n` +
                `Stake: $${submissionData.stake}\n` +
                `Potential Payout: $${submissionData.payout}`,
        action: {
          name: 'place_bet',
          ...submissionData,
          status: 'pending'
        }
      };

      onSubmit(confirmationMessage);
      setIsSubmitted(true);
    } catch (err) {
      console.error('Error submitting bet:', err);
      setError('Failed to submit bet. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [betSlip, isSubmitting, isSubmitted, onSubmit]);

  // If bet is submitted, show a nice success message
  if (isSubmitted) {
    return (
      <div className="w-full p-4 rounded-xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50">
        <div className="flex items-start gap-4">
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <div className="absolute inset-0 rounded-xl bg-green-500/20 animate-ping"></div>
              <span className="text-xl relative">✓</span>
            </div>
          </div>
          <div className="flex-1">
            <div className="text-base font-semibold text-green-400 mb-2">Bet Submitted!</div>
            <div className="bg-gray-900/50 rounded-lg p-3 space-y-2 text-sm border border-gray-700/30">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <div className="text-gray-300">
                  <span className="text-gray-500 font-medium">{betSlip.type}</span>
                  <span className="text-gray-600 mx-2">•</span>
                  <span className="text-blue-400">{betSlip.sport}</span>
                </div>
                <div className="text-gray-300 text-right">
                  <span className="text-gray-500">Line:</span> {betSlip.line}
                </div>
                <div className="col-span-2 text-gray-300 py-1 border-y border-gray-700/30 my-1">
                  <div className="flex items-center justify-between">
                    <span>{betSlip.team1}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800/50 border border-gray-700/30">VS</span>
                    <span>{betSlip.team2}</span>
                  </div>
                </div>
                <div className="text-gray-300">
                  <span className="text-gray-500">Odds:</span> {betSlip.odds}
                </div>
                <div className="text-gray-300 text-right">
                  <span className="text-gray-500">Stake:</span> ${parseFloat(betSlip.stake).toFixed(2)}
                </div>
              </div>
              <div className="pt-2 mt-2 border-t border-gray-700/30">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Potential Payout:</span>
                  <span className="text-lg font-semibold text-green-400">${parseFloat(betSlip.payout).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-2xl p-3 w-full md:max-w-md mx-auto border border-gray-700">
      <div className="text-sm font-bold text-center mb-3 bg-gradient-to-r from-blue-600 to-blue-400 text-white py-2 rounded-xl flex items-center justify-center gap-2 shadow-lg">
        🎯 <span className="tracking-wide">PLACE BET</span>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Type, Sport, and Line Row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-1">
            <select
              value={betSlip.type}
              onChange={(e) => handleBetTypeChange(e.target.value)}
              className="block w-full rounded-lg bg-gray-800/50 border-gray-700/50 text-white p-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              <option value="">Type</option>
              {BET_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div className="col-span-1">
            <select
              value={betSlip.sport}
              onChange={(e) => setBetSlip({...betSlip, sport: e.target.value})}
              className="block w-full rounded-lg bg-gray-800/50 border-gray-700/50 text-white p-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              <option value="">Sport</option>
              {SPORTS.map(sport => (
                <option key={sport} value={sport}>{sport}</option>
              ))}
            </select>
          </div>
          <div className="col-span-1">
            <input
              type="text"
              value={betSlip.type === 'Moneyline' ? 'ML' : betSlip.line}
              onChange={(e) => setBetSlip({...betSlip, line: e.target.value})}
              disabled={betSlip.type === 'Moneyline'}
              placeholder="Line"
              className={`block w-full rounded-lg bg-gray-800/50 border-gray-700/50 text-white p-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                betSlip.type === 'Moneyline' ? 'cursor-not-allowed opacity-75' : ''
              }`}
            />
          </div>
        </div>

        {/* Teams Row */}
        <div className="grid grid-cols-[1fr,auto,1fr] gap-2 items-center">
          <input
            type="text"
            value={betSlip.team1}
            onChange={(e) => setBetSlip({...betSlip, team1: e.target.value})}
            placeholder="Team 1"
            className="block w-full rounded-lg bg-gray-800/50 border-gray-700/50 text-white p-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          />
          <span className="text-xs font-bold text-gray-400 bg-gray-900/50 px-2 py-1 rounded-full border border-gray-700/50">
            VS
          </span>
          <input
            type="text"
            value={betSlip.team2}
            onChange={(e) => setBetSlip({...betSlip, team2: e.target.value})}
            placeholder="Team 2"
            className="block w-full rounded-lg bg-gray-800/50 border-gray-700/50 text-white p-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          />
        </div>

        {/* Odds, Stake, Payout Row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-1">
            <input
              type="text"
              value={betSlip.odds}
              onChange={(e) => setBetSlip({...betSlip, odds: e.target.value})}
              placeholder="Odds (-110)"
              className="block w-full rounded-lg bg-gray-800/50 border-gray-700/50 text-white p-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          <div className="col-span-1">
            <input
              type="number"
              value={betSlip.stake}
              onChange={(e) => setBetSlip({...betSlip, stake: e.target.value})}
              placeholder="Stake ($)"
              className="block w-full rounded-lg bg-gray-800/50 border-gray-700/50 text-white p-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          <div className="col-span-1">
            <input
              type="text"
              value={`$${betSlip.payout}`}
              disabled
              placeholder="Payout"
              className="block w-full rounded-lg bg-gray-900/50 border-gray-700/50 text-green-400 p-1.5 text-sm font-medium cursor-not-allowed"
            />
          </div>
        </div>

        {error && (
          <div className="text-red-400 text-xs text-center">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-2 bg-gradient-to-r ${
            isSubmitting 
              ? 'from-gray-500 to-gray-400 cursor-not-allowed'
              : 'from-green-500 to-green-400 hover:from-green-400 hover:to-green-300'
          } text-white text-sm rounded-lg transform hover:scale-[1.02] transition-all duration-200 font-medium shadow-lg hover:shadow-xl`}
        >
          {isSubmitting ? 'Placing Bet...' : 'Place Bet'}
        </button>
      </form>
    </div>
  );
});

export { BetSlipMessage };
export default BetSlipMessage; 
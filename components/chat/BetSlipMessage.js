import { useState, useEffect, useCallback, memo } from 'react';
import { submitBet } from '../../utils/betSubmission';
import BetConfirmation from '../messages/BetConfirmation';
import BetSuccessMessage from '../messages/BetSuccessMessage';

const SPORTS = [
  "NBA", "NFL", "MLB", "NHL", "Soccer", "UFC", "Boxing", "Tennis", "Golf", "E-Sports"
];

const BET_TYPES = [
  "Moneyline", "Spread", "Total", "Parlay", "Prop", "Future"
];

const BetSlipMessage = memo(function BetSlipMessage({ initialData, onSubmit }) {
  console.log('BetSlipMessage rendered with initialData:', initialData);
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
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState(null);

  // Update internal state whenever initialData changes
  useEffect(() => {
    setBetSlip({
      type: initialData.type || 'Spread',
      sport: initialData.sport || 'NFL',
      team1: initialData.team1 || '',
      team2: initialData.team2 || '',
      line: initialData.type === 'Moneyline' ? 'ML' : (initialData.line || ''),
      odds: initialData.odds || '-110',
      pick: initialData.pick || initialData.team1 || '',
      stake: parseFloat(initialData.stake || '10'),
      payout: parseFloat(initialData.payout || '19.52')
    });
    console.log('BetSlipMessage internal state updated to:', {
      type: initialData.type || 'Spread',
      sport: initialData.sport || 'NFL',
      team1: initialData.team1 || '',
      team2: initialData.team2 || '',
      line: initialData.type === 'Moneyline' ? 'ML' : (initialData.line || ''),
      odds: initialData.odds || '-110',
      pick: initialData.pick || initialData.team1 || '',
      stake: parseFloat(initialData.stake || '10'),
      payout: parseFloat(initialData.payout || '19.52')
    });
  }, [initialData]);

  // Memoize the payout calculation
  const calculatePayout = useCallback((stake, odds) => {
    if (!stake || !odds) return 0;
    const numStake = parseFloat(stake);
    
    // Handle odds whether it's a string or number
    let numOdds;
    if (typeof odds === 'string') {
      numOdds = parseInt(odds.replace(/[^-\d]/g, ''));
    } else {
      numOdds = parseInt(odds);
    }
    
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
    console.log('BetSlipMessage: handleSubmit triggered with betSlip:', betSlip);
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

    if (!betSlip.stake || parseFloat(betSlip.stake) <= 0) {
      setError('Valid stake amount is required');
      return;
    }

    // Create the action object with all required fields
    const action = {
      name: 'place_bet',
      type: betSlip.type === 'Spread' ? 'Spread' : 
            betSlip.type === 'Moneyline' ? 'Moneyline' :
            betSlip.type === 'Over/Under' ? 'Total' :
            'Moneyline',
      sport: betSlip.sport || 'NBA',
      team1: betSlip.team1.trim(),
      team2: betSlip.team2.trim(),
      line: betSlip.type === 'Moneyline' ? 'ML' : (betSlip.line || '0'),
      odds: typeof betSlip.odds === 'string' ? betSlip.odds.trim() : String(betSlip.odds).trim(),
      stake: parseFloat(betSlip.stake),
      payout: parseFloat(betSlip.payout),
      pick: (betSlip.pick || betSlip.team1).trim()
    };

    setIsSubmitting(true);
    
    try {
      // Show confirmation instead of submitting directly
      setConfirmationMessage({
        action,
        type: 'text',
        content: `Would you like to place this bet?\n` +
                `${action.team1} vs ${action.team2}\n` +
                `${action.type} bet @ ${action.odds}\n` +
                `Line: ${action.line}\n` +
                `Stake: $${action.stake}\n` +
                `Potential Payout: $${action.payout}`
      });
      setShowConfirmation(true);
      setIsSubmitting(false);
    } catch (err) {
      console.error('Error submitting bet:', err);
      setError('Failed to submit bet. Please try again.');
      setIsSubmitting(false);
    }
  }, [betSlip, isSubmitting, isSubmitted]);

  const handleConfirmBet = useCallback((confirmedAction) => {
    setIsSubmitting(true);
    try {
      // Just update the UI state without sending a chat message
      setIsSubmitted(true);
      setShowConfirmation(false);
      // The parent component will handle showing BetSuccessMessage
      onSubmit({
        action: confirmedAction,
        type: 'bet_placed'  // Just send the action without chat content
      });
    } catch (err) {
      console.error('Error confirming bet:', err);
      setError('Failed to confirm bet. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [onSubmit]);

  const handleCancelBet = useCallback(() => {
    setShowConfirmation(false);
    setConfirmationMessage(null);
    setIsSubmitting(false);
    setError(null);
  }, []);

  // If showing confirmation, render BetConfirmation component
  if (showConfirmation && confirmationMessage) {
    return (
      <BetConfirmation 
        message={confirmationMessage}
        onConfirm={handleConfirmBet}
        onCancel={handleCancelBet}
      />
    );
  }

  // If bet is submitted, show BetSuccessMessage
  if (isSubmitted && confirmationMessage?.action) {
    return <BetSuccessMessage bet={confirmationMessage.action} />;
  }

  return (
    <div className="w-full max-w-[min(95vw,500px)] mx-auto px-2 py-2 sm:px-4 sm:py-4">
      <div className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-2xl p-3 sm:p-6 border border-gray-700/30 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 hidden sm:block"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-green-500/10 rounded-full blur-3xl -ml-16 -mb-16 hidden sm:block"></div>
        
        <div className="relative">
          <div className="mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-green-400">Place Your Bet</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-5">
            {/* Teams Row - Moved to top for better mobile UX */}
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr,auto,1fr] gap-2 items-center">
                <input
                  type="text"
                  value={betSlip.team1}
                  onChange={(e) => setBetSlip({...betSlip, team1: e.target.value})}
                  placeholder="Winner"
                  className="block w-full rounded-lg sm:rounded-xl bg-gray-800/40 border border-gray-700/30 text-white px-2 py-2 sm:px-3 sm:py-2.5 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200 hover:bg-gray-800/60"
                />
                <span className="text-[10px] sm:text-xs font-bold text-gray-400 bg-gray-800/80 px-2 sm:px-4 py-1 sm:py-2 rounded-full border border-gray-700/30 shadow-inner">
                  VS
                </span>
                <input
                  type="text"
                  value={betSlip.team2}
                  onChange={(e) => setBetSlip({...betSlip, team2: e.target.value})}
                  placeholder="Loser"
                  className="block w-full rounded-lg sm:rounded-xl bg-gray-800/40 border border-gray-700/30 text-white px-2 py-2 sm:px-3 sm:py-2.5 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200 hover:bg-gray-800/60"
                />
              </div>
            </div>

            {/* Type and Sport Row */}
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <div className="space-y-1 sm:space-y-2">
                <label className="block text-xs sm:text-sm font-medium text-gray-300">Type</label>
                <select
                  value={betSlip.type}
                  onChange={(e) => handleBetTypeChange(e.target.value)}
                  className="block w-full rounded-lg sm:rounded-xl bg-gray-800/40 border border-gray-700/30 text-white px-2 py-1.5 sm:px-3 sm:py-2.5 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200 appearance-none hover:bg-gray-800/60"
                >
                  {BET_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1 sm:space-y-2">
                <label className="block text-xs sm:text-sm font-medium text-gray-300">Sport</label>
                <select
                  value={betSlip.sport}
                  onChange={(e) => setBetSlip({...betSlip, sport: e.target.value})}
                  className="block w-full rounded-lg sm:rounded-xl bg-gray-800/40 border border-gray-700/30 text-white px-2 py-1.5 sm:px-3 sm:py-2.5 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200 appearance-none hover:bg-gray-800/60"
                >
                  {SPORTS.map(sport => (
                    <option key={sport} value={sport}>{sport}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Line, Odds, Stake Row */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div className="space-y-1 sm:space-y-2">
                <label className="block text-xs sm:text-sm font-medium text-gray-300">Line</label>
                <input
                  type="text"
                  value={betSlip.type === 'Moneyline' ? 'ML' : betSlip.line}
                  onChange={(e) => setBetSlip({...betSlip, line: e.target.value})}
                  disabled={betSlip.type === 'Moneyline'}
                  placeholder="-7.5"
                  className={`block w-full rounded-lg sm:rounded-xl bg-gray-800/40 border border-gray-700/30 text-white px-2 py-1.5 sm:px-3 sm:py-2.5 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200 hover:bg-gray-800/60 ${
                    betSlip.type === 'Moneyline' ? 'cursor-not-allowed opacity-75' : ''
                  }`}
                />
              </div>
              <div className="space-y-1 sm:space-y-2">
                <label className="block text-xs sm:text-sm font-medium text-gray-300">Odds</label>
                <input
                  type="text"
                  value={betSlip.odds}
                  onChange={(e) => setBetSlip({...betSlip, odds: e.target.value})}
                  placeholder="-110"
                  className="block w-full rounded-lg sm:rounded-xl bg-gray-800/40 border border-gray-700/30 text-white px-2 py-1.5 sm:px-3 sm:py-2.5 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200 hover:bg-gray-800/60"
                />
              </div>
              <div className="space-y-1 sm:space-y-2">
                <label className="block text-xs sm:text-sm font-medium text-gray-300">Stake</label>
                <input
                  type="number"
                  value={betSlip.stake}
                  onChange={(e) => setBetSlip({...betSlip, stake: e.target.value})}
                  placeholder="0.00"
                  className="block w-full rounded-lg sm:rounded-xl bg-gray-800/40 border border-gray-700/30 text-white px-2 py-1.5 sm:px-3 sm:py-2.5 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200 hover:bg-gray-800/60"
                />
              </div>
            </div>

            {/* Payout Display */}
            <div className="space-y-1 sm:space-y-2">
              <label className="block text-xs sm:text-sm font-medium text-gray-300">Potential Payout</label>
              <div className="block w-full rounded-lg sm:rounded-xl bg-gray-900/70 border border-gray-700/30 text-green-400 px-2 py-1.5 sm:px-3 sm:py-2.5 text-sm font-medium shadow-inner">
                ${betSlip.payout}
              </div>
            </div>

            {error && (
              <div className="text-red-400 text-xs sm:text-sm bg-red-500/10 py-2 px-3 rounded-lg border border-red-500/20 flex items-center gap-2">
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 sm:py-4 bg-gradient-to-r ${
                isSubmitting 
                  ? 'from-gray-500 to-gray-400 cursor-not-allowed opacity-75'
                  : 'from-blue-600 to-green-500 hover:from-blue-500 hover:to-green-400 active:scale-[0.98]'
              } text-white text-sm rounded-xl transform transition-all duration-200 font-medium shadow-lg hover:shadow-xl relative overflow-hidden group`}
            >
              <div className="absolute inset-0 bg-white/20 group-hover:bg-transparent transition-colors duration-200"></div>
              <div className="flex items-center justify-center gap-2">
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Place Bet</span>
                  </>
                )}
              </div>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
});

export { BetSlipMessage };
export default BetSlipMessage; 
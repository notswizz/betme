import { useState, useEffect } from 'react';
import { submitBet } from '../../utils/betSubmission';

const SPORTS = [
  "NBA", "NFL", "MLB", "NHL", "Soccer", "UFC", "Boxing", "Tennis", "Golf", "E-Sports"
];

const BET_TYPES = [
  "Spread", "Moneyline", "Over/Under", "Parlay", "Prop", "Future"
];

export default function BetSlipMessage({ initialData, onSubmit }) {
  const [betSlip, setBetSlip] = useState(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await submitBet(betSlip);
      onSubmit({
        role: 'assistant',
        type: 'bet_success',
        content: {
          _id: result.bet._id,
          type: result.bet.type,
          sport: result.bet.sport,
          team1: result.bet.team1,
          team2: result.bet.team2,
          line: result.bet.line,
          odds: result.bet.odds,
          stake: result.bet.stake,
          payout: result.bet.payout
        }
      });
    } catch (err) {
      setError('Failed to place bet. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate potential payout whenever stake or odds change
  useEffect(() => {
    const calculatePayout = () => {
      const stake = parseFloat(betSlip.stake) || 0;
      const odds = parseInt(betSlip.odds) || 0;
      
      let payout = stake;
      if (odds > 0) {
        payout += (stake * odds) / 100;
      } else if (odds < 0) {
        payout += (stake * 100) / Math.abs(odds);
      }
      
      setBetSlip(prev => ({
        ...prev,
        payout: payout.toFixed(2)
      }));
    };

    calculatePayout();
  }, [betSlip.stake, betSlip.odds]);

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-2xl p-3 md:p-4 w-full md:max-w-md mx-auto border border-gray-700">
      <div className="text-lg font-bold text-center mb-4 bg-gradient-to-r from-blue-600 to-blue-400 text-white py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg">
        🎯 <span className="tracking-wide">BET SLIP</span>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type and Sport Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="relative group">
            <label className="block text-xs font-medium text-blue-400 mb-1">Type</label>
            <select
              value={betSlip.type}
              onChange={(e) => setBetSlip({...betSlip, type: e.target.value})}
              className="block w-full rounded-lg bg-gray-800 border-gray-600 text-white p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              <option value="">Select Type</option>
              {BET_TYPES.map(type => (
                <option 
                  key={type} 
                  value={type}
                  selected={betSlip.type === type}
                >
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div className="relative group">
            <label className="block text-xs font-medium text-blue-400 mb-1">Sport</label>
            <select
              value={betSlip.sport}
              onChange={(e) => setBetSlip({...betSlip, sport: e.target.value})}
              className="block w-full rounded-lg bg-gray-800 border-gray-600 text-white p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              <option value="">Select Sport</option>
              {SPORTS.map(sport => (
                <option 
                  key={sport} 
                  value={sport}
                  selected={betSlip.sport === sport}
                >
                  {sport}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Matchup Section */}
        <div className="bg-gray-800 rounded-lg p-3">
          <h3 className="font-semibold text-blue-400 mb-2 text-xs uppercase tracking-wider">Matchup</h3>
          <div className="grid grid-cols-[1fr,auto,1fr] gap-2 items-center">
            <input
              type="text"
              value={betSlip.team1}
              onChange={(e) => setBetSlip({...betSlip, team1: e.target.value})}
              placeholder="Team 1"
              className="block w-full rounded-lg bg-gray-900 border-gray-700 text-white p-2 text-sm md:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-500"
            />
            <span className="text-xs font-bold text-gray-400 bg-gray-900 px-3 py-1 rounded-full border border-gray-700">
              VS
            </span>
            <input
              type="text"
              value={betSlip.team2}
              onChange={(e) => setBetSlip({...betSlip, team2: e.target.value})}
              placeholder="Team 2"
              className="block w-full rounded-lg bg-gray-900 border-gray-700 text-white p-2 text-sm md:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-500"
            />
          </div>
        </div>

        {/* Line, Odds, Stake, Payout Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-blue-400 mb-1">Line</label>
            <input
              type="text"
              value={betSlip.line}
              onChange={(e) => setBetSlip({...betSlip, line: e.target.value})}
              className="block w-full rounded-lg bg-gray-800 border-gray-600 text-white p-2 text-sm md:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-blue-400 mb-1">Odds</label>
            <input
              type="text"
              value={betSlip.odds}
              onChange={(e) => setBetSlip({...betSlip, odds: e.target.value})}
              className="block w-full rounded-lg bg-gray-800 border-gray-600 text-white p-2 text-sm md:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="-110"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-blue-400 mb-1">Stake ($)</label>
            <input
              type="number"
              value={betSlip.stake}
              onChange={(e) => setBetSlip({...betSlip, stake: e.target.value})}
              className="block w-full rounded-lg bg-gray-800 border-gray-600 text-white p-2 text-sm md:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-blue-400 mb-1">Potential Payout ($)</label>
            <input
              type="text"
              value={betSlip.payout}
              disabled
              className="block w-full rounded-lg bg-gray-900 border-gray-700 text-green-400 p-2 text-sm font-medium cursor-not-allowed"
            />
          </div>
        </div>

        {error && (
          <div className="text-red-400 text-sm mt-2 text-center">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-3 bg-gradient-to-r ${
            isSubmitting 
              ? 'from-gray-500 to-gray-400 cursor-not-allowed'
              : 'from-green-500 to-green-400 hover:from-green-400 hover:to-green-300'
          } text-white rounded-lg transform hover:scale-[1.02] transition-all duration-200 font-medium shadow-lg hover:shadow-xl`}
        >
          {isSubmitting ? 'Placing Bet...' : 'Place Bet'}
        </button>
      </form>
    </div>
  );
} 
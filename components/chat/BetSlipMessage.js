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

  // Add effect to handle Moneyline bet type
  useEffect(() => {
    if (betSlip.type === 'Moneyline') {
      setBetSlip(prev => ({
        ...prev,
        line: 'ML'
      }));
    }
  }, [betSlip.type]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await submitBet(betSlip);
      if (result.success) {
        // Send the bet data directly instead of the success message
        onSubmit({
          name: 'place_bet',
          type: betSlip.type,
          sport: betSlip.sport,
          team1: betSlip.team1,
          team2: betSlip.team2,
          line: betSlip.line,
          odds: betSlip.odds,
          stake: parseFloat(betSlip.stake),
          payout: betSlip.payout
        });
      } else {
        setError('Failed to place bet. Please try again.');
      }
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
              onChange={(e) => setBetSlip({...betSlip, type: e.target.value})}
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
              value={betSlip.line}
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
} 
import { memo } from 'react';

const BetConfirmation = memo(function BetConfirmation({ message, onConfirm, onCancel }) {
  if (!message?.action) {
    console.error('Invalid message format:', message);
    return null;
  }

  const action = message.action;
  console.log('Rendering bet confirmation with action:', action);

  // Format the action data for submission
  const handleConfirm = () => {
    const formattedAction = {
      name: 'place_bet',
      type: action.type,
      sport: action.sport,
      team1: action.team1,
      team2: action.team2,
      line: action.type === 'Moneyline' ? 'ML' : action.line,
      odds: action.odds?.toString(),
      pick: action.pick || action.team1,
      stake: parseFloat(action.stake),
      payout: parseFloat(action.payout),
      status: 'pending'
    };
    console.log('Confirming bet with formatted action:', formattedAction);
    onConfirm(formattedAction);
  };

  // Format display values
  const displayLine = action.type === 'Moneyline' ? 'ML' : action.line;
  const displayOdds = action.odds?.toString() || '-110';
  const displayStake = parseFloat(action.stake).toFixed(2);
  const displayPayout = parseFloat(action.payout).toFixed(2);

  return (
    <div className="w-full max-w-md mx-auto mb-4">
      <div className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 rounded-2xl shadow-xl border border-gray-700/50 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600/20 to-blue-500/20 border-b border-gray-700/50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <span className="text-xl">🎯</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Confirm Your Bet</h3>
                <p className="text-sm text-gray-400">{action.sport} - {action.type}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-400">Ready to Place</span>
            </div>
          </div>
        </div>

        {/* Bet Details */}
        <div className="p-4 space-y-4">
          {/* Matchup */}
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/30">
            <div className="text-xs text-gray-500 mb-2">Matchup</div>
            <div className="grid grid-cols-[1fr,auto,1fr] gap-3 items-center">
              <div className="text-center">
                <div className="text-sm font-medium text-white mb-1">{action.team1}</div>
                {action.pick === action.team1 && (
                  <div className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full inline-block">
                    Your Pick
                  </div>
                )}
              </div>
              <div className="text-xs font-bold text-gray-500">VS</div>
              <div className="text-center">
                <div className="text-sm font-medium text-white mb-1">{action.team2}</div>
                {action.pick === action.team2 && (
                  <div className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full inline-block">
                    Your Pick
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bet Details Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/30">
              <div className="text-xs text-gray-500 mb-1">Line</div>
              <div className="text-sm font-medium text-white">{displayLine}</div>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/30">
              <div className="text-xs text-gray-500 mb-1">Odds</div>
              <div className="text-sm font-medium text-white">{displayOdds}</div>
            </div>
          </div>

          {/* Stake and Payout */}
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/30">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">Your Stake</div>
                <div className="text-lg font-semibold text-white">
                  ${displayStake}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Potential Payout</div>
                <div className="text-lg font-semibold text-green-400">
                  ${displayPayout}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-gray-900/50 border-t border-gray-700/50">
          <div className="flex gap-3">
            <button
              onClick={handleConfirm}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-400 
                       hover:from-green-400 hover:to-green-300 text-white rounded-xl 
                       font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02] 
                       transition-all duration-200"
            >
              Confirm Bet
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2.5 bg-gradient-to-r from-gray-700 to-gray-600 
                       hover:from-gray-600 hover:to-gray-500 text-white rounded-xl 
                       font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02] 
                       transition-all duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default BetConfirmation; 
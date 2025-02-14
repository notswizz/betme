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
    if (!formattedAction.team1 || !formattedAction.team2) {
      console.error('Missing team information in confirmation:', formattedAction);
      return;
    }
    console.log('Confirming bet with formatted action:', formattedAction);
    onConfirm(formattedAction);
  };

  // Format display values
  const displayLine = action.type === 'Moneyline' ? 'ML' : action.line;
  const displayOdds = action.odds?.toString() || '-110';
  const displayStake = parseFloat(action.stake).toFixed(2);
  const displayPayout = parseFloat(action.payout).toFixed(2);

  return (
    <div className="w-full max-w-[min(95vw,500px)] mx-auto px-2 py-2 sm:px-4 sm:py-4">
      <div className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-2xl p-3 sm:p-6 border border-gray-700/30 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 hidden sm:block"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-green-500/10 rounded-full blur-3xl -ml-16 -mb-16 hidden sm:block"></div>
        
        <div className="relative">
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <span className="text-base sm:text-xl">🎯</span>
              </div>
              <div>
                <h2 className="text-lg sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-green-400">Confirm Your Bet</h2>
                <p className="text-xs sm:text-sm text-gray-400">{action.sport} - {action.type}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 sm:space-y-5">
            {/* Teams Row */}
            <div className="bg-gray-800/40 rounded-xl p-3 sm:p-4 border border-gray-700/30">
              <div className="grid grid-cols-[1fr,auto,1fr] gap-2 sm:gap-3 items-center">
                <div className="text-center">
                  <div className="text-sm font-medium text-white mb-1">{action.team1}</div>
                  {action.pick === action.team1 && (
                    <div className="text-[10px] sm:text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full inline-block">
                      Your Pick
                    </div>
                  )}
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-gray-400 bg-gray-800/80 px-2 sm:px-4 py-1 sm:py-2 rounded-full border border-gray-700/30 shadow-inner">
                  VS
                </span>
                <div className="text-center">
                  <div className="text-sm font-medium text-white mb-1">{action.team2}</div>
                  {action.pick === action.team2 && (
                    <div className="text-[10px] sm:text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full inline-block">
                      Your Pick
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bet Details Grid */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div className="bg-gray-800/40 rounded-xl p-2 sm:p-3 border border-gray-700/30">
                <div className="text-[10px] sm:text-xs text-gray-400 mb-1">Line</div>
                <div className="text-sm font-medium text-white">{displayLine}</div>
              </div>
              <div className="bg-gray-800/40 rounded-xl p-2 sm:p-3 border border-gray-700/30">
                <div className="text-[10px] sm:text-xs text-gray-400 mb-1">Odds</div>
                <div className="text-sm font-medium text-white">{displayOdds}</div>
              </div>
              <div className="bg-gray-800/40 rounded-xl p-2 sm:p-3 border border-gray-700/30">
                <div className="text-[10px] sm:text-xs text-gray-400 mb-1">Stake</div>
                <div className="text-sm font-medium text-white">${displayStake}</div>
              </div>
            </div>

            {/* Payout Display */}
            <div className="bg-gray-800/40 rounded-xl p-3 sm:p-4 border border-gray-700/30">
              <div className="text-[10px] sm:text-xs text-gray-400 mb-1">Potential Payout</div>
              <div className="text-base sm:text-lg font-semibold text-green-400">${displayPayout}</div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 sm:gap-4 pt-2">
              <button
                onClick={handleConfirm}
                className="w-full py-3 sm:py-4 bg-gradient-to-r from-green-600 to-green-500 
                         hover:from-green-500 hover:to-green-400 active:scale-[0.98]
                         text-white text-sm rounded-xl transform transition-all duration-200 
                         font-medium shadow-lg hover:shadow-xl relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-white/20 group-hover:bg-transparent transition-colors duration-200"></div>
                <span>Confirm Bet</span>
              </button>
              <button
                onClick={onCancel}
                className="w-full py-3 sm:py-4 bg-gradient-to-r from-gray-700 to-gray-600 
                         hover:from-gray-600 hover:to-gray-500 active:scale-[0.98]
                         text-white text-sm rounded-xl transform transition-all duration-200 
                         font-medium shadow-lg hover:shadow-xl relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-white/20 group-hover:bg-transparent transition-colors duration-200"></div>
                <span>Cancel</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default BetConfirmation; 
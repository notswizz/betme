import MessageAvatar from './MessageAvatar';

export default function BetSuccessMessage({ betData }) {
  return (
    <div className="mb-3">
      <div className={`flex justify-start items-start space-x-3`}>
        <div className="relative w-9 h-9 rounded-xl shadow-lg group">
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500 animate-gradient-x opacity-90"></div>
          <div className="absolute inset-[1px] rounded-xl bg-gray-900 flex items-center justify-center">
            <div className="relative flex items-center justify-center">
              <div className="absolute w-7 h-7 bg-blue-500/20 rounded-xl animate-ping"></div>
              <span className="relative text-sm font-medium bg-gradient-to-r from-blue-400 to-blue-300 text-transparent bg-clip-text">AI</span>
            </div>
          </div>
        </div>
        <div className="flex-1 max-w-[320px] rounded-2xl bg-gradient-to-br from-gray-800/80 to-gray-900/80 text-white shadow-xl border border-gray-700/30 backdrop-blur-sm">
          <div className="p-3 space-y-2">
            {/* Success Header */}
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-400">Bet Placed Successfully!</span>
            </div>
            
            {/* Main Bet Info */}
            <div className="bg-gray-900/50 rounded-xl p-3 space-y-3 border border-gray-800">
              {/* Type & Sport */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-gray-500">Type</div>
                  <div className="text-sm font-medium text-white">{betData.type}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Sport</div>
                  <div className="text-sm font-medium text-white">{betData.sport}</div>
                </div>
              </div>

              {/* Matchup */}
              <div>
                <div className="text-xs text-gray-500">Matchup</div>
                <div className="text-sm font-medium text-white flex items-center gap-2">
                  <span>{betData.team1}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 border border-gray-700">VS</span>
                  <span>{betData.team2}</span>
                </div>
              </div>

              {/* Line & Odds */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-gray-500">Line</div>
                  <div className="text-sm font-medium text-white">{betData.line}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Odds</div>
                  <div className="text-sm font-medium text-white">{betData.odds}</div>
                </div>
              </div>
            </div>

            {/* Stake & Payout */}
            <div className="bg-gray-900/50 rounded-xl p-3 border border-gray-800">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500">Your Stake</div>
                  <div className="text-base font-semibold text-white">${parseFloat(betData.stake).toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Potential Payout</div>
                  <div className="text-base font-semibold text-green-400">${betData.payout}</div>
                </div>
              </div>
            </div>

            {/* Bet ID */}
            <div className="bg-gray-900/50 rounded-xl p-2 border border-gray-800">
              <div className="text-xs text-gray-500">Bet ID</div>
              <div className="font-mono text-xs text-gray-400 truncate">{betData._id}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
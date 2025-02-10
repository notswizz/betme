export default function OpenBetsView({ bets, onPlaceSimilar }) {
  // Parse the stringified bets if needed
  const parsedBets = typeof bets === 'string' ? JSON.parse(bets) : bets;
  
  if (!parsedBets || parsedBets.length === 0) {
    return (
      <div className="w-full p-6 rounded-2xl bg-gradient-to-br from-gray-900/95 to-gray-800/95 text-center">
        <div className="text-gray-400">No open bets available right now</div>
        <div className="text-sm text-gray-500 mt-2">Check back later for new bets</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[95vw] mx-auto">
      {/* Scrollable Container */}
      <div className="overflow-x-auto pb-4 scrollbar-hide">
        <div className="flex gap-3" style={{ minWidth: 'min-content' }}>
          {parsedBets.map((bet) => (
            <div 
              key={bet._id}
              className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-4 hover:from-gray-800/70 hover:to-gray-900/70 
                         transition-all duration-200 cursor-pointer group border border-gray-700/30 backdrop-blur-sm
                         w-[280px] flex-shrink-0 transform hover:scale-[1.02]"
            >
              {/* Sport & Type Badge */}
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-blue-400">{bet.sport}</span>
                </div>
                <div className="text-xs font-medium text-purple-400">
                  {bet.type}
                </div>
              </div>

              {/* Teams */}
              <div className="space-y-3 mb-4">
                {/* Team 1 */}
                <div className="flex items-center justify-between bg-black/20 p-2 rounded-lg">
                  <span className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">
                    {bet.team1}
                  </span>
                </div>
                
                {/* Team 2 */}
                <div className="flex items-center justify-between bg-black/20 p-2 rounded-lg">
                  <span className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">
                    {bet.team2}
                  </span>
                </div>
              </div>

              {/* Bet Details */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-black/20 p-2 rounded-lg">
                  <div className="text-xs text-gray-500">Line</div>
                  <div className="text-sm font-medium text-white">{bet.line || '-'}</div>
                </div>
                <div className="bg-black/20 p-2 rounded-lg">
                  <div className="text-xs text-gray-500">Odds</div>
                  <div className="text-sm font-medium text-white">{bet.odds}</div>
                </div>
                <div className="bg-black/20 p-2 rounded-lg">
                  <div className="text-xs text-gray-500">Stake</div>
                  <div className="text-sm font-medium text-white">${bet.stake}</div>
                </div>
                <div className="bg-black/20 p-2 rounded-lg">
                  <div className="text-xs text-gray-500">Payout</div>
                  <div className="text-sm font-medium text-green-400">${bet.payout}</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-[1fr,auto,1fr] gap-3 pt-3 border-t border-gray-700/30">
                {/* Bet Button */}
                <button 
                  onClick={() => onPlaceSimilar(bet)}
                  className="flex flex-col items-center justify-center p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 hover:from-blue-500/30 hover:to-blue-600/30 transition-all duration-300 group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-blue-400/10 to-blue-500/10 animate-gradient-x"></div>
                  <span className="text-xl mb-0.5 transform group-hover:scale-110 transition-transform duration-300">🎯</span>
                  <span className="text-[11px] font-medium text-blue-400 group-hover:text-blue-300">Bet</span>
                </button>

                {/* Time */}
                <div className="flex flex-col items-center justify-center px-3">
                  <span className="text-[10px] text-gray-500">{bet.formattedTime || new Date(bet.createdAt).toLocaleTimeString()}</span>
                </div>
                
                {/* Share Button */}
                <button 
                  onClick={() => navigator.clipboard.writeText(bet._id)}
                  className="flex flex-col items-center justify-center p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 hover:from-indigo-500/30 hover:to-purple-600/30 transition-all duration-300 group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-400/10 to-indigo-500/10 animate-gradient-x"></div>
                  <span className="text-xl mb-0.5 transform group-hover:scale-110 transition-transform duration-300">🔗</span>
                  <span className="text-[11px] font-medium text-indigo-400 group-hover:text-indigo-300">Share</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 
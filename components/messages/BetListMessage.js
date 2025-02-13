import { useState } from 'react';

export default function BetListMessage({ bets }) {
  if (!bets || bets.length === 0) {
    return (
      <div className="w-full p-4 rounded-xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50">
        <div className="text-gray-400 text-center">No bets found</div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3">
      <div className="text-sm font-bold text-center mb-3 bg-gradient-to-r from-blue-600 to-blue-400 text-white py-2 rounded-xl flex items-center justify-center gap-2 shadow-lg">
        🎲 <span className="tracking-wide">YOUR BETS</span>
      </div>
      
      {/* Horizontal scrolling container with snap scrolling */}
      <div className="w-full overflow-x-auto pb-4 scrollbar-hide">
        <div className="flex gap-3 snap-x snap-mandatory">
          {bets.map((bet) => (
            <div key={bet._id} className="snap-center flex-none w-[300px] first:ml-[calc((100%-300px)/2)] last:mr-[calc((100%-300px)/2)]">
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-3 border border-gray-700/50 h-full">
                <div className="space-y-3">
                  {/* Header with Type and Status */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-blue-400">{bet.type}</span>
                      <span className="text-gray-500">•</span>
                      <span className="text-sm text-gray-400">{bet.sport}</span>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      bet.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                      bet.status === 'won' ? 'bg-green-500/20 text-green-400' :
                      bet.status === 'lost' ? 'bg-red-500/20 text-red-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {bet.status.charAt(0).toUpperCase() + bet.status.slice(1)}
                    </div>
                  </div>

                  {/* Teams */}
                  <div className="bg-gray-900/50 rounded-lg p-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white">{bet.team1}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800/50 border border-gray-700/30">VS</span>
                      <span className="text-sm text-white">{bet.team2}</span>
                    </div>
                  </div>

                  {/* Bet Details */}
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="bg-gray-900/50 rounded-lg p-2">
                      <div className="text-xs text-gray-500">Line</div>
                      <div className="font-medium text-white">{bet.line}</div>
                    </div>
                    <div className="bg-gray-900/50 rounded-lg p-2">
                      <div className="text-xs text-gray-500">Odds</div>
                      <div className="font-medium text-white">{bet.odds}</div>
                    </div>
                    <div className="bg-gray-900/50 rounded-lg p-2">
                      <div className="text-xs text-gray-500">Stake</div>
                      <div className="font-medium text-white">${bet.stake}</div>
                    </div>
                  </div>

                  {/* Payout and Date */}
                  <div className="flex justify-between items-center pt-2 border-t border-gray-700/30">
                    <div className="text-xs text-gray-500">
                      {new Date(bet.createdAt).toLocaleDateString()} {new Date(bet.createdAt).toLocaleTimeString()}
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 mr-1">Potential Payout:</span>
                      <span className="text-sm font-semibold text-green-400">${bet.payout}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 
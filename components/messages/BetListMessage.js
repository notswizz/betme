import { useState } from 'react';

const BetListMessage = ({ bets, onAcceptBet, currentUserId }) => {
  const [acceptingBetId, setAcceptingBetId] = useState(null);

  // Parse bets if it's a string
  const parsedBets = typeof bets === 'string' ? JSON.parse(bets) : bets;

  const handleAcceptBet = async (bet) => {
    try {
      setAcceptingBetId(bet._id);
      await onAcceptBet(bet);
    } catch (error) {
      console.error('Error accepting bet:', error);
    } finally {
      setAcceptingBetId(null);
    }
  };

  if (!parsedBets || parsedBets.length === 0) {
    return (
      <div className="w-full p-4 rounded-xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50">
        <div className="text-gray-400 text-center">No bets found</div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="text-sm font-bold text-center mb-3 bg-gradient-to-r from-blue-600 to-blue-400 text-white py-2 rounded-xl flex items-center justify-center gap-2 shadow-lg">
        🎲 <span className="tracking-wide">OPEN BETS</span>
      </div>
      
      {/* Horizontal scrolling container with snap scrolling */}
      <div className="w-full overflow-x-auto pb-4 scrollbar-hide">
        <div className="flex gap-3 snap-x snap-mandatory">
          {parsedBets.map((bet) => (
            <div key={bet._id} className="snap-center flex-none w-[300px] first:ml-[calc((100%-300px)/2)] last:mr-[calc((100%-300px)/2)]">
              <div className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-xl p-4 border border-gray-700/30">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="text-sm font-medium text-gray-300">
                      <span className="text-blue-400">{bet.sport}</span>
                      <span className="mx-2">•</span>
                      <span className="text-gray-500">{bet.type}</span>
                    </div>
                    <div className="text-lg font-semibold text-white mt-1">
                      {bet.team1} vs {bet.team2}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400">Line: {bet.line}</div>
                    <div className="text-lg font-bold text-green-400">{bet.odds}</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm border-t border-gray-700/30 pt-3 mt-3">
                  <div>
                    <span className="text-gray-500">Stake:</span>
                    <span className="ml-2 text-white">${bet.stake}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-500">Payout:</span>
                    <span className="ml-2 text-green-400">${bet.payout}</span>
                  </div>
                  <div className="col-span-2 text-xs text-gray-500 text-right">
                    {bet.createdAt}
                  </div>
                </div>

                {bet.status === 'pending' && bet.userId !== currentUserId && (
                  <div className="mt-4">
                    <button
                      onClick={() => handleAcceptBet(bet)}
                      disabled={acceptingBetId === bet._id}
                      className={`w-full py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        acceptingBetId === bet._id
                          ? 'bg-gray-600 cursor-not-allowed'
                          : 'bg-gradient-to-r from-green-500 to-green-400 hover:from-green-400 hover:to-green-300 active:scale-[0.98]'
                      }`}
                    >
                      {acceptingBetId === bet._id ? 'Accepting...' : 'Accept Bet'}
                    </button>
                  </div>
                )}

                {bet.status !== 'pending' && (
                  <div className="mt-4 flex justify-end">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/20">
                      {bet.status.charAt(0).toUpperCase() + bet.status.slice(1)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BetListMessage; 
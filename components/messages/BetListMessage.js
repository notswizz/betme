import { useState } from 'react';

const BetListMessage = ({ bets, onAcceptBet, onCompleteBet, currentUserId, isMyBets, viewType }) => {
  const [acceptingBetId, setAcceptingBetId] = useState(null);
  const [completingBetId, setCompletingBetId] = useState(null);

  // Parse bets if it's a string
  const parsedBets = typeof bets === 'string' ? JSON.parse(bets) : bets;

  // Helper functions to determine bet status
  const isOpenBet = (bet) => bet.status === 'pending' && bet.userId !== currentUserId;
  const isMyBet = (bet) => bet.userId === currentUserId || bet.challengerId === currentUserId;
  const isJudgingBet = (bet) => (
    bet.status === 'voting' && 
    bet.challengerId === currentUserId &&
    !bet.votes?.some(v => v.userId === currentUserId)
  );

  // Filter bets based on view type
  const getFilteredBets = () => {
    switch (viewType) {
      case 'open':
        return parsedBets.filter(bet => isOpenBet(bet));
      case 'my':
        return parsedBets.filter(bet => isMyBet(bet));
      case 'judging':
        return parsedBets.filter(bet => isJudgingBet(bet));
      default:
        return parsedBets;
    }
  };

  const getViewTitle = () => {
    switch (viewType) {
      case 'open':
        return 'Open Bets';
      case 'my':
        return 'My Bets';
      case 'judging':
        return 'Bets to Judge';
      default:
        return 'All Bets';
    }
  };

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

  const handleCompleteBet = async (bet, team) => {
    try {
      setCompletingBetId(bet._id);
      await onCompleteBet(bet._id, team);
    } catch (error) {
      console.error('Error completing bet:', error);
    } finally {
      setCompletingBetId(null);
    }
  };

  const formatTimeLeft = (endTime) => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end - now;
    
    if (diff <= 0) return 'Voting ended';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m left`;
  };

  if (!parsedBets || parsedBets.length === 0) {
    return (
      <div className="w-full p-3 rounded-xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50">
        <div className="text-gray-400 text-center text-sm">
          {viewType === 'open' && 'No open bets available'}
          {viewType === 'my' && 'You have no active bets'}
          {viewType === 'judging' && 'No bets to judge'}
          {!viewType && 'No bets found'}
        </div>
      </div>
    );
  }

  const filteredBets = getFilteredBets();

  if (filteredBets.length === 0) {
    return (
      <div className="w-full p-3 rounded-xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50">
        <div className="text-gray-400 text-center text-sm">
          {viewType === 'open' && 'No open bets available'}
          {viewType === 'my' && 'You have no active bets'}
          {viewType === 'judging' && 'No bets to judge'}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full mx-auto mt-12 mb-6">
      <h2 className="text-xl font-semibold text-white mb-4 px-4">{getViewTitle()}</h2>
      {/* Horizontal scrolling container with snap scrolling */}
      <div className="relative w-full pt-2">
        <div className="overflow-x-auto overflow-y-visible scrollbar-hide">
          <div className="flex gap-3 snap-x snap-mandatory min-w-0 px-4 pb-4 pt-1 mx-auto max-w-[calc(100vw-2rem)]">
            {filteredBets.map((bet) => (
              <div key={bet._id} className="snap-center flex-none w-[280px] first:ml-0 pt-0.5">
                <div className="relative group">
                  {/* Animated border effect */}
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-xl opacity-30 group-hover:opacity-100 blur transition duration-500 group-hover:duration-200 animate-gradient-xy"></div>
                  
                  {/* Card content */}
                  <div className="relative bg-gradient-to-br from-gray-900/95 via-gray-900 to-gray-800/95 backdrop-blur-xl rounded-xl h-full">
                    {/* Top Section with Sport and Type */}
                    <div className="px-3 py-3 border-b border-gray-700/30 bg-gradient-to-r from-gray-800/80 via-gray-900/80 to-gray-800/80 rounded-t-xl flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                          <span className="text-blue-400 text-xs font-medium">{bet.sport}</span>
                        </div>
                        <span className="text-gray-600">•</span>
                        <span className="text-gray-500 text-xs">{bet.type}</span>
                      </div>
                      <div className="text-[10px] text-gray-500 bg-gray-800/50 px-1.5 py-0.5 rounded-full border border-gray-700/30">
                        {bet.createdAt}
                      </div>
                    </div>

                    {/* Main Content */}
                    <div className="p-4">
                      {/* Teams */}
                      <div className="relative">
                        <div className="space-y-2.5">
                          {viewType === 'judging' ? (
                            <>
                              <button
                                onClick={() => handleCompleteBet(bet, bet.team1)}
                                disabled={completingBetId === bet._id}
                                className="w-full flex items-center justify-between gap-3 bg-gray-800/30 p-2.5 rounded-lg border-2 border-green-500/30 hover:border-green-500/50 transition-colors"
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-white">
                                    {bet.team1}
                                  </div>
                                </div>
                                <div className="text-green-400 text-sm font-bold whitespace-nowrap px-2.5 py-1 rounded bg-green-500/10 border border-green-500/20">
                                  Select Winner
                                </div>
                              </button>
                              <button
                                onClick={() => handleCompleteBet(bet, bet.team2)}
                                disabled={completingBetId === bet._id}
                                className="w-full flex items-center justify-between gap-3 bg-gray-800/30 p-2.5 rounded-lg border-2 border-red-500/30 hover:border-red-500/50 transition-colors"
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-white">
                                    {bet.team2}
                                  </div>
                                </div>
                                <div className="text-red-400 text-sm font-bold whitespace-nowrap px-2.5 py-1 rounded bg-red-500/10 border border-red-500/20">
                                  Select Winner
                                </div>
                              </button>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center justify-between gap-3 bg-gray-800/30 p-2.5 rounded-lg border-2 border-green-500/30 group-hover:border-green-500/50 transition-colors">
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-white">
                                    {bet.team1}
                                  </div>
                                </div>
                                <div className="text-green-400 text-sm font-bold whitespace-nowrap px-2.5 py-1 rounded bg-green-500/10 border border-green-500/20">
                                  {bet.odds}
                                </div>
                              </div>
                              <div className="flex items-center justify-between gap-3 bg-gray-800/30 p-2.5 rounded-lg border-2 border-red-500/30 group-hover:border-red-500/50 transition-colors">
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-white">
                                    {bet.team2}
                                  </div>
                                </div>
                                <div className="text-xs text-blue-400 font-medium px-2.5 py-1 rounded bg-blue-500/10 border border-blue-500/20">
                                  Line: {bet.line === 'ML' ? 'ML' : 
                                    isNaN(bet.line) ? bet.line :
                                    parseFloat(bet.line) > 0 ? `+${bet.line}` : bet.line}
                                </div>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Stakes */}
                        <div className="mt-3.5 space-y-2">
                          <div className="flex items-center justify-between py-2.5 px-3.5 rounded-lg bg-gray-800/50 border border-gray-700/30">
                            <div>
                              <div className="text-gray-500 text-xs mb-0.5">Stake</div>
                              <div className="text-white font-semibold text-base">
                                ${bet.userId.toString() === currentUserId ? 
                                  bet.stake : 
                                  (bet.payout - bet.stake).toFixed(2)}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-gray-500 text-xs mb-0.5">Total Payout</div>
                              <div className="text-green-400 font-semibold text-base">${bet.payout}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Section */}
                    <div className="px-4 pb-4">
                      {bet.status === 'pending' && bet.userId !== currentUserId ? (
                        <button
                          onClick={() => handleAcceptBet(bet)}
                          disabled={acceptingBetId === bet._id}
                          className={`w-full py-1.5 rounded-lg text-xs font-medium transition-all duration-200 relative group overflow-hidden ${
                            acceptingBetId === bet._id
                              ? 'bg-gray-600 cursor-not-allowed'
                              : 'bg-gradient-to-r from-green-500 to-green-400 hover:from-green-400 hover:to-green-300 active:scale-[0.98]'
                          }`}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-x-[-50%] group-hover:translate-x-[50%]"></div>
                          {acceptingBetId === bet._id ? 'Accepting...' : 'Accept Bet'}
                        </button>
                      ) : (bet.status === 'matched' || bet.status === 'voting') && (bet.userId === currentUserId || bet.challengerId === currentUserId) ? (
                        <div className="space-y-2">
                          {bet.status === 'voting' && (
                            <div className="text-xs text-gray-400 text-center space-y-1">
                              <div>{formatTimeLeft(bet.votingEndsAt)}</div>
                              <div className="flex justify-center gap-2">
                                <span>{bet.team1}: {bet.votes?.filter(v => v.team === bet.team1).length || 0}</span>
                                <span>vs</span>
                                <span>{bet.team2}: {bet.votes?.filter(v => v.team === bet.team2).length || 0}</span>
                              </div>
                            </div>
                          )}
                          {(!bet.votes?.find(v => v.userId === currentUserId)) && (
                            <>
                              <div className="text-xs text-gray-400 text-center mb-1">Select Winner</div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleCompleteBet(bet, bet.team1)}
                                  disabled={completingBetId === bet._id}
                                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 relative group overflow-hidden ${
                                    completingBetId === bet._id
                                      ? 'bg-gray-600 cursor-not-allowed'
                                      : 'bg-gradient-to-r from-blue-500 to-blue-400 hover:from-blue-400 hover:to-blue-300 active:scale-[0.98]'
                                  }`}
                                >
                                  {bet.team1}
                                </button>
                                <button
                                  onClick={() => handleCompleteBet(bet, bet.team2)}
                                  disabled={completingBetId === bet._id}
                                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 relative group overflow-hidden ${
                                    completingBetId === bet._id
                                      ? 'bg-gray-600 cursor-not-allowed'
                                      : 'bg-gradient-to-r from-blue-500 to-blue-400 hover:from-blue-400 hover:to-blue-300 active:scale-[0.98]'
                                  }`}
                                >
                                  {bet.team2}
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ) : bet.status !== 'pending' && (
                        <div className="flex justify-end">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {bet.status.charAt(0).toUpperCase() + bet.status.slice(1)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BetListMessage; 
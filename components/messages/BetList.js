import React from 'react';

function BetCard({ bet, onAction }) {
  console.log('BetCard received bet:', bet);

  // Ensure flags are boolean values and properly set based on bet status
  const isMyBet = Boolean(bet.isMyBet);
  const canJudge = Boolean(bet.canJudge) && !isMyBet;
  const canAccept = Boolean(bet.canAccept) && !isMyBet;
  const isChallenger = Boolean(bet.isChallenger);

  // Determine which teams to show first based on perspective
  const [topTeam, bottomTeam] = isChallenger ? [bet.team2, bet.team1] : [bet.team1, bet.team2];
  const [topOdds, bottomLine] = isChallenger ? 
    [bet.line === 'ML' ? 'ML' : parseFloat(bet.line) > 0 ? `+${bet.line}` : bet.line, bet.odds] :
    [bet.odds, bet.line === 'ML' ? 'ML' : parseFloat(bet.line) > 0 ? `+${bet.line}` : bet.line];

  console.log('BetCard flags:', {
    betId: bet._id,
    status: bet.status,
    canJudge,
    canAccept,
    isMyBet,
    isChallenger,
    hasJudgeActions: !!bet.judgeActions,
    rawBet: bet
  });

  // Helper functions now use the boolean values
  const shouldShowJudgeActions = () => canJudge && bet.status === 'matched';
  const shouldShowAcceptButton = () => canAccept && bet.status === 'pending';

  const handleAcceptClick = () => {
    console.log('Accept button clicked for bet:', bet._id);
    if (onAction) {
      onAction('accept_bet', { betId: bet._id });
    }
  };

  const handleChooseWinner = (winner) => {
    console.log('Choose winner clicked:', { betId: bet._id, winner });
    if (onAction) {
      onAction('choose_winner', { betId: bet._id, winner });
    }
  };

  const handleGameNotOver = () => {
    console.log('Game not over clicked for bet:', bet._id);
    if (onAction) {
      onAction('game_not_over', { betId: bet._id });
    }
  };

  // Calculate the stake to display
  const displayStake = canAccept ? 
    // If user can accept this bet, show the required challenger stake
    bet.payout - bet.stake 
    : bet.stake;  // Otherwise show the original stake

  console.log('Stake calculation:', {
    canAccept,
    originalStake: bet.stake,
    payout: bet.payout,
    calculatedStake: displayStake
  });

  return (
    <div className="relative group w-[85vw] max-w-[320px] sm:w-[300px] flex-shrink-0">
      {/* Animated border effect */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-xl opacity-30 group-hover:opacity-100 blur transition duration-500 group-hover:duration-200 animate-gradient-xy pointer-events-none"></div>
      
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
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-3 bg-gray-800/30 p-2.5 rounded-lg border-2 border-green-500/30 group-hover:border-green-500/50 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white">
                  {topTeam}
                </div>
              </div>
              <div className="text-green-400 text-sm font-bold whitespace-nowrap px-2.5 py-1 rounded bg-green-500/10 border border-green-500/20">
                {topOdds}
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 bg-gray-800/30 p-2.5 rounded-lg border-2 border-red-500/30 group-hover:border-red-500/50 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white">
                  {bottomTeam}
                </div>
              </div>
              <div className="text-xs text-blue-400 font-medium px-2.5 py-1 rounded bg-blue-500/10 border border-blue-500/20">
                Line: {bottomLine}
              </div>
            </div>
          </div>

          {/* Stakes */}
          <div className="mt-3.5 space-y-2">
            <div className="flex items-center justify-between py-2.5 px-3.5 rounded-lg bg-gray-800/50 border border-gray-700/30">
              <div>
                <div className="text-gray-500 text-xs mb-0.5">
                  {shouldShowAcceptButton() ? 'Required Stake' : 'Your Stake'}
                </div>
                <div className="text-white font-semibold text-base">
                  ${displayStake.toFixed(2)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-gray-500 text-xs mb-0.5">Total Payout</div>
                <div className="text-green-400 font-semibold text-base">${bet.payout}</div>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          {isMyBet && (
            <div className="mt-4">
              <div className={`text-center py-2 px-4 rounded-lg text-sm font-medium ${
                bet.status === 'pending' 
                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  : bet.status === 'matched'
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
              }`}>
                {bet.status === 'pending' ? 'Pending Match' :
                 bet.status === 'matched' ? 'Matched' :
                 'Completed'}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {shouldShowAcceptButton() && (
            <div className="mt-4">
              <button
                onClick={handleAcceptClick}
                className="w-full py-2 px-4 rounded-lg text-sm font-medium bg-gradient-to-r from-green-500 to-green-400 hover:from-green-400 hover:to-green-300 text-white transition-all duration-200 relative group overflow-hidden active:scale-[0.98]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-x-[-50%] group-hover:translate-x-[50%]"></div>
                Accept Bet
              </button>
            </div>
          )}

          {/* Judge Actions */}
          {shouldShowJudgeActions() && (
            <div className="mt-4 space-y-2">
              <div className="text-sm font-medium text-gray-300 mb-2">Choose Winner:</div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: topTeam, value: isChallenger ? bet.team2 : bet.team1 },
                  { name: bottomTeam, value: isChallenger ? bet.team1 : bet.team2 }
                ].map((team) => (
                  <button
                    key={team.value}
                    onClick={() => handleChooseWinner(team.value)}
                    className="py-2.5 px-4 rounded-lg text-sm font-medium bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-white transition-all duration-200 relative group overflow-hidden active:scale-[0.98] shadow-lg shadow-blue-500/20"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-x-[-50%] group-hover:translate-x-[50%]"></div>
                    {team.name}
                  </button>
                ))}
              </div>
              <button
                onClick={handleGameNotOver}
                className="w-full py-2.5 px-4 rounded-lg text-sm font-medium bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white transition-all duration-200 relative group overflow-hidden active:scale-[0.98] shadow-lg shadow-gray-800/20"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-x-[-50%] group-hover:translate-x-[50%]"></div>
                Game Not Over Yet
              </button>
            </div>
          )}

          {/* Show votes if any */}
          {bet.votes && bet.votes.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-700">
              <div className="text-sm font-medium text-gray-300 mb-2">Current Votes:</div>
              <div className="text-sm text-gray-400">
                {bet.votes.length} vote{bet.votes.length !== 1 ? 's' : ''} cast
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BetList({ bets, text, onAction }) {
  console.log('BetList received props:', { bets, text, hasOnAction: !!onAction });

  // Ensure bets is an array
  const betArray = Array.isArray(bets) ? bets : [];

  if (!betArray || betArray.length === 0) {
    return (
      <div className="text-center p-4">
        <p className="text-gray-400">{text || 'No bets available'}</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {text && (
        <p className="text-gray-300 mb-4 px-4">{text}</p>
      )}
      <div className="relative -mx-4">
        <div className="overflow-x-auto scrollbar-hide">
          <div className="inline-flex px-4 py-2 gap-4">
            {betArray.map((bet) => (
              <BetCard key={bet._id} bet={bet} onAction={onAction} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 
import { useCallback } from 'react';

export function useBetCardLogic(bet, onAction) {
  // Determine viewer's relationship to the bet
  const isMyBet = Boolean(bet.isMyBet);
  // Set isChallenger if I'm the challenger (my ID matches challengerId)
  const isChallenger = Boolean(bet.challengerId) && bet.challengerId === bet.currentUserId;

  const canAccept = Boolean(bet.canAccept) && !isMyBet;
  const canJudge = Boolean(bet.canJudge) && !isMyBet;

  console.log('BetCard relationship:', {
    betId: bet._id,
    isMyBet,
    isChallenger,
    canAccept,
    canJudge,
    status: bet.status,
    challengerId: bet.challengerId,
    currentUserId: bet.currentUserId,
    userId: bet.userId
  });

  // Keep team order consistent with user's pick on top
  const [topTeam, bottomTeam] = (() => {
    if (isMyBet) {
      if (isChallenger) {
        // If I'm the challenger, show my pick (team2) on top
        return [bet.team2, bet.team1];
      } else {
        // If I'm the original bettor, show my pick (team1) on top
        return [bet.team1, bet.team2];
      }
    }
    // For all other views, show original bettor's pick on top
    return [bet.team1, bet.team2];
  })();

  // Same for odds/lines - keep consistent with team order
  const [topOdds, bottomLine] = (() => {
    if (isMyBet) {
      if (isChallenger) {
        // If I'm the challenger, show the line on top
        return [
          bet.line === 'ML' ? 'ML' : parseFloat(bet.line) > 0 ? `+${bet.line}` : bet.line,
          bet.odds
        ];
      } else {
        // If I'm the original bettor, show my odds on top
        return [
          bet.odds,
          bet.line === 'ML' ? 'ML' : parseFloat(bet.line) > 0 ? `+${bet.line}` : bet.line
        ];
      }
    }
    // For all other views, show original format
    return [
      bet.odds,
      bet.line === 'ML' ? 'ML' : parseFloat(bet.line) > 0 ? `+${bet.line}` : bet.line
    ];
  })();

  // Team highlight colors based on relationship to bet
  const [topHighlight, bottomHighlight] = (() => {
    if (isMyBet) {
      // Always show my pick in green, opponent in red
      return [
        'border-green-500/30 group-hover:border-green-500/50',
        'border-red-500/30 group-hover:border-red-500/50'
      ];
    } else if (canAccept) {
      // In Open Bets view - original bettor's pick is top (red), my potential pick is bottom (green)
      return [
        'border-red-500/30 group-hover:border-red-500/50',
        'border-green-500/30 group-hover:border-green-500/50'
      ];
    }
    // Default view - original bettor's pick is top (green)
    return [
      'border-green-500/30 group-hover:border-green-500/50',
      'border-red-500/30 group-hover:border-red-500/50'
    ];
  })();

  // Odds highlight colors follow same team color logic
  const [topOddsHighlight, bottomOddsHighlight] = (() => {
    if (isMyBet) {
      // Always show my pick's odds in green, opponent's in red
      return [
        'text-green-400 bg-green-500/10 border border-green-500/20',
        'text-red-400 bg-red-500/10 border border-red-500/20'
      ];
    } else if (canAccept) {
      // In Open Bets view - original bettor's odds in red, my potential odds in green
      return [
        'text-red-400 bg-red-500/10 border border-red-500/20',
        'text-green-400 bg-green-500/10 border border-green-500/20'
      ];
    }
    // Default view - original bettor's odds in green
    return [
      'text-green-400 bg-green-500/10 border border-green-500/20',
      'text-red-400 bg-red-500/10 border border-red-500/20'
    ];
  })();

  // Calculate stake to display based on viewer's relationship to bet
  const displayStake = (() => {
    if (canAccept) {
      // For open bets view, show required stake (payout - original stake)
      return Number(bet.payout - bet.stake).toFixed(2);
    } else if (isMyBet) {
      if (isChallenger) {
        // If I'm the challenger, show my stake (payout - original stake)
        return Number(bet.payout - bet.stake).toFixed(2);
      } else {
        // If I'm the original bettor, show my original stake
        return Number(bet.stake).toFixed(2);
      }
    }
    // Default view shows original stake
    return Number(bet.stake).toFixed(2);
  })();

  // Calculate payout to display
  const displayPayout = (() => {
    if (isMyBet) {
      if (isChallenger) {
        // If I'm the challenger, my payout is the original stake
        return Number(bet.stake).toFixed(2);
      } else {
        // If I'm the original bettor, my payout is the payout
        return Number(bet.payout).toFixed(2);
      }
    }
    // For other views, show the bet's payout
    return Number(bet.payout).toFixed(2);
  })();

  console.log('Stake/Payout calculation:', {
    betId: bet._id,
    isMyBet,
    isChallenger,
    originalStake: bet.stake,
    originalPayout: bet.payout,
    displayStake,
    displayPayout,
    currentUserId: bet.currentUserId,
    userId: bet.userId,
    challengerId: bet.challengerId
  });

  // Helper functions
  const shouldShowJudgeActions = useCallback(() => canJudge && bet.status === 'matched', [canJudge, bet.status]);
  const shouldShowAcceptButton = useCallback(() => canAccept && bet.status === 'pending', [canAccept, bet.status]);

  const handleAcceptClick = useCallback(() => {
    console.log('Accept button clicked for bet:', bet._id);
    if (onAction) {
      onAction('accept_bet', { betId: bet._id });
    }
  }, [bet._id, onAction]);

  const handleChooseWinner = useCallback((winner) => {
    console.log('Choose winner clicked:', { betId: bet._id, winner });
    if (onAction) {
      onAction('choose_winner', { betId: bet._id, winner });
    }
  }, [bet._id, onAction]);

  const handleGameNotOver = useCallback(() => {
    console.log('Game not over clicked for bet:', bet._id);
    if (onAction) {
      onAction('game_not_over', { betId: bet._id });
    }
  }, [bet._id, onAction]);

  return {
    topTeam,
    bottomTeam,
    topOdds,
    bottomLine,
    topHighlight,
    bottomHighlight,
    topOddsHighlight,
    bottomOddsHighlight,
    displayStake,
    displayPayout,
    isMyBet,
    isChallenger,
    canJudge,
    canAccept,
    shouldShowJudgeActions,
    shouldShowAcceptButton,
    handleAcceptClick,
    handleChooseWinner,
    handleGameNotOver
  };
} 
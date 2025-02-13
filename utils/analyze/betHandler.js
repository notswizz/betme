/**
 * Handles betting-related intents and creates bet data
 */
export function handleBettingIntent(parsedIntent, options = {}, conversationalResponse = '') {
  console.log('Processing betting intent:', parsedIntent);
  
  // Ensure we have all required fields, using gameState as fallback
  const betData = {
    type: 'betslip',
    sport: parsedIntent.sport || 'NBA',
    team1: parsedIntent.team1 || (options.gameState && options.gameState.team1) || '',
    team2: parsedIntent.team2 || (options.gameState && options.gameState.team2) || '',
    line: parsedIntent.line || 'ML',
    odds: parsedIntent.odds || -110,
    stake: parseFloat(parsedIntent.stake) || 100,
    payout: parseFloat(parsedIntent.payout) || 190.91
  };

  console.log('Created bet data:', betData);

  return {
    message: {
      role: 'assistant',
      type: 'natural_bet',
      content: betData,
      text: conversationalResponse || 'I can help you place that bet.'
    },
    intent: parsedIntent
  };
}

/**
 * Handles view bets intent
 */
export function handleViewBetsIntent(parsedIntent, conversationalResponse = '') {
  console.log('Handling view bets intent');
  return {
    message: {
      role: 'assistant',
      type: 'bet_list',
      action: 'view_bets',
      content: conversationalResponse || 'Let me show you your current bets.'
    },
    intent: parsedIntent
  };
} 
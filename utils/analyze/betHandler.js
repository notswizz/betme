/**
 * Handles betting-related intents and creates bet data
 */
export function handleBettingIntent(parsedIntent, options = {}, conversationalResponse = '') {
  console.log('Processing betting intent:', parsedIntent);
  
  // Ensure we have all required fields, using gameState as fallback
  const betData = {
    type: parsedIntent.type || 'Moneyline',
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
      type: 'betslip',
      content: betData,
      text: conversationalResponse || "Let's set up your bet. Fill in the details below.",
      requiresConfirmation: false
    },
    intent: {
      intent: 'betting',
      confidence: 0.95
    }
  };
}

/**
 * Handles view bets intent with simplified action determination
 */
export function handleViewBetsIntent(content = '', conversationalResponse = '') {
  console.log('Handling view bets intent with content:', content);
  
  // Determine the specific type of bets to show based on message content
  let action = 'view_open_bets'; // default
  const lowerContent = content.toLowerCase();
  
  // First check for specific bet types - these take precedence
  if (lowerContent.includes('judge') || lowerContent.includes('complete')) {
    action = 'view_matched_bets_to_judge';
  } else if (lowerContent.includes('my') || lowerContent.includes('mine')) {
    action = 'view_my_bets';
  } else if (lowerContent.includes('accept') || lowerContent.includes('match')) {
    action = 'view_matched_bets';
  } else if (lowerContent.includes('open')) {
    action = 'view_open_bets';
  } else if (lowerContent.includes('all')) {
    // Only use 'all' if no other specific type was requested
    if (!lowerContent.includes('match') && !lowerContent.includes('accept') && 
        !lowerContent.includes('my') && !lowerContent.includes('mine') &&
        !lowerContent.includes('open') && !lowerContent.includes('judge') &&
        !lowerContent.includes('complete')) {
      action = 'view_open_bets';
    }
  }
  
  console.log('Determined bet view action:', action, 'from content:', lowerContent);
  
  return {
    message: {
      role: 'assistant',
      type: 'bet_list',
      action: action,
      content: 'Fetching bets...'
    },
    intent: {
      intent: 'view_bets',
      action: action,
      confidence: 0.95
    }
  };
} 
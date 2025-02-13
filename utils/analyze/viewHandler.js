/**
 * Handles view-related intents (balance, listings, etc)
 */
export function handleViewIntent(parsedIntent, conversationalResponse = '') {
  switch (parsedIntent.intent) {
    case 'view_open_bets':
    case 'check_balance':
    case 'view_listings':
      return {
        message: {
          role: 'assistant',
          type: parsedIntent.intent,
          content: conversationalResponse || null
        },
        intent: parsedIntent
      };
  }
}

/**
 * Handles add tokens intent
 */
export function handleAddTokensIntent(parsedIntent) {
  const tokenAmount = parsedIntent.amount || parsedIntent.token_amount;
  parsedIntent.name = 'add_tokens';
  return {
    message: {
      role: 'assistant',
      type: 'action_confirmation',
      content: `Would you like to add ${tokenAmount} tokens to your balance?`
    },
    intent: parsedIntent
  };
} 
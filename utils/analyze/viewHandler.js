/**
 * Handles view-related intents (balance, listings, etc)
 */
import { getBets } from '../../pages/api/actions/bets';

export async function handleViewIntent(intent, userId) {
  try {
    // Map intent action to specific view type
    let action = 'view_open_bets'; // default
    
    switch (intent.action) {
      case 'view_my_bets':
      case 'judge_bets':
      case 'view_open_bets':
        action = intent.action;
        break;
      default:
        // Keep default action for unknown types
        break;
    }

    // Get bets based on action
    const betsResult = await getBets(userId, action);
    
    if (!betsResult.success) {
      throw new Error(betsResult.error || 'Failed to fetch bets');
    }

    return {
      success: true,
      message: betsResult.message
    };

  } catch (error) {
    console.error('Error in view handler:', error);
    return {
      success: false,
      error: error.message || 'Failed to process view intent'
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
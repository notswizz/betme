import { analyzeIntent } from '@/pages/api/actions/chat';
import { addTokens } from '@/pages/api/actions/balance';
import { createListing } from '@/pages/api/actions/listing';

// Define available actions
const ACTIONS = {
  GET_BALANCE: 'get_balance',
  ADD_TOKENS: 'add_tokens',
  CREATE_LISTING: 'create_listing',
  // Add more WRITE actions here that need confirmation
  // Add new actions that need confirmation
};

// Define direct responses that don't need confirmation
const DIRECT_RESPONSES = {
  BALANCE_CHECK: 'balance_check',
  VIEW_LISTINGS: 'view_listings',
  // Add new direct actions here
};

/**
 * Analyzes conversation to decide what to do
 */
export async function analyzeConversation(messages) {
  const lastMessage = messages[messages.length - 1].content;
  const intent = await analyzeIntent(lastMessage);

  if (!intent) {
    return { type: 'chat' };
  }

  if (intent.confidence < 0.7) {
    return { type: 'chat' };
  }

  switch (intent.intent) {
    case 'check_balance':
      return { type: 'direct', action: DIRECT_RESPONSES.BALANCE_CHECK };
    case 'view_listings':
      return { type: 'direct', action: DIRECT_RESPONSES.VIEW_LISTINGS };
    case 'add_tokens':
      return {
        type: 'action',
        content: `Would you like to add ${intent.amount} tokens to your balance?`,
        tool_calls: [{
          name: 'add_tokens',
          amount: intent.amount
        }]
      };
    case 'create_listing':
      return {
        type: 'action',
        content: `Would you like to create a listing for "${intent.listingTitle}" priced at ${intent.listingPrice} tokens?`,
        tool_calls: [{
          name: 'create_listing',
          listingTitle: intent.listingTitle,
          listingPrice: intent.listingPrice
        }]
      };
    default:
      return { type: 'chat' };
  }
}

/**
 * Makes API call after action is confirmed
 */
export async function handleAction(action, userId) {
  try {
    switch (action.name) {
      case 'add_tokens':
        return await addTokens(userId, action.amount);
      case 'create_listing':
        return await createListing(userId, {
          title: action.listingTitle,
          tokenPrice: action.listingPrice
        });
      default:
        return {
          success: false,
          message: 'Unknown action',
          error: 'UNKNOWN_ACTION'
        };
    }
  } catch (error) {
    console.error('Action handling error:', error);
    return {
      success: false,
      message: 'Error processing action',
      error: error.message
    };
  }
}

// Message analyzer
// - Determines if message needs action
// - Types: 'direct' (no confirmation), 'action' (needs confirmation), 'normal'
// - Currently handles: balance checks (direct)
// - Extensible for new actions 
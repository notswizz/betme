import { analyzeIntent } from '@/pages/api/actions/chat';
import { addTokens } from '@/pages/api/actions/balance';
import { createListing } from '@/pages/api/actions/listing';
import { submitBet } from './betSubmission';
import { isAuthenticated } from './auth';

// Define available actions
const ACTIONS = {
  GET_BALANCE: 'get_balance',
  ADD_TOKENS: 'add_tokens',
  CREATE_LISTING: 'create_listing',
  PLACE_BET: 'place_bet',
  // Add more WRITE actions here that need confirmation
  // Add new actions that need confirmation
};

// Define direct responses that don't need confirmation
const DIRECT_RESPONSES = {
  BALANCE_CHECK: 'balance_check',
  VIEW_LISTINGS: 'view_listings',
  VIEW_BETS: 'view_bets',
  // Add new direct actions here
};

/**
 * Analyzes conversation to decide what to do
 */
export async function analyzeConversation(messages) {
  const lastMessage = messages[messages.length - 1].content;
  const intent = await analyzeIntent(lastMessage);

  if (!intent || intent.confidence < 0.7) {
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
    case 'place_bet':
      // Ensure we have all required fields
      if (!intent.type || !intent.sport || !intent.stake) {
        return { type: 'chat' };
      }

      const betData = {
        type: intent.type,
        sport: intent.sport,
        team1: intent.team1 || '',
        team2: intent.team2 || '',
        line: intent.line || '',
        odds: intent.odds || -110, // Default odds if not specified
        stake: parseFloat(intent.stake) || 0
      };

      return {
        type: 'action',
        content: `Would you like to place a ${betData.type} bet on ${betData.sport}?`,
        tool_calls: [{
          name: 'place_bet',
          ...betData
        }]
      };
    case 'view_bets':
      return { type: 'direct', action: DIRECT_RESPONSES.VIEW_BETS };
    default:
      return { type: 'chat' };
  }
}

/**
 * Makes API call after action is confirmed
 */
export async function handleAction(action, userId) {
  try {
    // Check authentication first
    if (!isAuthenticated()) {
      return {
        success: false,
        message: 'Please login to perform this action',
        error: 'NOT_AUTHENTICATED'
      };
    }

    switch (action.name) {
      case 'add_tokens':
        return await addTokens(userId, action.amount);
      case 'create_listing':
        return await createListing(userId, {
          title: action.listingTitle,
          tokenPrice: action.listingPrice
        });
      case 'place_bet':
        // Validate required fields
        if (!action.type || !action.sport || !action.stake) {
          throw new Error('Missing required bet information');
        }
        
        return await submitBet({
          ...action,
          userId
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
    // Handle specific auth errors
    if (error.message === 'Please login again') {
      return {
        success: false,
        message: 'Your session has expired. Please login again.',
        error: 'SESSION_EXPIRED'
      };
    }
    return {
      success: false,
      message: error.message || 'Error processing action',
      error: error.message
    };
  }
}

// Message analyzer
// - Determines if message needs action
// - Types: 'direct' (no confirmation), 'action' (needs confirmation), 'normal'
// - Currently handles: balance checks (direct)
// - Extensible for new actions 
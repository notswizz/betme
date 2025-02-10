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
  VIEW_OPEN_BETS: 'view_open_bets',
  // Add new direct actions here
};

/**
 * Analyzes conversation to decide what to do
 */
export async function analyzeConversation(messages) {
  const lastMessage = messages[messages.length - 1].content;
  const aiResponse = await analyzeIntent(lastMessage);

  // If we got no response from the AI, default to chat
  if (!aiResponse) {
    console.log('No valid AI response, defaulting to chat');
    return { type: 'chat' };
  }

  console.log('Parsed AI response:', aiResponse);

  // Handle viewing intents
  if (aiResponse.intent) {
    switch (aiResponse.intent) {
      case 'view_open_bets':
        return { type: 'direct', action: DIRECT_RESPONSES.VIEW_OPEN_BETS };
      case 'view_bets':
        return { type: 'direct', action: DIRECT_RESPONSES.VIEW_BETS };
      case 'check_balance':
        return { type: 'direct', action: DIRECT_RESPONSES.BALANCE_CHECK };
      case 'view_listings':
        return { type: 'direct', action: DIRECT_RESPONSES.VIEW_LISTINGS };
    }
  }

  // If it's a betting intent, handle bet data
  if (aiResponse.type && aiResponse.sport) {
    const betData = {
      type: aiResponse.type,
      sport: aiResponse.sport,
      team1: aiResponse.team1 || '',
      team2: aiResponse.team2 || '',
      line: aiResponse.line || '',
      odds: aiResponse.odds || -110,
      stake: parseFloat(aiResponse.stake) || 10
    };

    return {
      type: 'action',
      content: `Would you like to place a ${betData.type} bet on ${betData.sport}?`,
      tool_calls: [{
        name: 'place_bet',
        ...betData
      }]
    };
  }

  // Default to chat if no clear intent
  return { type: 'chat' };
}

/**
 * Makes API call after action is confirmed
 */
export async function handleAction(action, userId, token = null) {
  try {
    // We don't need to check isAuthenticated() here since the API route already verifies the token
    switch (action.name) {
      case 'add_tokens':
        return await addTokens(userId, action.amount);
      case 'create_listing':
        return await createListing(userId, {
          title: action.listingTitle,
          tokenPrice: action.listingPrice
        });
      case 'place_bet':
        // Log the incoming action data
        console.log('Handling bet action:', action);
        
        // Parse numeric values
        const stake = parseFloat(action.stake);
        const odds = parseInt(action.odds);
        
        // Validate and format bet data
        const betData = {
          type: action.type,
          sport: action.sport,
          team1: action.team1,
          team2: action.team2,
          line: action.line,
          odds: odds,
          stake: stake,
          payout: parseFloat(action.payout)
        };

        // Validate required fields with detailed error
        const missingFields = [];
        if (!betData.type) missingFields.push('type');
        if (!betData.sport) missingFields.push('sport');
        if (!betData.team1) missingFields.push('team1');
        if (!betData.team2) missingFields.push('team2');
        if (isNaN(betData.odds)) missingFields.push('odds');
        if (isNaN(betData.stake) || betData.stake <= 0) missingFields.push('stake');

        if (missingFields.length > 0) {
          const error = `Missing required bet information: ${missingFields.join(', ')}`;
          console.error(error, betData);
          throw new Error(error);
        }
        
        return await submitBet(betData, token);
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
import { addTokens } from '@/pages/api/actions/balance';
import { createListing } from '@/pages/api/actions/listing';
import { submitBet } from '../betSubmission';
import { handleBasketballQuery } from '../nbaApi';

/**
 * Makes API call after action is confirmed
 */
export async function handleAction(action, userId, token = null, gameState = {}) {
  // If the action object has a nested 'action' property, use it and preserve requiresConfirmation
  if (action.action) {
    const nested = action.action;
    action = { ...nested, requiresConfirmation: action.requiresConfirmation || nested.requiresConfirmation };
  }

  // Fallback: if action.name is missing
  if (!action.name && action.intent === 'add_tokens') {
    action.name = 'add_tokens';
  } else if (!action.name && action.type === 'natural_bet') {
    action.name = 'place_bet';
  } else if (!action.name && action.type === 'betslip') {
    action.name = 'place_bet';
  } else if (!action.name && action.requiresConfirmation) {
    action.name = 'place_bet';
  } else if (!action.name && action.content && typeof action.content === 'string' && 
             (action.content.toLowerCase().includes('place a bet') || action.content.toLowerCase().includes('place this bet'))) {
    action.name = 'place_bet';
  }

  // Normalize the action name to lowercase if it exists
  if (action.name && typeof action.name === 'string') {
    action.name = action.name.toLowerCase();
  }

  // If team1 or team2 are missing, attempt to fill them from gameState if available
  if ((!action.team1 || !action.team2) && gameState && gameState.team1 && gameState.team2) {
    if (!action.team1) action.team1 = gameState.team1;
    if (!action.team2) action.team2 = gameState.team2;
  }

  // Debug log the final action object
  console.log('Final action in handleAction:', action);

  try {
    switch (action.name) {
      case 'add_tokens':
        return await addTokens(userId, action.amount || action.token_amount);
      case 'create_listing':
        return await createListing(userId, {
          title: action.listingTitle,
          tokenPrice: action.listingPrice
        });
      case 'place_bet':
        console.log('Handling bet action:', action);
        const stake = parseFloat(action.stake);
        const odds = parseInt(action.odds);
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

        if (!betData || !betData.type || !betData.stake || !betData.odds) {
          throw new Error('Invalid bet data');
        }

        return await submitBet(betData, token);
      case 'basketball_query':
        return await handleBasketballQuery(action.query);
      default:
        return {
          success: false,
          message: 'Unknown action',
          error: 'UNKNOWN_ACTION'
        };
    }
  } catch (error) {
    console.error('Action handling error:', error);
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
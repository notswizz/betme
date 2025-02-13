import { analyzeIntent } from '@/pages/api/actions/chat';
import { addTokens } from '@/pages/api/actions/balance';
import { createListing } from '@/pages/api/actions/listing';
import { submitBet } from './betSubmission';
import { isAuthenticated } from './auth';
import { 
  handleBasketballQuery, 
  getPlayerStats, 
  getTeamStats, 
  getLiveGameStats,
  getSeasonLeaders 
} from './nbaApi';
import { generateAIResponse } from './venice.js';

// Define available actions
const ACTIONS = {
  GET_BALANCE: 'get_balance',
  ADD_TOKENS: 'add_tokens',
  CREATE_LISTING: 'create_listing',
  PLACE_BET: 'place_bet',
  BASKETBALL_QUERY: 'basketball_query',
  // Add more WRITE actions here that need confirmation
  // Add new actions that need confirmation
};

// Define direct responses that don't need confirmation
const DIRECT_RESPONSES = {
  BALANCE_CHECK: 'balance_check',
  VIEW_LISTINGS: 'view_listings',
  VIEW_BETS: 'view_bets',
  VIEW_OPEN_BETS: 'view_open_bets',
  BASKETBALL_INFO: 'basketball_info',
  // Add new direct actions here
};

// Define query types for basketball
const BASKETBALL_QUERY_TYPES = {
  PLAYER_STATS: 'player_stats',
  TEAM_STATS: 'team_stats',
  LIVE_GAMES: 'live_games',
  SEASON_LEADERS: 'season_leaders',
  HEAD_TO_HEAD: 'head_to_head',
  STANDINGS: 'standings'
};

// Basketball query handler
async function handleBasketballIntent(aiResponse) {
  try {
    console.log('Processing basketball intent:', aiResponse);

    // Extract the actual query data from the intent
    const queryData = {
      type: aiResponse.intent,
      player: aiResponse.player,
      stat: aiResponse.stat,
      team: aiResponse.team,
      season: aiResponse.season || new Date().getFullYear().toString()
    };

    console.log('Extracted query data:', queryData);

    // Handle basic player stats query
    if (queryData.type === 'player_stats' || aiResponse.intent === 'player_stats') {
      console.log('Processing player stats query for:', queryData.player);
      const playerStats = await handleBasketballQuery({
        type: 'player_stats',
        player: queryData.player,
        stat: queryData.stat,
        season: queryData.season
      });
      
      if (!playerStats) {
        return {
          type: 'error',
          message: `Couldn't find stats for ${queryData.player}`
        };
      }

      return playerStats;
    }

    // Handle other query types
    switch (queryData.type) {
      case BASKETBALL_QUERY_TYPES.TEAM_STATS:
        const teamStats = await getTeamStats(queryData.team);
        if (!teamStats) {
          return {
            type: 'error',
            message: `Couldn't find stats for ${queryData.team}`
          };
        }
        return {
          type: 'text',
          content: formatTeamStatsResponse(teamStats)
        };
      
      case BASKETBALL_QUERY_TYPES.LIVE_GAMES:
        const liveGames = await getLiveGameStats();
        return {
          type: 'text',
          content: formatLiveGamesResponse(liveGames)
        };
      
      case BASKETBALL_QUERY_TYPES.SEASON_LEADERS:
        const leaders = await getSeasonLeaders(
          aiResponse.season || getCurrentSeason(),
          aiResponse.category || 'points'
        );
        return {
          type: 'text',
          content: formatLeadersResponse(leaders)
        };
      
      default:
        return {
          type: 'error',
          message: 'Unknown basketball query type'
        };
    }
  } catch (error) {
    console.error('Error handling basketball intent:', error);
    return {
      type: 'error',
      message: 'Error processing basketball query'
    };
  }
}

// Format team stats response
function formatTeamStatsResponse(teamStats) {
  const { team, stats } = teamStats;
  return `The ${team.name} (${team.nickname}) are currently ${stats.wins}-${stats.losses} ` +
         `(${stats.winPercentage}%) this season. They're averaging ${stats.points} points per game ` +
         `while allowing ${stats.pointsAgainst} points. Current streak: ${stats.streak}.`;
}

// Format live games response
function formatLiveGamesResponse(games) {
  if (games.length === 0) {
    return 'There are no live NBA games at the moment.';
  }

  return games.map(game => {
    const { teams, status, period, clock } = game;
    return `${teams.away.name} ${teams.away.score} @ ${teams.home.name} ${teams.home.score}\n` +
           `${status} - ${period}Q ${clock}`;
  }).join('\n\n');
}

// Format leaders response
function formatLeadersResponse(leaders) {
  if (leaders.length === 0) {
    return 'No season leaders data available.';
  }

  return 'Season Leaders:\n' + leaders.slice(0, 5).map((player, index) => 
    `${index + 1}. ${player.name} (${player.team}): ${player.value}`
  ).join('\n');
}

/**
 * Analyzes conversation to decide what to do
 */
export async function analyzeConversation(messages, options = {}) {
  try {
    // Debug log the incoming messages
    console.log('Analyzing conversation with messages:', messages);

    // Check for Venice API key
    if (!process.env.VENICE_API_KEY) {
      console.error('VENICE_API_KEY is not set in environment variables');
      throw new Error('Venice API configuration missing');
    }

    // Get AI response for intent detection
    const aiResponse = await generateAIResponse(messages);
    console.log('Raw AI Response:', aiResponse);

    // If we got no response from the AI, default to chat
    if (!aiResponse) {
      console.log('No valid AI response, defaulting to chat');
      return { 
        message: {
          role: 'assistant',
          type: 'text',
          content: "I'm having trouble understanding that right now. Could you try rephrasing?"
        },
        intent: { type: 'chat' }
      };
    }

    // Extract JSON from AI response if it exists
    let parsedIntent;
    let conversationalResponse = '';
    try {
      // Update to capture multi-line JSON
      const parts = aiResponse.content.split(/(\{[\s\S]*\})$/);
      if (parts.length > 1) {
        conversationalResponse = parts[0].trim();
        parsedIntent = JSON.parse(parts[1]);
        console.log('Split response into:', { conversationalResponse, parsedIntent });
      } else {
        parsedIntent = JSON.parse(aiResponse.content);
        console.log('Parsed JSON from content string:', parsedIntent);
      }
    } catch (e) {
      // If content isn't pure JSON, try to extract JSON from it
      const jsonMatch = aiResponse.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        conversationalResponse = aiResponse.content.replace(jsonMatch[0], '').trim();
        parsedIntent = JSON.parse(jsonMatch[0]);
        console.log('Extracted JSON from content:', { conversationalResponse, parsedIntent });
      }
    }

    console.log('Final parsed response:', { conversationalResponse, parsedIntent });

    // Handle view bets intent
    if (parsedIntent?.intent === 'view_bets') {
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

    // If it's a betting intent, handle bet data
    if (parsedIntent?.intent === 'betting' || parsedIntent?.type === 'betslip') {
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

    // Check if it's a basketball query
    if (parsedIntent?.intent === 'basketball_query') {
      console.log('Detected basketball query');
      try {
        const response = await handleBasketballIntent(parsedIntent);
        console.log('Basketball API response:', response);
        
        if (response.type === 'error') {
          console.log('Basketball query failed:', response.message);
          return { 
            message: {
              role: 'assistant',
              type: 'text',
              content: response.message
            },
            intent: parsedIntent || { intent: 'chat', confidence: 1.0 }
          };
        }
        
        return {
          message: {
            role: 'assistant',
            type: 'text',
            content: conversationalResponse ? `${conversationalResponse}\n\n${response}` : response
          },
          intent: parsedIntent
        };
      } catch (error) {
        console.error('Basketball query error:', error);
        return {
          message: {
            role: 'assistant',
            type: 'text',
            content: 'Sorry, I had trouble processing that basketball query.'
          },
          intent: parsedIntent || { intent: 'chat', confidence: 1.0 }
        };
      }
    }

    // Handle other viewing intents
    if (parsedIntent?.intent) {
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

    // Insert the following branch:
    if (parsedIntent?.intent === 'add_tokens') {
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

    // Default to chat if no clear intent or just conversational
    return {
      message: {
        role: 'assistant',
        type: 'text',
        content: conversationalResponse || aiResponse.content || 'I apologize, but I could not process that request.'
      },
      intent: parsedIntent || { intent: 'chat', confidence: 1.0 }
    };
  } catch (error) {
    console.error('Error in analyzeConversation:', error);
    return {
      message: {
        role: 'assistant',
        type: 'text',
        content: 'Sorry, I encountered an error processing your request. Please try again.'
      },
      intent: { intent: 'chat', confidence: 1.0 }
    };
  }
}

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
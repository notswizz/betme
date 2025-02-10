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
export async function analyzeConversation(messages) {
  const lastMessage = messages[messages.length - 1].content;
  const aiResponse = await generateAIResponse(messages);

  // If we got no response from the AI, default to chat
  if (!aiResponse) {
    console.log('No valid AI response, defaulting to chat');
    return { type: 'chat' };
  }

  console.log('Parsed AI response:', aiResponse);

  // Extract JSON from AI response if it exists
  let parsedIntent;
  try {
    const jsonMatch = aiResponse.content.match(/\{[\s\S]*\}$/);
    if (jsonMatch) {
      parsedIntent = JSON.parse(jsonMatch[0]);
      console.log('Extracted intent:', parsedIntent);
    }
  } catch (error) {
    console.error('Error parsing intent JSON:', error);
  }

  // Check if it's a basketball query
  if (parsedIntent?.intent === 'basketball_query') {
    console.log('Detected basketball query:', lastMessage);
    try {
      const response = await handleBasketballIntent(parsedIntent);
      console.log('Basketball API response:', response);
      
      if (response.type === 'error') {
        console.log('Basketball query failed:', response.message);
        return { type: 'chat' };
      }
      
      return {
        type: 'direct',
        action: DIRECT_RESPONSES.BASKETBALL_INFO,
        data: response
      };
    } catch (error) {
      console.error('Basketball query error:', error);
      return { type: 'chat' };
    }
  }

  // Handle viewing intents
  if (parsedIntent?.intent) {
    switch (parsedIntent.intent) {
      case 'view_open_bets':
        return { type: 'direct', action: DIRECT_RESPONSES.VIEW_OPEN_BETS };
      case 'view_bets':
        return { type: 'direct', action: DIRECT_RESPONSES.VIEW_BETS };
      case 'check_balance':
        return { type: 'direct', action: DIRECT_RESPONSES.BALANCE_CHECK };
      case 'view_listings':
        return { type: 'direct', action: DIRECT_RESPONSES.VIEW_LISTINGS };
      case 'place_bet':
        if (parsedIntent.type === 'betting') {
          return {
            type: 'action',
            content: `Would you like to place a bet on ${parsedIntent.team}?`,
            tool_calls: [{
              name: 'place_bet',
              team: parsedIntent.team
            }]
          };
        }
    }
  }

  // If it's a betting intent, handle bet data
  if (parsedIntent?.type === 'betting') {
    const betData = {
      type: parsedIntent.bet_type || 'moneyline',
      sport: parsedIntent.sport || 'NBA',
      team1: parsedIntent.team || '',
      team2: parsedIntent.opponent || '',
      line: parsedIntent.line || '',
      odds: parsedIntent.odds || -110,
      stake: parseFloat(parsedIntent.stake) || 10
    };

    return {
      type: 'action',
      content: `Would you like to place a ${betData.type} bet on ${betData.team1}?`,
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
import { 
  handleBasketballQuery, 
  getPlayerStats, 
  getTeamStats, 
  getLiveGameStats,
  getSeasonLeaders 
} from '../nbaApi';
import { BASKETBALL_QUERY_TYPES } from './constants';

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

// Basketball query handler
export async function handleBasketballIntent(aiResponse) {
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
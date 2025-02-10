import { getPlayerStats } from '../services/playerService';
import { findPlayerByName } from '../services/playerService';
import { calculatePlayerAverages } from './statsUtils';
import cache from './cache';
import rateLimiter from './rateLimiter';
import { RATE_LIMIT } from './rateLimit';
import nbaApiClient from './nbaClient';

const CURRENT_SEASON = new Date().getFullYear();

// Function to get player statistics
async function fetchPlayerStatistics(playerName, season = CURRENT_SEASON) {
  try {
    // First find the player
    const player = await findPlayerByName(playerName);
    if (!player) {
      return {
        error: true,
        message: `Could not find player "${playerName}". Please check the spelling.`
      };
    }

    // Check cache first
    const cacheKey = `player_stats_${player.id}_${season}`;
    const cachedStats = cache.get(cacheKey);
    if (cachedStats) {
      return {
        error: false,
        player,
        stats: cachedStats,
        averages: calculatePlayerAverages(cachedStats)
      };
    }

    // Fetch fresh stats
    const stats = await rateLimiter.add(() =>
      nbaApiClient.get('/players/statistics', {
        params: {
          id: player.id,
          season: season
        }
      })
    );

    if (!stats || !Array.isArray(stats)) {
      throw new Error('Invalid stats data received from API');
    }

    // Calculate averages and cache results
    const averages = calculatePlayerAverages(stats);
    cache.set(cacheKey, stats, RATE_LIMIT.STATS_CACHE_DURATION);

    return {
      error: false,
      player,
      stats,
      averages
    };

  } catch (error) {
    console.error('Error fetching player statistics:', error);
    return {
      error: true,
      message: error.message || 'Failed to fetch player statistics'
    };
  }
}

// Function to handle basketball queries
async function handleBasketballQuery({ type, player, stat, season = CURRENT_SEASON }) {
  try {
    switch (type) {
      case 'player_stats': {
        const result = await fetchPlayerStatistics(player, season);
        if (result.error) {
          return {
            type: 'text',
            content: result.message
          };
        }

        // Format data for PlayerStatsCard
        return {
          type: 'player_stats',
          content: {
            firstName: result.player.firstname,
            lastName: result.player.lastname,
            team: {
              name: result.player.team.name,
              logo: result.player.team.logo
            },
            season: season.toString(),
            gamesPlayed: result.stats.length,
            stats: result.averages
          }
        };
      }
      default:
        return {
          type: 'text',
          content: 'Unsupported query type'
        };
    }
  } catch (error) {
    console.error('Error handling basketball query:', error);
    return {
      type: 'text',
      content: 'Error processing basketball query'
    };
  }
}

// Function to get team's next game
async function getTeamNextGame(teamName) {
  try {
    const games = await rateLimiter.add(() =>
      nbaApiClient.get('/games', {
        params: {
          team: teamName,
          season: CURRENT_SEASON,
          status: 'scheduled'
        }
      })
    );

    if (!games || !Array.isArray(games) || games.length === 0) {
      return {
        error: true,
        message: `No upcoming games found for ${teamName}`
      };
    }

    const nextGame = games[0]; // Games should be sorted by date

    return {
      error: false,
      data: {
        date: nextGame.date,
        homeTeam: nextGame.teams.home.name,
        awayTeam: nextGame.teams.away.name,
        venue: nextGame.arena.name
      }
    };
  } catch (error) {
    console.error('Error fetching next game:', error);
    return {
      error: true,
      message: 'Failed to fetch next game information'
    };
  }
}

// Function to format player stats
function formatPlayerStats(stats) {
  if (!stats) return null;
  
  return {
    points: stats.points || '0',
    rebounds: stats.rebounds || '0',
    assists: stats.assists || '0',
    steals: stats.steals || '0',
    blocks: stats.blocks || '0',
    minutes: stats.minutes || '0',
    fgp: stats.fgp || '0',
    tpp: stats.tpp || '0',
    ftp: stats.ftp || '0',
  };
}

// Export the functions that are used in other files
export {
  getPlayerStats,
  getTeamNextGame,
  handleBasketballQuery,
  formatPlayerStats,
  fetchPlayerStatistics
}; 
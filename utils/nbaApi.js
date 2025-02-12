import nbaClient from './nbaClient';
import { getCurrentSeason, CACHE_CONFIG } from './config';
import { calculatePlayerAverages } from './statsUtils';
import { teamMapping } from './teamMapping';

// Known player-team mappings
const PLAYER_TEAMS = {
  "Trae Young": "Atlanta Hawks",
  "LeBron James": "Los Angeles Lakers",
  "Stephen Curry": "Golden State Warriors",
  "Kevin Durant": "Phoenix Suns"
};

// NBA Teams mapping
const NBA_TEAMS = {
  "Hawks": 1,
  "Celtics": 2,
  "Nets": 3,
  "Hornets": 4,
  "Bulls": 5,
  "Cavaliers": 6,
  "Mavericks": 7,
  "Nuggets": 8,
  "Pistons": 9,
  "Warriors": 10,
  "Rockets": 11,
  "Pacers": 12,
  "Clippers": 13,
  "Lakers": 14,
  "Grizzlies": 15,
  "Heat": 16,
  "Bucks": 17,
  "Timberwolves": 18,
  "Pelicans": 19,
  "Knicks": 20,
  "Thunder": 21,
  "Magic": 22,
  "76ers": 23,
  "Suns": 24,
  "Trail Blazers": 25,
  "Kings": 26,
  "Spurs": 27,
  "Raptors": 28,
  "Jazz": 29,
  "Wizards": 30
};

// Function to get player statistics
export async function fetchPlayerStatistics(playerName, season = getCurrentSeason()) {
  try {
    // Get team ID for known players
    let teamId = null;
    if (PLAYER_TEAMS[playerName]) {
      teamId = teamMapping[PLAYER_TEAMS[playerName]];
    }

    // Search for player with team if known
    const response = await nbaClient.get('/players', {
      params: {
        ...(teamId && { team: teamId }),
        season: season
      },
      cacheDuration: CACHE_CONFIG.STATS_DURATION
    });

    console.log('Looking for player:', playerName);
    
    // Find the player in the results
    const player = response.find(p => {
      const fullName = `${p.firstname} ${p.lastname}`.toLowerCase();
      const searchName = playerName.toLowerCase();
      const isMatch = fullName.includes(searchName) || searchName.includes(fullName);
      if (isMatch) {
        console.log('Found player:', p.firstname, p.lastname, 'ID:', p.id);
      }
      return isMatch;
    });

    if (!player) {
      console.log('Player not found in response');
      return {
        error: true,
        message: `Could not find player "${playerName}". Please check the spelling.`
      };
    }

    console.log('Getting stats for player ID:', player.id);

    // Fetch player stats
    const stats = await nbaClient.get('/players/statistics', {
      params: {
        id: player.id,
        season: season
      },
      cacheDuration: CACHE_CONFIG.STATS_DURATION
    });

    if (!stats || !Array.isArray(stats)) {
      throw new Error('Invalid stats data received from API');
    }

    // Calculate averages
    const averages = calculatePlayerAverages(stats);

    // Add team info to response
    const teamInfo = player.leagues?.standard?.active ? {
      name: PLAYER_TEAMS[playerName] || 'NBA Team',
      logo: `https://cdn.nba.com/logos/nba/${teamId}/global/L/logo.svg`
    } : null;

    return {
      error: false,
      player: {
        ...player,
        team: teamInfo
      },
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

// Function to get team's next game
export async function getTeamNextGame(teamName) {
  try {
    const games = await nbaClient.get('/games', {
      params: {
        team: teamName,
        season: getCurrentSeason(),
        status: 'scheduled'
      },
      cacheDuration: CACHE_CONFIG.GAMES_DURATION
    });

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

// Function to handle basketball queries
export async function handleBasketballQuery({ type, player, stat, season = getCurrentSeason() }) {
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

        // Format data for response
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

// Function to format player stats
export function formatPlayerStats(stats) {
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
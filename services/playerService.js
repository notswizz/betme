import nbaApiClient from '../utils/nbaClient';
import rateLimiter from '../utils/rateLimiter';
import cache from '../utils/cache';
import { generateAIResponse } from '../utils/venice';
import { normalizePlayerName } from '../utils/nameUtils';
import { teamMapping } from '../utils/teamMapping';

async function analyzePlayerName(searchName) {
  try {
    const aiResponse = await generateAIResponse([
      {
        role: 'system',
        content: "You are an NBA player name normalizer. Your ONLY job is to return the exact player name. NO explanations. NO additional text.\n\nExamples:\nbron -> LeBron James\nthe greek freak -> Giannis Antetokounmpo\ncolby white -> Coby White\nsteph -> Stephen Curry\nice trae -> Trae Young\nzach risacher -> Zach LaVine\n\nRULES:\n1. ONLY return the player's name\n2. NO additional text or explanations\n3. NO punctuation except hyphens in names\n4. If unsure, return the original input"
      },
      {
        role: 'user',
        content: searchName,
      },
    ]);

    // Clean and validate the response
    const normalizedName = aiResponse.content.trim();
    if (!/^[A-Za-z\s'-]+$/.test(normalizedName)) {
      return searchName; // Return original if AI response is invalid
    }

    console.log('AI normalized name:', normalizedName);
    return normalizedName;
  } catch (error) {
    console.error('Error analyzing player name:', error);
    // Fallback to simple normalization
    const fallbackName = normalizePlayerName(searchName);
    console.log('Fallback normalized name:', fallbackName);
    return fallbackName;
  }
}

export async function findPlayerByName(name, options = {}) {
  const normalizedName = await analyzePlayerName(name);
  console.log('=== DEBUG: findPlayerByName ===');
  console.log('Input name:', name);
  console.log('Normalized name:', normalizedName);
  
  try {
    // Check player cache first
    const playerCacheKey = `player_${normalizedName.toLowerCase()}`;
    const cachedPlayer = cache.get(playerCacheKey);
    if (cachedPlayer) {
      console.log('Found player in cache');
      return cachedPlayer;
    }

    // Get current season
    const currentDate = new Date();
    const season = currentDate.getMonth() < 9 ? currentDate.getFullYear() - 1 : currentDate.getFullYear();
    console.log('Using season:', season);

    let teamsToSearch = [];

    // First, check if a preferred team is provided in options
    if (options.preferredTeam) {
      const preferredTeamName = options.preferredTeam.trim().toLowerCase();
      // Use teamMapping to resolve the preferred team
      const matchingEntry = Object.entries(teamMapping).find(([key, value]) => key.toLowerCase().includes(preferredTeamName));
      const teamIdFromPreferred = matchingEntry ? matchingEntry[1] : null;
      if (teamIdFromPreferred) {
        console.log(`Preferred team provided (${options.preferredTeam}) resolved to team ID: ${teamIdFromPreferred}`);
        const teamCacheKey = `team_${teamIdFromPreferred}`;
        let cachedTeamData = cache.get(teamCacheKey);
        if (!cachedTeamData) {
          console.log(`Team data for team ID ${teamIdFromPreferred} not in cache. Fetching from API.`);
          cachedTeamData = await rateLimiter.add(() =>
            nbaApiClient.get('/teams', { params: { id: teamIdFromPreferred } })
          );
          if (Array.isArray(cachedTeamData) && cachedTeamData.length > 0) {
            cache.set(teamCacheKey, cachedTeamData, 24 * 60 * 60 * 1000); // Cache for 24 hours
          }
        } else {
          console.log(`Using cached team data for team ID ${teamIdFromPreferred}`);
        }

        if (Array.isArray(cachedTeamData) && cachedTeamData.length > 0) {
          teamsToSearch = cachedTeamData;
        }
      } else {
        console.log(`Preferred team provided (${options.preferredTeam}) not recognized in teamMapping.`);
      }
    }

    // Fallback: if no teams from preferredTeam, try knownTeams mapping by player name
    if (teamsToSearch.length === 0) {
      const knownTeams = {
        'Trae Young': teamMapping["Atlanta Hawks"],
        'LeBron James': teamMapping["Los Angeles Lakers"],
        'Stephen Curry': teamMapping["Golden State Warriors"],
        'Giannis Antetokounmpo': teamMapping["Milwaukee Bucks"]
      };
      const playerKey = Object.keys(knownTeams).find(key => 
        key.toLowerCase() === normalizedName.toLowerCase()
      );
      if (playerKey) {
        const teamId = knownTeams[playerKey];
        console.log(`Known team ID for ${normalizedName}: ${teamId}`);
        const teamCacheKey = `team_${teamId}`;
        let cachedTeamData = cache.get(teamCacheKey);
        if (!cachedTeamData) {
          console.log(`Team data for team ID ${teamId} not in cache. Fetching from API.`);
          cachedTeamData = await rateLimiter.add(() =>
            nbaApiClient.get('/teams', { params: { id: teamId } })
          );
          if (Array.isArray(cachedTeamData) && cachedTeamData.length > 0) {
            cache.set(teamCacheKey, cachedTeamData, 24 * 60 * 60 * 1000);
          }
        } else {
          console.log(`Using cached team data for team ID ${teamId}`);
        }
        if (Array.isArray(cachedTeamData) && cachedTeamData.length > 0) {
          teamsToSearch = cachedTeamData;
        }
      }
    }

    // If still no teams, fetch all NBA teams
    if (teamsToSearch.length === 0) {
      console.log('Fetching all NBA teams');
      const teamsResponse = await rateLimiter.add(() =>
        nbaApiClient.get('/teams')
      );
      if (Array.isArray(teamsResponse)) {
        teamsToSearch = teamsResponse.filter(team => 
          team.nbaFranchise === true && 
          team.allStar === false
        );
      }
    }

    // Search for player in the chosen teams
    for (const team of teamsToSearch) {
      console.log(`Searching team: ${team.name}`);
      const playersResponse = await rateLimiter.add(() =>
        nbaApiClient.get('/players', {
          params: {
            team: team.id,
            season: season
          }
        })
      );

      if (Array.isArray(playersResponse)) {
        // Find matching player
        const player = playersResponse.find(p => {
          const playerFullName = `${p.firstname} ${p.lastname}`.toLowerCase();
          const searchNameLower = normalizedName.toLowerCase();
          return playerFullName === searchNameLower || 
                 playerFullName.includes(searchNameLower) || 
                 searchNameLower.includes(playerFullName);
        });

        if (player) {
          // Add team details to player object
          player.team = {
            id: team.id,
            name: team.name,
            nickname: team.nickname,
            code: team.code,
            logo: team.logo
          };

          // Cache the found player
          cache.set(playerCacheKey, player, 24 * 60 * 60 * 1000);
          return player;
        }
      }
    }

    console.log('Player not found in any team');
    return null;

  } catch (error) {
    console.error('Error in findPlayerByName:', error);
    if (error.response?.status === 429) {
      throw new Error('API rate limit exceeded. Please try again in a few seconds.');
    }
    throw error;
  }
}

export async function getPlayerStats(playerId, season) {
  // Adjust season if needed (NBA season starts in previous year)
  const currentDate = new Date();
  const currentSeason = currentDate.getMonth() < 9 ? currentDate.getFullYear() - 1 : currentDate.getFullYear();
  const targetSeason = season || currentSeason;

  const cacheKey = `player_stats_${playerId}_${targetSeason}`;
  const cachedStats = cache.get(cacheKey);
  if (cachedStats) {
    return cachedStats;
  }

  try {
    // Get player details first
    const playerResponse = await rateLimiter.add(() =>
      nbaApiClient.get('/players', {
        params: { id: playerId }
      })
    );

    if (!Array.isArray(playerResponse) || !playerResponse.length) {
      console.log('Player not found:', playerId);
      return null;
    }

    const player = playerResponse[0];

    // Get player statistics
    const statsResponse = await rateLimiter.add(() =>
      nbaApiClient.get('/players/statistics', {
        params: { 
          id: playerId,
          season: targetSeason
        },
      })
    );

    if (!Array.isArray(statsResponse) || !statsResponse.length) {
      console.log('No stats found for player:', playerId, 'season:', targetSeason);
      return null;
    }

    // Calculate averages from all games
    const totalGames = statsResponse.length;
    const totals = statsResponse.reduce((acc, game) => {
      acc.points += parseFloat(game.points || 0);
      acc.assists += parseFloat(game.assists || 0);
      acc.rebounds += parseFloat(game.totReb || 0);
      acc.steals += parseFloat(game.steals || 0);
      acc.blocks += parseFloat(game.blocks || 0);
      acc.turnovers += parseFloat(game.turnovers || 0);
      acc.fouls += parseFloat(game.pFouls || 0);
      acc.minutes += parseFloat(game.min ? game.min.split(':')[0] || 0 : 0);
      acc.fgm += parseFloat(game.fgm || 0);
      acc.fga += parseFloat(game.fga || 0);
      acc.tpm += parseFloat(game.tpm || 0);
      acc.tpa += parseFloat(game.tpa || 0);
      acc.ftm += parseFloat(game.ftm || 0);
      acc.fta += parseFloat(game.fta || 0);
      return acc;
    }, {
      points: 0, assists: 0, rebounds: 0, steals: 0, blocks: 0,
      turnovers: 0, fouls: 0, minutes: 0, fgm: 0, fga: 0,
      tpm: 0, tpa: 0, ftm: 0, fta: 0
    });

    // Calculate averages and percentages
    const averages = {
      firstName: player.firstname,
      lastName: player.lastname,
      team: player.team,
      season: targetSeason,
      gamesPlayed: totalGames,
      stats: {
        points: +(totals.points / totalGames).toFixed(1),
        assists: +(totals.assists / totalGames).toFixed(1),
        rebounds: +(totals.rebounds / totalGames).toFixed(1),
        steals: +(totals.steals / totalGames).toFixed(1),
        blocks: +(totals.blocks / totalGames).toFixed(1),
        turnovers: +(totals.turnovers / totalGames).toFixed(1),
        fouls: +(totals.fouls / totalGames).toFixed(1),
        minutes: +(totals.minutes / totalGames).toFixed(1),
        fgp: +((totals.fgm / totals.fga) * 100).toFixed(1),
        tpp: +((totals.tpm / totals.tpa) * 100).toFixed(1),
        ftp: +((totals.ftm / totals.fta) * 100).toFixed(1)
      }
    };

    // Cache the processed stats
    cache.set(cacheKey, averages, 60 * 60 * 1000); // Cache for 1 hour
    return averages;
  } catch (error) {
    console.error('Error in getPlayerStats:', error);
    throw error;
  }
} 
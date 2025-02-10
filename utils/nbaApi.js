const NBA_API_KEY = process.env.NBA_API_KEY;
const NBA_API_HOST = 'api-nba-v1.p.rapidapi.com';

// Cache for API responses
const cache = new Map();
const RATE_LIMIT = {
  MAX_REQUESTS_PER_MINUTE: 30,
  REQUESTS: [],
  CACHE_DURATION: 60 * 60 * 1000, // Increase to 60 minutes
  REQUEST_TIMEOUT: 10000,
  PLAYER_CACHE_DURATION: 24 * 60 * 60 * 1000, // 24 hours for player data
  TEAM_CACHE_DURATION: 24 * 60 * 60 * 1000,   // 24 hours for team data
  STATS_CACHE_DURATION: 60 * 60 * 1000,       // 60 minutes for stats
  BATCH_SIZE: 5,                              // Process 5 requests at a time
  BATCH_INTERVAL: 2000                        // 2 second delay between batches
};

// Add global player cache
const playerCache = new Map();
const teamCache = new Map();
const statsCache = new Map();

// Team ID cache
let NBA_TEAMS = null;

// NBA API Endpoints - Complete mapping of available endpoints
const NBA_ENDPOINTS = {
  PLAYERS: {
    SEARCH: 'players',  // Search players
    STATS: 'players/statistics', // Player game stats
    SEASON_AVERAGES: 'players/seasons', // Player season averages
    INFO: 'players',  // Player details
    HEAD_TO_HEAD: 'players/h2h' // Head to head comparison
  },
  TEAMS: {
    LIST: 'teams',  // All teams
    INFO: 'teams',  // Team details
    STATS: 'teams/statistics', // Team stats
    STANDINGS: 'standings',  // Team standings
    SEASONS: 'teams/seasons' // Team seasons
  },
  GAMES: {
    LIST: 'games',  // List games
    LIVE: 'games/live', // Live games
    STATS: 'games/statistics', // Game statistics
    H2H: 'games/h2h'  // Head to head games
  },
  SEASONS: {
    LIST: 'seasons',  // Available seasons
    LEAGUES: 'leagues' // Available leagues
  },
  STATS: {
    LEADERS: 'season/leaders', // Season leaders
    STANDINGS: 'standings'  // League standings
  }
};

// Data pipeline types for different queries
const QUERY_PIPELINES = {
  PLAYER_STATS: {
    steps: [
      {
        endpoint: NBA_ENDPOINTS.PLAYERS.STATS,
        params: (query) => ({
          id: query.id,
          season: getCurrentSeason()
        })
      }
    ]
  },
  TEAM_STATS: {
    steps: [
      {
        endpoint: NBA_ENDPOINTS.TEAMS.INFO,
        params: (query) => ({ search: query.toLowerCase() })
      },
      {
        endpoint: NBA_ENDPOINTS.TEAMS.STATS,
        params: (teamId, season) => ({ id: teamId, season })
      },
      {
        endpoint: NBA_ENDPOINTS.TEAMS.STANDINGS,
        params: (teamId, season) => ({ team: teamId, season })
      }
    ]
  },
  GAME_STATS: {
    steps: [
      {
        endpoint: NBA_ENDPOINTS.GAMES.LIST,
        params: (date) => ({ date })
      },
      {
        endpoint: NBA_ENDPOINTS.GAMES.STATS,
        params: (gameId) => ({ id: gameId })
      }
    ]
  }
};

// Pipeline executor
async function executePipeline(pipelineType, initialParams) {
  const pipeline = QUERY_PIPELINES[pipelineType];
  if (!pipeline) throw new Error(`Unknown pipeline type: ${pipelineType}`);

  let data = initialParams;
  let results = {};

  for (const step of pipeline.steps) {
    const params = step.params(data);
    const response = await fetchFromAPI(step.endpoint, params);
    
    if (!response.response || response.response.length === 0) {
      console.log(`No data found for step ${step.endpoint}`);
      return null;
    }

    results[step.endpoint] = response.response;
    data = response.response[0]?.id || data;
  }

  return results;
}

// Initialize NBA teams data
async function initNBATeams() {
  try {
    if (NBA_TEAMS) return NBA_TEAMS;
    
    console.log('Initializing NBA teams data...');
    const response = await fetchFromAPI('teams');
    
    if (!response.response) {
      throw new Error('Failed to fetch teams data');
    }
    
    // Filter for NBA franchises only and ensure they have valid data
    NBA_TEAMS = response.response.filter(team => 
      team.nbaFranchise === true && // Must be an NBA franchise
      team.name && // Must have a name
      team.leagues?.standard?.conference && // Must be in a conference
      !team.allStar // Exclude all-star teams
    ).reduce((acc, team) => {
      // Only include if it has all required fields
      if (team.id && team.name && team.nickname && team.code && team.city) {
        acc[team.id] = {
          name: team.name.trim(),
          nickname: team.nickname.trim(),
          code: team.code.trim(),
          city: team.city.trim(),
          logo: team.logo || null
        };
      }
      return acc;
    }, {});
    
    console.log('NBA teams initialized:', Object.keys(NBA_TEAMS).length, 'teams found');
    return NBA_TEAMS;
  } catch (error) {
    console.error('Error initializing NBA teams:', error);
    return null;
  }
}

// Known star player team mappings
const STAR_PLAYERS = {
  'trae young': 1,  // Atlanta Hawks
  'lebron james': 14, // Lakers
  'stephen curry': 11, // Warriors
  'giannis antetokounmpo': 17, // Bucks
  'joel embiid': 24, // 76ers
  'luka doncic': 8, // Mavericks
  'jayson tatum': 2, // Celtics
  'devin booker': 23, // Suns
  'nikola jokic': 9, // Nuggets
  'kevin durant': 24, // Suns
};

// Enhanced fetchFromAPI with better batching and backoff
async function fetchFromAPI(endpoint, params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const cacheKey = `${endpoint}?${queryString}`;
  
  // Determine cache duration based on endpoint type
  let cacheDuration = RATE_LIMIT.CACHE_DURATION;
  if (endpoint.includes('players') && !endpoint.includes('statistics')) {
    cacheDuration = RATE_LIMIT.PLAYER_CACHE_DURATION;
  } else if (endpoint.includes('teams')) {
    cacheDuration = RATE_LIMIT.TEAM_CACHE_DURATION;
  } else if (endpoint.includes('statistics')) {
    cacheDuration = RATE_LIMIT.STATS_CACHE_DURATION;
  }

  // Check cache first with longer durations
  const cachedData = cache.get(cacheKey);
  if (cachedData && Date.now() - cachedData.timestamp < cacheDuration) {
    console.log('Using cached data for:', cacheKey);
    return cachedData.data;
  }

  // Clean up old requests
  const now = Date.now();
  RATE_LIMIT.REQUESTS = RATE_LIMIT.REQUESTS.filter(time => 
    now - time < 60000
  );

  // If we're over the rate limit, wait for the next batch window
  if (RATE_LIMIT.REQUESTS.length >= RATE_LIMIT.MAX_REQUESTS_PER_MINUTE) {
    const oldestRequest = RATE_LIMIT.REQUESTS[0];
    const timeToWait = 60000 - (now - oldestRequest);
    console.log(`Rate limit reached. Waiting ${Math.ceil(timeToWait/1000)}s before next request`);
    
    // Return cached data if available, even if expired
    if (cachedData) {
      console.log('Using expired cache while waiting for rate limit');
      return cachedData.data;
    }
    
    // Implement exponential backoff
    const backoffTime = Math.min(timeToWait, 60000); // Cap at 60 seconds
    await new Promise(resolve => setTimeout(resolve, backoffTime));
    return fetchFromAPI(endpoint, params);
  }

  // Add this request to the tracking array
  RATE_LIMIT.REQUESTS.push(now);

  // If we have a batch in progress, wait for the next interval
  const currentBatchSize = RATE_LIMIT.REQUESTS.filter(time => now - time < RATE_LIMIT.BATCH_INTERVAL).length;
  if (currentBatchSize >= RATE_LIMIT.BATCH_SIZE) {
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT.BATCH_INTERVAL));
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), RATE_LIMIT.REQUEST_TIMEOUT);

    const response = await fetch(`https://${NBA_API_HOST}/${endpoint}?${queryString}`, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': NBA_API_HOST,
        'x-rapidapi-key': NBA_API_KEY
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    // Handle rate limiting with smarter backoff
    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
      console.log(`Rate limited. Waiting ${retryAfter}s before retry`);
      
      // Return cached data if available, even if expired
      if (cachedData) {
        console.log('Using expired cache during rate limit');
        return cachedData.data;
      }
      
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      return fetchFromAPI(endpoint, params);
    }

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    
    // Cache successful responses
    cache.set(cacheKey, {
      timestamp: now,
      data
    });

    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('Request timeout:', endpoint);
      // Return cached data if available, even if expired
      if (cachedData) {
        console.log('Using expired cache after timeout');
        return cachedData.data;
      }
      throw new Error('Request timeout');
    }
    throw error;
  }
}

// Enhanced findPlayerByName with caching
export async function findPlayerByName(name) {
  try {
    console.log('Searching for player:', name);
    const searchName = name.toLowerCase();
    
    // Check player cache first
    const cachedPlayer = playerCache.get(searchName);
    if (cachedPlayer && Date.now() - cachedPlayer.timestamp < RATE_LIMIT.PLAYER_CACHE_DURATION) {
      console.log('Using cached player data for:', searchName);
      return cachedPlayer.data;
    }

    // Step 1: Search for player by name
    const searchResponse = await fetchFromAPI(NBA_ENDPOINTS.PLAYERS.SEARCH, {
      search: searchName
    });
    
    if (!searchResponse.response || searchResponse.response.length === 0) {
      console.log('No direct search results, trying team roster search');
      return await findPlayerByTeamRoster(searchName);
    }

    // Step 2: Find best match from search results
    const player = findBestPlayerMatch(searchResponse.response, searchName);
    if (!player) {
      console.log('No matching player in search results');
      return null;
    }

    // Step 3: Get additional player info
    const playerInfo = await fetchFromAPI(NBA_ENDPOINTS.PLAYERS.INFO, {
      id: player.id
    });

    // Step 4: Get team info
    const teamInfo = await getTeamInfo(player.team?.id);

    // Step 5: Combine all data
    const formattedPlayer = formatPlayerData(player, playerInfo, teamInfo);

    // Cache the result
    playerCache.set(searchName, {
      timestamp: Date.now(),
      data: formattedPlayer
    });

    return formattedPlayer;
  } catch (error) {
    console.error('Error in player search pipeline:', error);
    return null;
  }
}

// Helper function to find player through team rosters
async function findPlayerByTeamRoster(searchName) {
  // Initialize teams if needed
  const teams = await initNBATeams();
  if (!teams) return null;

  // Try known team first
  const knownTeamId = STAR_PLAYERS[searchName];
  if (knownTeamId) {
    const player = await searchTeamRoster(knownTeamId, searchName);
    if (player) return player;
  }

  // If not found, search all team rosters (as last resort)
  for (const teamId of Object.keys(teams)) {
    const player = await searchTeamRoster(teamId, searchName);
    if (player) return player;
  }

  return null;
}

// Helper function to search a team's roster
async function searchTeamRoster(teamId, searchName) {
  const response = await fetchFromAPI(NBA_ENDPOINTS.PLAYERS.SEARCH, {
    team: teamId,
    season: getCurrentSeason()
  });

  if (!response.response || response.response.length === 0) return null;

  const player = findBestPlayerMatch(response.response, searchName);
  if (!player) return null;

  const teamInfo = await getTeamInfo(teamId);
  return formatPlayerData(player, null, teamInfo);
}

// Helper function to find best matching player from results
function findBestPlayerMatch(players, searchName) {
  return players.find(p => {
    if (!p.firstname || !p.lastname) return false;
    const fullName = `${p.firstname} ${p.lastname}`.toLowerCase();
    const searchParts = searchName.split(' ');
    return searchParts.every(part => fullName.includes(part));
  });
}

// Helper function to get team info
async function getTeamInfo(teamId) {
  if (!teamId) return null;
  
  // Try cache first
  if (NBA_TEAMS && NBA_TEAMS[teamId]) {
    return NBA_TEAMS[teamId];
  }

  // If not in cache, fetch team info
  const response = await fetchFromAPI(NBA_ENDPOINTS.TEAMS.INFO, {
    id: teamId
  });

  if (!response.response || response.response.length === 0) return null;

  const team = response.response[0];
  return {
    id: team.id,
    name: team.name,
    nickname: team.nickname,
    code: team.code,
    city: team.city,
    logo: team.logo
  };
}

// Helper function to format player data
function formatPlayerData(player, playerInfo, teamInfo) {
  return {
    id: player.id,
    firstName: player.firstname,
    lastName: player.lastname,
    position: player.leagues?.standard?.pos || 'Unknown',
    height: player.height?.feets ? 
      `${player.height.feets}'${player.height.inches}"` : 'Unknown',
    weight: player.weight?.pounds ? 
      `${player.weight.pounds} lbs` : 'Unknown',
    college: player.college || 'Unknown',
    active: player.leagues?.standard?.active || false,
    team: teamInfo ? {
      id: teamInfo.id,
      name: teamInfo.name,
      nickname: teamInfo.nickname,
      code: teamInfo.code,
      logo: teamInfo.logo
    } : null
  };
}

// Enhanced getPlayerStats with better caching
export async function getPlayerStats(playerId) {
  try {
    console.log('Getting stats for player:', playerId);
    
    // Generate cache key
    const cacheKey = typeof playerId === 'object' 
      ? `stats_${playerId.player}_${playerId.stat || 'all'}_${getCurrentSeason()}`
      : `stats_${playerId}_all_${getCurrentSeason()}`;

    // Check stats cache first
    const cachedStats = statsCache.get(cacheKey);
    if (cachedStats && Date.now() - cachedStats.timestamp < RATE_LIMIT.STATS_CACHE_DURATION) {
      console.log('Using cached stats for:', cacheKey);
      return cachedStats.data;
    }

    // Get player info and stats
    let playerInfo;
    let playerIdToUse;
    let requestedStat;
    
    if (typeof playerId === 'object') {
      const playerName = playerId.player;
      requestedStat = playerId.stat;
      // First find the player to get their ID
      playerInfo = await findPlayerByName(playerName);
      if (!playerInfo) {
        return {
          role: 'assistant',
          type: 'text',
          content: `I couldn't find a player named "${playerName}". Please check the spelling and try again.`
        };
      }
      playerIdToUse = playerInfo.id;
    } else {
      playerIdToUse = playerId;
      // If we only have ID, get player info
      const searchResponse = await fetchFromAPI(NBA_ENDPOINTS.PLAYERS.INFO, {
        id: playerIdToUse
      });
      if (searchResponse.response && searchResponse.response.length > 0) {
        const player = searchResponse.response[0];
        const teamInfo = await getTeamInfo(player.team?.id);
        playerInfo = formatPlayerData(player, null, teamInfo);
      }
    }

    const response = await fetchFromAPI('players/statistics', {
      id: playerIdToUse,
      season: getCurrentSeason()
    });

    if (!response.response || response.response.length === 0) {
      return {
        role: 'assistant',
        type: 'text',
        content: 'No stats available for this player this season.'
      };
    }

    // Process game stats
    const gamesPlayed = response.response.filter(game => 
      game.min && game.min !== '0:00' && game.min !== '' && 
      game.points !== null && game.points !== undefined
    );

    if (gamesPlayed.length === 0) {
      return {
        role: 'assistant',
        type: 'text',
        content: 'No games played this season.'
      };
    }

    // Calculate averages
    const totals = gamesPlayed.reduce((acc, game) => ({
      points: acc.points + (game.points || 0),
      assists: acc.assists + (game.assists || 0),
      rebounds: acc.rebounds + (game.totReb || 0),
      steals: acc.steals + (game.steals || 0),
      blocks: acc.blocks + (game.blocks || 0),
      minutes: acc.minutes + parseFloat(game.min || '0'),
      fgm: acc.fgm + (game.fgm || 0),
      fga: acc.fga + (game.fga || 0),
      tpm: acc.tpm + (game.tpm || 0),
      tpa: acc.tpa + (game.tpa || 0),
      ftm: acc.ftm + (game.ftm || 0),
      fta: acc.fta + (game.fta || 0),
      turnovers: acc.turnovers + (game.turnovers || 0),
      fouls: acc.fouls + (game.pFouls || 0)
    }), {
      points: 0, assists: 0, rebounds: 0, steals: 0, blocks: 0,
      minutes: 0, fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0,
      turnovers: 0, fouls: 0
    });

    const averages = {
      points: (totals.points / gamesPlayed.length).toFixed(1),
      assists: (totals.assists / gamesPlayed.length).toFixed(1),
      rebounds: (totals.rebounds / gamesPlayed.length).toFixed(1),
      steals: (totals.steals / gamesPlayed.length).toFixed(1),
      blocks: (totals.blocks / gamesPlayed.length).toFixed(1),
      minutes: (totals.minutes / gamesPlayed.length).toFixed(1),
      fgp: ((totals.fgm / totals.fga) * 100).toFixed(1),
      tpp: ((totals.tpm / totals.tpa) * 100).toFixed(1),
      ftp: ((totals.ftm / totals.fta) * 100).toFixed(1),
      turnovers: (totals.turnovers / gamesPlayed.length).toFixed(1),
      fouls: (totals.fouls / gamesPlayed.length).toFixed(1)
    };

    // Format data for PlayerStatsCard
    const formattedStats = {
      firstName: playerInfo?.firstName || '',
      lastName: playerInfo?.lastName || '',
      team: playerInfo?.team || null,
      season: getCurrentSeason(),
      gamesPlayed: gamesPlayed.length,
      ...averages
    };

    console.log('Player Info:', playerInfo);
    console.log('Formatted Stats:', formattedStats);

    const result = {
      role: 'assistant',
      type: 'player_stats',
      content: formattedStats
    };

    // Cache the result
    statsCache.set(cacheKey, {
      timestamp: Date.now(),
      data: result
    });

    return result;
  } catch (error) {
    console.error('Error in getPlayerStats:', error);
    return {
      role: 'assistant',
      type: 'text',
      content: 'Error retrieving player stats. Please try again later.'
    };
  }
}

// Get team stats with complete pipeline
export async function getTeamStats(teamId, season = getCurrentSeason()) {
  try {
    const results = await executePipeline('TEAM_STATS', {
      teamId,
      season
    });

    if (!results) return null;

    const teamInfo = results[NBA_ENDPOINTS.TEAMS.INFO][0];
    const stats = results[NBA_ENDPOINTS.TEAMS.STATS][0];
    const standings = results[NBA_ENDPOINTS.TEAMS.STANDINGS][0];

    return {
      team: {
        id: teamInfo.id,
        name: teamInfo.name,
        nickname: teamInfo.nickname,
        code: teamInfo.code,
        city: teamInfo.city,
        logo: teamInfo.logo
      },
      stats: {
        games: stats.games,
        wins: standings.win,
        losses: standings.loss,
        winPercentage: standings.winPercentage,
        points: stats.points,
        pointsAgainst: stats.pointsAgainst,
        streak: standings.streak
      }
    };
  } catch (error) {
    console.error('Error in team stats pipeline:', error);
    return null;
  }
}

// Get live game stats
export async function getLiveGameStats() {
  try {
    const response = await fetchFromAPI(NBA_ENDPOINTS.GAMES.LIVE);
    if (!response.response || response.response.length === 0) return [];

    return response.response.map(game => ({
      id: game.id,
      status: game.status,
      period: game.period,
      clock: game.clock,
      arena: game.arena,
      teams: {
        home: {
          id: game.teams.home.id,
          name: game.teams.home.name,
          score: game.scores.home.points
        },
        away: {
          id: game.teams.away.id,
          name: game.teams.away.name,
          score: game.scores.away.points
        }
      }
    }));
  } catch (error) {
    console.error('Error getting live games:', error);
    return [];
  }
}

// Get season leaders
export async function getSeasonLeaders(season = getCurrentSeason(), category = 'points') {
  try {
    const response = await fetchFromAPI(NBA_ENDPOINTS.STATS.LEADERS, {
      season,
      category
    });

    if (!response.response || response.response.length === 0) return [];

    return response.response.map(player => ({
      id: player.player.id,
      name: `${player.player.firstname} ${player.player.lastname}`,
      team: player.team.name,
      value: player.value,
      gamesPlayed: player.gamesPlayed
    }));
  } catch (error) {
    console.error('Error getting season leaders:', error);
    return [];
  }
}

// Get current season
function getCurrentSeason() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 0-based
  return month >= 10 ? year : year - 1;
}

// Format player stats for natural language response
export function formatPlayerStats(statsData) {
  if (!statsData || !statsData.averages) return null;
  
  console.log('Formatting stats:', statsData);
  
  // The data is already formatted correctly by getPlayerStats, just return it
  return {
    player: statsData.player,
    team: statsData.team,
    games: statsData.games,
    averages: statsData.averages
  };
}

// Helper function to parse minutes string (e.g. "32:45" -> 32.75)
function parseMinutes(minString) {
  if (!minString) return 0;
  const [minutes, seconds] = minString.split(':').map(Number);
  return minutes + (seconds / 60);
}

// Helper function to format minutes as string (e.g. 32.75 -> "32:45")
function formatMinutes(minutes) {
  const mins = Math.floor(minutes);
  const secs = Math.round((minutes - mins) * 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Add at the top with other constants
const QUERY_HANDLERS = {
  'PLAYER.STATS.SEASON': async (params) => {
    const stats = await getPlayerStats(params.player);
    return stats;
  },
  'PLAYER.STATS.LAST_N': async (params) => {
    const response = await fetchFromAPI('players/statistics', {
      id: params.player,
      season: getCurrentSeason(),
      last: params.games || 5
    });
    return processGameStats(response.response);
  },
  'TEAM.STATS.HOME': async (params) => {
    const response = await fetchFromAPI('teams/statistics', {
      id: params.team,
      season: getCurrentSeason(),
      location: 'home'
    });
    return processTeamStats(response.response, 'home');
  },
  'GAME.HEAD_TO_HEAD': async (params) => {
    const response = await fetchFromAPI('games/h2h', {
      team1: params.team1,
      team2: params.team2,
      season: getCurrentSeason()
    });
    return processH2HGames(response.response);
  },
  'BETTING.ODDS': async (params) => {
    // Placeholder for betting odds integration
    return {
      type: 'odds',
      team: params.team,
      odds: await getTeamOdds(params.team, params.bet_type)
    };
  }
};

// Add new helper functions
function processGameStats(games) {
  if (!games || games.length === 0) return null;
  
  return games.map(game => ({
    date: game.date,
    points: game.points,
    assists: game.assists,
    rebounds: game.totReb,
    steals: game.steals,
    blocks: game.blocks,
    minutes: game.min,
    fgp: game.fgp,
    tpp: game.tpp
  }));
}

function processTeamStats(stats, location) {
  if (!stats || stats.length === 0) return null;
  
  const locationStats = stats[0];
  return {
    games: locationStats.games,
    wins: locationStats.wins,
    losses: locationStats.losses,
    points: locationStats.points,
    pointsAgainst: locationStats.pointsAgainst,
    winPercentage: ((locationStats.wins / locationStats.games) * 100).toFixed(1)
  };
}

function processH2HGames(games) {
  if (!games || games.length === 0) return null;
  
  return games.map(game => 
    `${game.date}: ${game.away.team} ${game.away.score} @ ${game.home.team} ${game.home.score}`
  ).join('\n');
}

// Enhanced handleBasketballQuery with caching
export async function handleBasketballQuery(query) {
  console.log('Processing basketball query:', query);
  
  try {
    // Generate cache key for the entire query
    const queryKey = `query_${JSON.stringify(query)}`;
    const cachedQuery = cache.get(queryKey);
    if (cachedQuery && Date.now() - cachedQuery.timestamp < RATE_LIMIT.STATS_CACHE_DURATION) {
      console.log('Using cached query result for:', queryKey);
      return cachedQuery.data;
    }

    // Handle legacy format
    if (query.type === 'player_stats') {
      const stats = await handleLegacyPlayerStats(query);
      // Return the stats response directly without modification
      return stats;
    }
    
    // Handle new format queries
    const handler = QUERY_HANDLERS[query.type];
    if (handler) {
      const result = await handler(query.parameters);
      if (!result) {
        return {
          role: 'assistant',
          type: 'text',
          content: 'No data found for this query.'
        };
      }
      
      const formattedResponse = formatQueryResponse(query.type, result);
      
      // Cache the final response
      cache.set(queryKey, {
        timestamp: Date.now(),
        data: formattedResponse
      });

      return formattedResponse;
    }
    
    return {
      role: 'assistant',
      type: 'text',
      content: 'Unsupported query type.'
    };
  } catch (error) {
    console.error('Error handling basketball query:', error);
    return {
      role: 'assistant',
      type: 'text',
      content: 'Error processing query. Please try again.'
    };
  }
}

// Helper for legacy player stats queries
async function handleLegacyPlayerStats(query) {
  try {
    console.log('Handling legacy player stats query:', query);
    
    // Extract player name from query object
    let playerName;
    let requestedStat;
    
    if (typeof query === 'string') {
      playerName = query;
    } else if (typeof query === 'object') {
      playerName = query.player;
      requestedStat = query.stat;
    }
    
    if (!playerName) {
      return {
        role: 'assistant',
        type: 'text',
        content: 'Could not determine which player to search for. Please try again.'
      };
    }

    console.log('Looking up player:', playerName);
    const player = await findPlayerByName(playerName);
    
    if (!player) {
      return {
        role: 'assistant',
        type: 'text',
        content: `I couldn't find a player named "${playerName}". Please check the spelling and try again.`
      };
    }

    console.log('Found player:', player);
    const stats = await getPlayerStats(player.id);
    console.log('Retrieved stats:', stats);
    
    // Return the stats response directly
    return stats;
  } catch (error) {
    console.error('Error in handleLegacyPlayerStats:', error);
    return {
      role: 'assistant',
      type: 'text',
      content: 'Error processing player stats. Please try again.'
    };
  }
}

// Helper to format query responses
function formatQueryResponse(type, data) {
  switch (type) {
    case 'PLAYER.STATS.LAST_N':
      return {
        type: 'text',
        content: formatLastNGames(data)
      };
    case 'TEAM.STATS.HOME':
      return {
        type: 'text',
        content: formatHomeStats(data)
      };
    case 'GAME.HEAD_TO_HEAD':
      return {
        type: 'text',
        content: formatH2H(data)
      };
    default:
      return {
        type: 'text',
        content: JSON.stringify(data, null, 2)
      };
  }
}

// Response formatters
function formatLastNGames(games) {
  return `Last ${games.length} games:\n` +
    games.map(game => 
      `${game.date}: ${game.points} pts, ${game.rebounds} reb, ${game.assists} ast`
    ).join('\n');
}

function formatHomeStats(stats) {
  return `Home Record: ${stats.wins}-${stats.losses} (${stats.winPercentage}%)\n` +
         `Scoring: ${stats.points} PPG, Allowing: ${stats.pointsAgainst} PPG`;
}

function formatH2H(games) {
  return games.map(game => 
    `${game.date}: ${game.away.team} ${game.away.score} @ ${game.home.team} ${game.home.score}`
  ).join('\n');
}

// Add cache cleanup function
function cleanupCaches() {
  const now = Date.now();
  
  // Cleanup main cache
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > RATE_LIMIT.CACHE_DURATION) {
      cache.delete(key);
    }
  }
  
  // Cleanup player cache
  for (const [key, value] of playerCache.entries()) {
    if (now - value.timestamp > RATE_LIMIT.PLAYER_CACHE_DURATION) {
      playerCache.delete(key);
    }
  }
  
  // Cleanup team cache
  for (const [key, value] of teamCache.entries()) {
    if (now - value.timestamp > RATE_LIMIT.TEAM_CACHE_DURATION) {
      teamCache.delete(key);
    }
  }
  
  // Cleanup stats cache
  for (const [key, value] of statsCache.entries()) {
    if (now - value.timestamp > RATE_LIMIT.STATS_CACHE_DURATION) {
      statsCache.delete(key);
    }
  }
}

// Run cache cleanup every hour
setInterval(cleanupCaches, 60 * 60 * 1000);

export default {
  findPlayerByName,
  getPlayerStats,
  formatPlayerStats,
  handleBasketballQuery
}; 
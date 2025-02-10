const NBA_API_KEY = process.env.NBA_API_KEY;
const NBA_API_HOST = 'api-nba-v1.p.rapidapi.com';

// Unified cache system
const CACHE_TYPES = {
  PLAYER: 'player',
  TEAM: 'team',
  STATS: 'stats',
  QUERY: 'query'
};

const RATE_LIMIT = {
  MAX_REQUESTS_PER_MINUTE: 30,
  WINDOW: 60000,
  CACHE_DURATION: 60 * 60 * 1000,
  PLAYER_CACHE_DURATION: 24 * 60 * 60 * 1000,
  TEAM_CACHE_DURATION: 24 * 60 * 60 * 1000,
  STATS_CACHE_DURATION: 60 * 60 * 1000,
  REQUEST_TIMEOUT: 10000
};

// Unified cache implementation
const cache = {
  data: new Map(),
  
  set(key, value, type) {
    const cacheKey = `${type}_${key}`;
    this.data.set(cacheKey, {
      timestamp: Date.now(),
      data: value,
      type
    });
  },
  
  get(key, type) {
    const cacheKey = `${type}_${key}`;
    const entry = this.data.get(cacheKey);
    if (!entry) return null;
    
    const duration = RATE_LIMIT[`${type.toUpperCase()}_CACHE_DURATION`] || RATE_LIMIT.CACHE_DURATION;
    if (Date.now() - entry.timestamp > duration) {
      this.data.delete(cacheKey);
      return null;
    }
    return entry.data;
  },
  
  clear(type) {
    const now = Date.now();
    for (const [key, value] of this.data.entries()) {
      const duration = RATE_LIMIT[`${value.type.toUpperCase()}_CACHE_DURATION`] || RATE_LIMIT.CACHE_DURATION;
      if (now - value.timestamp > duration || (type && value.type === type)) {
        this.data.delete(key);
      }
    }
  }
};

// Rate limiter implementation
const RateLimiter = {
  requests: [],
  
  async acquire() {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < RATE_LIMIT.WINDOW);
    
    if (this.requests.length >= RATE_LIMIT.MAX_REQUESTS_PER_MINUTE) {
      const oldestRequest = this.requests[0];
      const waitTime = RATE_LIMIT.WINDOW - (now - oldestRequest);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.acquire();
    }
    
    this.requests.push(now);
    return true;
  }
};

// Error handlers
const API_ERROR_HANDLERS = {
  429: async (error, retryFn) => {
    const retryAfter = parseInt(error.headers.get('Retry-After') || '60');
    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
    return retryFn();
  },
  404: () => null,
  default: (error) => {
    console.error('API Error:', error);
    throw error;
  }
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

// Unified cache for player data including stats
const CACHE_KEYS = {
  PLAYER_WITH_STATS: (playerId, season) => `player_stats_${playerId}_${season}`,
  PLAYER_SEARCH: (name) => `player_search_${name.toLowerCase()}`,
  TEAM: (teamId) => `team_${teamId}`
};

// Batch request handler
const requestQueue = [];
const BATCH_SIZE = 3;
const BATCH_INTERVAL = 1000; // 1 second

async function processBatchRequests() {
  while (requestQueue.length > 0) {
    const batch = requestQueue.splice(0, BATCH_SIZE);
    await Promise.all(batch.map(request => request()));
    if (requestQueue.length > 0) {
      await new Promise(resolve => setTimeout(resolve, BATCH_INTERVAL));
    }
  }
}

// Enhanced player search with optimized caching
export async function findPlayerByName(name) {
  const searchName = name.toLowerCase();
  const cacheKey = CACHE_KEYS.PLAYER_SEARCH(searchName);
  
  // Check unified cache first
  const cachedData = cache.get(cacheKey, CACHE_TYPES.PLAYER);
  if (cachedData) {
    console.log('Cache hit for player:', searchName);
    return cachedData;
  }

  // Queue the search request
  const searchPromise = new Promise(async (resolve) => {
    try {
      // First, try to normalize the name using Venice AI
      const normalizedName = await normalizePlayerName(searchName);
      console.log('Normalized name:', normalizedName);
      
      // Try direct search with normalized name
      let searchResponse = await fetchFromAPI(NBA_ENDPOINTS.PLAYERS.SEARCH, {
        search: normalizedName
      });

      if (!searchResponse.response?.length) {
        // If no results, try with fuzzy matching on normalized name parts
        const nameParts = normalizedName.split(' ');
        const fuzzySearches = nameParts.map(part => 
          fetchFromAPI(NBA_ENDPOINTS.PLAYERS.SEARCH, { search: part })
        );
        
        const responses = await Promise.all(fuzzySearches);
        const allPlayers = responses.flatMap(r => r.response || []);
        searchResponse = { response: allPlayers };
      }

      const player = findBestPlayerMatch(searchResponse.response || [], normalizedName);
      if (!player) {
        resolve(null);
        return;
      }

      // Batch player info and stats requests
      const [playerInfo, currentStats] = await Promise.all([
        fetchFromAPI(NBA_ENDPOINTS.PLAYERS.INFO, { id: player.id }),
        fetchFromAPI(NBA_ENDPOINTS.PLAYERS.STATS, {
          id: player.id,
          season: getCurrentSeason()
        })
      ]);

      const teamInfo = player.team?.id ? 
        await getTeamInfo(player.team.id) : null;

      const formattedPlayer = formatPlayerData(
        player,
        playerInfo?.response?.[0] || null,
        teamInfo
      );

      // Cache the result
      cache.set(cacheKey, formattedPlayer, CACHE_TYPES.PLAYER);
      resolve(formattedPlayer);
    } catch (error) {
      console.error('Error in player search:', error);
      resolve(null);
    }
  });

  requestQueue.push(() => searchPromise);
  processBatchRequests();
  
  return searchPromise;
}

// Add AI-based name normalization
async function normalizePlayerName(searchName) {
  try {
    const { generateAIResponse } = require('./venice');
    const response = await generateAIResponse([{
      role: 'system',
      content: 'You are a helpful assistant that normalizes NBA player names to their official spelling. Return ONLY the normalized name, nothing else.'
    }, {
      role: 'user',
      content: `Normalize this NBA player name: ${searchName}`
    }]);

    // Extract just the normalized name from the response
    const normalizedName = response.content.trim().toLowerCase();
    return normalizedName;
  } catch (error) {
    console.error('Error normalizing name:', error);
    // Fall back to original name if AI normalization fails
    return searchName;
  }
}

// Improved player matching with fuzzy logic
function findBestPlayerMatch(players, searchName) {
  const searchParts = searchName.split(' ').map(part => part.toLowerCase());
  
  // Common name variations
  const nameVariations = {
    'peyton': ['payton'],
    'payton': ['peyton'],
    'nikola': ['nikola', 'nikolas'],
    'luka': ['luca'],
    'ja': ['ja', 'jah'],
    'deandre': ['deandre', "de'andre"],
    'demarcus': ['demarcus', "de'marcus"]
  };
  
  // First try exact match
  const exactMatch = players.find(p => {
    if (!p.firstname || !p.lastname) return false;
    const fullName = `${p.firstname} ${p.lastname}`.toLowerCase();
    return fullName === searchName;
  });
  
  if (exactMatch) return exactMatch;

  // Then try with name variations
  const matchWithVariations = players.find(p => {
    if (!p.firstname || !p.lastname) return false;
    const firstName = p.firstname.toLowerCase();
    const lastName = p.lastname.toLowerCase();
    
    return searchParts.every(part => {
      const variations = nameVariations[part] || [part];
      return variations.some(variant => 
        firstName.includes(variant) || lastName.includes(variant)
      );
    });
  });

  if (matchWithVariations) return matchWithVariations;

  // Finally try partial matches with at least 2 characters per part
  return players.find(p => {
    if (!p.firstname || !p.lastname) return false;
    const fullName = `${p.firstname} ${p.lastname}`.toLowerCase();
    return searchParts.every(part => 
      part.length >= 2 && (
        p.firstname.toLowerCase().includes(part) ||
        p.lastname.toLowerCase().includes(part)
      )
    );
  });
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

// Optimized stats retrieval with unified caching
export async function getPlayerStats(query) {
  try {
    // First find the player
    const player = await findPlayerByName(typeof query === 'object' ? query.player : String(query));
    
    if (!player) {
      return {
        role: 'assistant',
        type: 'text',
        content: `Couldn't find player information. Please check the spelling and try again.`
      };
    }

    const season = getCurrentSeason();
    const cacheKey = CACHE_KEYS.PLAYER_WITH_STATS(player.id, season);

    // Check unified cache
    const cachedStats = cache.get(cacheKey, CACHE_TYPES.STATS);
    if (cachedStats) {
      console.log('Cache hit for player stats:', player.id);
      // Ensure team info is included even in cached response
      if (!cachedStats.content.team && player.team) {
        cachedStats.content.team = player.team;
      }
      return cachedStats;
    }

    // Get current season stats
    console.log('Fetching stats for player:', player.firstName, player.lastName);
    const statsResponse = await fetchFromAPI(NBA_ENDPOINTS.PLAYERS.STATS, {
      id: player.id,
      season: season
    });

    // Process stats with fallback to previous season
    let stats = null;
    let note = null;

    if (!statsResponse.response?.length) {
      console.log('No current season stats, trying previous season...');
      const prevSeasonResponse = await fetchFromAPI(NBA_ENDPOINTS.PLAYERS.STATS, {
        id: player.id,
        season: season - 1
      });

      if (prevSeasonResponse.response?.length) {
        stats = processPlayerStats(prevSeasonResponse.response, season - 1);
        note = 'Stats shown are from previous season';
      }
    } else {
      stats = processPlayerStats(statsResponse.response, season);
    }

    if (!stats) {
      return {
        role: 'assistant',
        type: 'text',
        content: `No recent stats available for ${player.firstName} ${player.lastName}.`
      };
    }

    // Always include team info from player object
    const result = {
      role: 'assistant',
      type: 'player_stats',
      content: {
        ...stats,
        firstName: player.firstName,
        lastName: player.lastName,
        team: player.team || null, // Ensure team is included even if null
        note,
        season
      }
    };

    // Cache the result
    cache.set(cacheKey, result, CACHE_TYPES.STATS);
    return result;
  } catch (error) {
    console.error('Error getting player stats:', error);
    return {
      role: 'assistant',
      type: 'text',
      content: 'Error retrieving player statistics. Please try again.'
    };
  }
}

// Improved stats processing
function processPlayerStats(games, season) {
  if (!games || games.length === 0) return null;

  // Filter valid games
  const validGames = games.filter(game => 
    game.min && 
    game.min !== '0:00' && 
    game.min !== '' && 
    game.points !== null && 
    game.points !== undefined
  );

  if (validGames.length === 0) return null;

  // Calculate totals
  const totals = validGames.reduce((acc, game) => ({
    points: acc.points + (game.points || 0),
    assists: acc.assists + (game.assists || 0),
    rebounds: acc.rebounds + (game.totReb || 0),
    steals: acc.steals + (game.steals || 0),
    blocks: acc.blocks + (game.blocks || 0),
    minutes: acc.minutes + parseFloat(game.min ? game.min.split(':')[0] : '0'),
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

  // Calculate averages
  const gameCount = validGames.length;
  return {
    season,
    gamesPlayed: gameCount,
    points: (totals.points / gameCount).toFixed(1),
    assists: (totals.assists / gameCount).toFixed(1),
    rebounds: (totals.rebounds / gameCount).toFixed(1),
    steals: (totals.steals / gameCount).toFixed(1),
    blocks: (totals.blocks / gameCount).toFixed(1),
    minutes: (totals.minutes / gameCount).toFixed(1),
    fgp: totals.fga > 0 ? ((totals.fgm / totals.fga) * 100).toFixed(1) : '0.0',
    tpp: totals.tpa > 0 ? ((totals.tpm / totals.tpa) * 100).toFixed(1) : '0.0',
    ftp: totals.fta > 0 ? ((totals.ftm / totals.fta) * 100).toFixed(1) : '0.0',
    turnovers: (totals.turnovers / gameCount).toFixed(1),
    fouls: (totals.fouls / gameCount).toFixed(1)
  };
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

// Enhanced fetchFromAPI with better error handling and rate limiting
async function fetchFromAPI(endpoint, params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const cacheKey = `${endpoint}?${queryString}`;
  
  // Check cache first
  const cachedData = cache.get(cacheKey, CACHE_TYPES.QUERY);
  if (cachedData) {
    console.log('Cache hit for API call:', endpoint);
    return cachedData;
  }

  // Acquire rate limit token
  await RateLimiter.acquire();

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

    if (!response.ok) {
      const handler = API_ERROR_HANDLERS[response.status] || API_ERROR_HANDLERS.default;
      return handler(response, () => fetchFromAPI(endpoint, params));
    }

    const data = await response.json();
    cache.set(cacheKey, data, CACHE_TYPES.QUERY);
    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('Request timeout:', endpoint);
      throw new Error('Request timeout');
    }
    throw error;
  }
}

// Optimized basketball query handler
export async function handleBasketballQuery(query) {
  const queryKey = JSON.stringify(query);
  const cachedQuery = cache.get(queryKey, CACHE_TYPES.QUERY);
  if (cachedQuery) return cachedQuery;

  try {
    let result;
    if (query.type === 'player_stats') {
      result = await getPlayerStats(query);
    } else {
      const handler = QUERY_HANDLERS[query.type];
      if (!handler) {
        return {
          role: 'assistant',
          type: 'text',
          content: 'Unsupported query type.'
        };
      }
      result = await handler(query.parameters);
    }

    if (!result) {
      return {
        role: 'assistant',
        type: 'text',
        content: 'No data found for this query.'
      };
    }

    cache.set(queryKey, result, CACHE_TYPES.QUERY);
    return result;
  } catch (error) {
    console.error('Error handling basketball query:', error);
    return {
      role: 'assistant',
      type: 'text',
      content: 'Error processing query. Please try again.'
    };
  }
}

// Run cache cleanup periodically
setInterval(() => cache.clear(), RATE_LIMIT.CACHE_DURATION);

export default {
  findPlayerByName,
  getPlayerStats,
  formatPlayerStats,
  handleBasketballQuery
}; 
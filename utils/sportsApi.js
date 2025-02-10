const API_KEY = '35c66523c3msh9785798aadedfeap1c2b3cjsneeb3d3b19965';
const BASKETBALL_BASE_URL = 'https://api-nba-v1.p.rapidapi.com';

const headers = {
  'x-rapidapi-host': 'api-nba-v1.p.rapidapi.com',
  'x-rapidapi-key': API_KEY
};

// Cache for API responses
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
const EXTENDED_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes for rate limit scenarios

// Track API calls to prevent overwhelming
let lastApiCall = 0;
const API_CALL_DELAY = 2000; // 2 seconds between calls
const MAX_BATCH_SIZE = 3; // Maximum number of concurrent requests
const BATCH_DELAY = 10000; // 10 seconds between batches

// Helper function to wait between API calls
const waitBetweenCalls = async () => {
  const now = Date.now();
  const timeSinceLastCall = now - lastApiCall;
  if (timeSinceLastCall < API_CALL_DELAY) {
    await new Promise(resolve => setTimeout(resolve, API_CALL_DELAY - timeSinceLastCall));
  }
  lastApiCall = Date.now();
};

// Helper function to format date for API
function formatDateForAPI(date) {
  // Create date in UTC
  const utcDate = new Date(date);
  
  // Format in YYYY-MM-DD using UTC date components
  const year = utcDate.getFullYear();
  const month = String(utcDate.getMonth() + 1).padStart(2, '0');
  const day = String(utcDate.getDate()).padStart(2, '0');
  
  const formatted = `${year}-${month}-${day}`;
  
  console.log('Date formatting:', {
    input: date.toISOString(),
    formatted: formatted,
    note: 'Using local date components for API request'
  });
  
  return formatted;
}

// Helper function to validate date range
function isValidDateRange(date) {
  // Use actual current date, not the passed in date
  const today = new Date(2025, 1, 10); // Hardcode to Feb 10, 2025 for now
  today.setUTCHours(0, 0, 0, 0);
  
  const selectedDate = new Date(date);
  selectedDate.setUTCHours(0, 0, 0, 0);
  
  // Allow dates from 1 year ago up to 7 days in the future
  const oneYearAgo = new Date(today);
  oneYearAgo.setUTCFullYear(oneYearAgo.getUTCFullYear() - 1);
  
  const sevenDaysFromNow = new Date(today);
  sevenDaysFromNow.setUTCDate(sevenDaysFromNow.getUTCDate() + 7);
  
  const isValid = selectedDate >= oneYearAgo && selectedDate <= sevenDaysFromNow;
  
  if (!isValid) {
    console.log(`Date ${selectedDate.toISOString()} is outside valid range:`, {
      minDate: oneYearAgo.toISOString(),
      maxDate: sevenDaysFromNow.toISOString(),
      selectedDate: selectedDate.toISOString(),
      today: today.toISOString()
    });
  }
  
  return isValid;
}

// Helper function to get cache key
function getCacheKey(date) {
  return `games_${date}`;
}

export async function fetchBasketballGames() {
  try {
    // Get current date and next 2 days
    const today = new Date();
    const dates = [
      today,
      new Date(today.getTime() + 24 * 60 * 60 * 1000),  // tomorrow
      new Date(today.getTime() + 48 * 60 * 60 * 1000)   // day after tomorrow
    ];

    let allGames = [];
    const season = getCurrentSeason();

    for (const date of dates) {
      const formattedDate = formatDateForAPI(date);
      console.log(`Fetching games for date: ${formattedDate}`);

      const cacheKey = getCacheKey(formattedDate);
      const cachedData = cache.get(cacheKey);

      if (cachedData) {
        const { data, timestamp, isRateLimited } = cachedData;
        const cacheAge = Date.now() - timestamp;
        const validDuration = isRateLimited ? EXTENDED_CACHE_DURATION : CACHE_DURATION;
        
        if (cacheAge < validDuration) {
          console.log('Using cached data for:', formattedDate);
          allGames = [...allGames, ...data];
          continue;
        }
        cache.delete(cacheKey);
      }

      await waitBetweenCalls();

      const params = new URLSearchParams({
        date: formattedDate,
        league: 'standard',
        season: season.toString()
      });

      const url = `${BASKETBALL_BASE_URL}/games?${params.toString()}`;
      console.log('API URL:', url);

      const response = await fetch(url, { method: 'GET', headers });

      if (response.status === 429) {
        console.log('Rate limit exceeded for date:', formattedDate);
        if (cachedData) {
          allGames = [...allGames, ...cachedData.data];
        }
        continue;
      }

      if (!response.ok) {
        console.error(`API Error for date ${formattedDate}:`, response.status);
        if (cachedData) {
          allGames = [...allGames, ...cachedData.data];
        }
        continue;
      }

      const data = await response.json();
      console.log(`API Response for ${formattedDate}:`, data);

      if (data.response && data.response.length > 0) {
        const formattedGames = data.response
          .filter(game => game.league === 'standard')
          .map(formatGameData)
          .filter(game => game !== null);

        cache.set(cacheKey, {
          data: formattedGames,
          timestamp: Date.now(),
          isRateLimited: false
        });

        allGames = [...allGames, ...formattedGames];
      }
    }

    // Sort all games by date and filter out finished games
    return allGames
      .filter(game => game.status !== 'Finished')
      .sort((a, b) => new Date(a.date) - new Date(b.date));

  } catch (error) {
    console.error('Error fetching basketball games:', error);
    return [];
  }
}

// Helper function to get current NBA season
function getCurrentSeason() {
  const today = new Date();
  const month = today.getMonth(); // 0-11
  const year = today.getFullYear();
  
  // NBA season spans two years, starting in October
  // If we're in Oct-Dec, we're in the first year of the season
  // If we're in Jan-Jun, we're in the second year of the season
  if (month >= 9) { // October onwards
    return year;
  } else {
    return year - 1;
  }
}

// Format API game data to match our UI structure
export function formatGameData(apiGame) {
  try {
    if (!apiGame || !apiGame.id) {
      console.log('Invalid game data:', apiGame);
      return null;
    }

    // Format the game data with more lenient checks
    const formattedGame = {
      id: apiGame.id,
      league: 'NBA',
      status: apiGame.status?.long || 'Not Started',
      quarter: apiGame.periods?.current ? `Q${apiGame.periods.current}` : '',
      timeLeft: apiGame.status?.clock || '',
      team1: {
        name: apiGame.teams?.home?.name || 'TBD',
        logo: apiGame.teams?.home?.logo || '',
        score: parseInt(apiGame.scores?.home?.points || '0'),
        quarterScores: {
          q1: parseInt(apiGame.scores?.home?.linescore?.[0] || '0'),
          q2: parseInt(apiGame.scores?.home?.linescore?.[1] || '0'),
          q3: parseInt(apiGame.scores?.home?.linescore?.[2] || '0'),
          q4: parseInt(apiGame.scores?.home?.linescore?.[3] || '0'),
          ot: apiGame.scores?.home?.linescore?.[4] ? parseInt(apiGame.scores.home.linescore[4]) : 0
        }
      },
      team2: {
        name: apiGame.teams?.visitors?.name || 'TBD',
        logo: apiGame.teams?.visitors?.logo || '',
        score: parseInt(apiGame.scores?.visitors?.points || '0'),
        quarterScores: {
          q1: parseInt(apiGame.scores?.visitors?.linescore?.[0] || '0'),
          q2: parseInt(apiGame.scores?.visitors?.linescore?.[1] || '0'),
          q3: parseInt(apiGame.scores?.visitors?.linescore?.[2] || '0'),
          q4: parseInt(apiGame.scores?.visitors?.linescore?.[3] || '0'),
          ot: apiGame.scores?.visitors?.linescore?.[4] ? parseInt(apiGame.scores.visitors.linescore[4]) : 0
        }
      },
      venue: apiGame.arena ? `${apiGame.arena.name || ''}, ${apiGame.arena.city || ''}, ${apiGame.arena.state || ''}`.trim() : null,
      date: new Date(apiGame.date?.start || Date.now())
    };

    console.log('Formatted game:', formattedGame);
    return formattedGame;
  } catch (error) {
    console.error('Error formatting game:', error);
    console.log('Failed game data:', apiGame);
    return null;
  }
}

// Note: Odds functionality will need to be implemented with a different API
// For now, returning null for odds
export async function fetchGameOdds(gameId) {
  console.log('Odds functionality not yet implemented for the new API');
  return null;
} 
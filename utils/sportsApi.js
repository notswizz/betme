const API_KEY = '35c66523c3msh9785798aadedfeap1c2b3cjsneeb3d3b19965';
const BASKETBALL_BASE_URL = 'https://api-basketball.p.rapidapi.com';

const headers = {
  'x-rapidapi-host': 'api-basketball.p.rapidapi.com',
  'x-rapidapi-key': API_KEY
};

// NBA specific constants
const NBA_LEAGUE_ID = 12;

// Cache for API responses
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Function to determine the NBA season based on date
function getNBASeason(date) {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-11
  
  // If we're in October or later, it's the current year's season
  // Otherwise it's the previous year's season
  const seasonStartYear = month >= 9 ? year : year - 1;
  return `${seasonStartYear}-${seasonStartYear + 1}`;
}

// Helper function to format date for API (in UTC)
function formatDateForAPI(date) {
  // Create a new date object at midnight local time for the selected date
  const localDate = new Date(date);
  localDate.setHours(0, 0, 0, 0);
  
  // Get the date string in YYYY-MM-DD format
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, '0');
  const day = String(localDate.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

// Helper function to get cache key
function getCacheKey(date, season) {
  return `games_${date}_${season}`;
}

export async function fetchBasketballGames(date = new Date()) {
  try {
    // Format the date properly for the API
    const formattedDate = formatDateForAPI(date);
    const season = getNBASeason(new Date(date));
    const cacheKey = getCacheKey(formattedDate, season);

    // Check cache first
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      const { data, timestamp } = cachedData;
      if (Date.now() - timestamp < CACHE_DURATION) {
        console.log('Returning cached data for:', formattedDate);
        return data;
      } else {
        cache.delete(cacheKey);
      }
    }

    console.log(`Fetching NBA games for date: ${formattedDate}, season: ${season}`);
    
    // Add timezone parameter to ensure consistent date handling
    const response = await fetch(
      `${BASKETBALL_BASE_URL}/games?` + 
      new URLSearchParams({
        league: NBA_LEAGUE_ID.toString(),
        season,
        date: formattedDate,
        timezone: 'America/New_York'
      }),
      {
        method: 'GET',
        headers
      }
    );

    // Log rate limit information
    const rateLimit = {
      limit: response.headers.get('x-ratelimit-requests-limit'),
      remaining: response.headers.get('x-ratelimit-requests-remaining')
    };
    console.log('Rate limit info:', rateLimit);

    // Handle rate limiting
    if (response.status === 429) {
      console.log('Rate limit exceeded. Using cached data if available...');
      if (cachedData) {
        return cachedData.data;
      }
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    console.log('API Response:', data);

    // Cache the successful response
    cache.set(cacheKey, {
      data: data.response || [],
      timestamp: Date.now()
    });

    return data.response || [];
  } catch (error) {
    console.error('Error fetching basketball games:', error);
    throw error;
  }
}

export async function fetchBasketballLeagues() {
  try {
    const response = await fetch(`${BASKETBALL_BASE_URL}/leagues`, {
      method: 'GET',
      headers,
      redirect: 'follow'
    });

    // Log response headers for debugging
    console.log('Leagues rate limit:', {
      limit: response.headers.get('x-ratelimit-requests-limit'),
      remaining: response.headers.get('x-ratelimit-requests-remaining')
    });

    if (!response.ok) {
      console.error('API Response Status:', response.status);
      throw new Error('Failed to fetch basketball leagues');
    }

    const data = await response.json();
    console.log('Leagues API Response:', data);
    return data.response || [];
  } catch (error) {
    console.error('Error fetching basketball leagues:', error);
    throw error;
  }
}

// Format API game data to match our UI structure
export function formatGameData(apiGame) {
  if (!apiGame || !apiGame.teams) {
    console.error('Invalid game data:', apiGame);
    return null;
  }

  // Get formatted time and status
  const gameTime = apiGame.time || '';
  const gameStatus = apiGame.status?.short || 'NS';
  
  // Map status codes to display text
  const statusDisplay = {
    'NS': 'Not Started',
    'FT': 'Final',
    'HT': 'Halftime',
    'Q1': '1st Quarter',
    'Q2': '2nd Quarter',
    'Q3': '3rd Quarter',
    'Q4': '4th Quarter',
    'AOT': 'After OT',
    'POST': 'Postponed'
  };

  // Convert API date to local date
  const gameDate = new Date(apiGame.date);

  return {
    id: apiGame.id,
    league: 'NBA',
    status: gameStatus,
    quarter: statusDisplay[gameStatus] || apiGame.status?.long || '',
    timeLeft: gameTime,
    team1: {
      name: apiGame.teams?.home?.name || 'TBD',
      logo: apiGame.teams?.home?.logo || '',
      score: apiGame.scores?.home?.total || 0,
      quarterScores: {
        q1: apiGame.scores?.home?.quarter_1 || 0,
        q2: apiGame.scores?.home?.quarter_2 || 0,
        q3: apiGame.scores?.home?.quarter_3 || 0,
        q4: apiGame.scores?.home?.quarter_4 || 0,
        ot: apiGame.scores?.home?.over_time || 0
      }
    },
    team2: {
      name: apiGame.teams?.away?.name || 'TBD',
      logo: apiGame.teams?.away?.logo || '',
      score: apiGame.scores?.away?.total || 0,
      quarterScores: {
        q1: apiGame.scores?.away?.quarter_1 || 0,
        q2: apiGame.scores?.away?.quarter_2 || 0,
        q3: apiGame.scores?.away?.quarter_3 || 0,
        q4: apiGame.scores?.away?.quarter_4 || 0,
        ot: apiGame.scores?.away?.over_time || 0
      }
    },
    venue: apiGame.venue || null,
    date: gameDate
  };
} 
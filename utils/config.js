import dotenv from 'dotenv';

dotenv.config();

// API Configuration
export const NBA_API_KEY = process.env.NBA_API_KEY;
export const NBA_API_HOST = 'api-nba-v1.p.rapidapi.com';

// Cache Configuration
export const CACHE_CONFIG = {
  DEFAULT_DURATION: 300000,    // 5 minutes
  STATS_DURATION: 3600000,     // 1 hour for player stats
  GAMES_DURATION: 300000       // 5 minutes for games
};

// Season Configuration
export const getCurrentSeason = () => {
  // Current NBA season is 2024-25
  return '2024';  // Hardcode for now since we're in the 2024-25 season
};

// Debug logging for season
console.log('Current NBA Season:', getCurrentSeason());

// Validate required environment variables
if (!NBA_API_KEY) {
  console.error('ERROR: NBA_API_KEY is not set in environment variables');
  throw new Error('Missing required environment variable: NBA_API_KEY');
}

// Validate API key format
if (NBA_API_KEY && NBA_API_KEY.length < 16) {
  console.error('ERROR: NBA_API_KEY appears to be invalid (wrong format or length)');
  throw new Error('Invalid NBA_API_KEY format. Please check your .env file');
} 
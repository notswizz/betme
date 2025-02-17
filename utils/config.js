import dotenv from 'dotenv';

dotenv.config();

// API Configuration
export const NBA_API_KEY = process.env.NBA_API_KEY;
export const NBA_API_HOST = 'api-nba-v1.p.rapidapi.com';

// Cache Configuration
export const CACHE_CONFIG = {
  DEFAULT_DURATION: 60000, // 1 minute
  LONG_DURATION: 300000,  // 5 minutes
  SHORT_DURATION: 30000   // 30 seconds
};

// Betting configuration
export const BETTING_CONFIG = {
  // Number of votes required to determine a winner
  VOTE_THRESHOLD: 1,
  
  // Minimum percentage of votes needed for a team to win (e.g., 0.66 = 66%)
  VOTE_PERCENTAGE_REQUIRED: 0.66,
  
  // Whether to allow voting after threshold is met
  STOP_VOTING_AFTER_THRESHOLD: true,
  
  // Reward for correct votes (future feature)
  VOTE_REWARD_TOKENS: 1
};

// Get current NBA season
export function getCurrentSeason() {
  // For the NBA API, we use just the starting year of the season
  // So for 2024-2025 season, we return '2024'
  return '2024';
}

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
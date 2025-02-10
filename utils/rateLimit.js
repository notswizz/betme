export const RATE_LIMIT = {
  MAX_REQUESTS_PER_MINUTE: 5,
  WINDOW: 60000, // 1 minute
  CACHE_DURATION: 60 * 60 * 1000, // 1 hour
  PLAYER_CACHE_DURATION: 24 * 60 * 60 * 1000, // 24 hours
  TEAM_CACHE_DURATION: 24 * 60 * 60 * 1000, // 24 hours
  STATS_CACHE_DURATION: 60 * 60 * 1000, // 1 hour
  REQUEST_TIMEOUT: 20000, // 20 seconds
  MIN_DELAY: 5000, // 5 seconds between requests
  CONCURRENT_LIMIT: 1, // Only 1 request at a time
  RETRY_DELAY: 10000, // 10 seconds before retrying after a 429
  MAX_RETRIES: 2 // Maximum number of retries
};

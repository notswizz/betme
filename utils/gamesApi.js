import nbaClient from './nbaClient';
import { getCurrentSeason } from './config';
import { cache } from './cache';

// Function to fetch basketball games for today
export async function fetchBasketballGames() {
  try {
    // Get current date in EST/EDT timezone
    const now = new Date();
    const estDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    
    // Add one day to get today's games (API seems to be a day behind)
    estDate.setDate(estDate.getDate() + 1);
    
    // Format date components
    const year = estDate.getFullYear();
    const month = String(estDate.getMonth() + 1).padStart(2, '0');
    const day = String(estDate.getDate()).padStart(2, '0');
    
    // Format date as YYYY-MM-DD for the API
    const formattedDate = `${year}-${month}-${day}`;
    
    // Debug logging for date handling
    console.log('=== Date Debug Info ===');
    console.log('UTC Now:', now.toISOString());
    console.log('EST Now:', estDate.toLocaleString());
    console.log('Formatted date for API:', formattedDate);
    console.log('Current season:', getCurrentSeason());

    // Try to get from cache first
    const cacheKey = `games_${formattedDate}`;
    const cachedGames = cache.get(cacheKey);
    if (cachedGames) {
      console.log('Returning cached games data');
      return cachedGames;
    }

    // Use the nbaClient's getGames method directly
    const games = await nbaClient.getGames(formattedDate);
    
    if (!games || !Array.isArray(games)) {
      console.log('Invalid games data received:', games);
      return [];
    }

    // Cache the results for 30 seconds
    cache.set(cacheKey, games, 30);

    console.log(`Successfully fetched ${games.length} games`);
    console.log('Games data:', JSON.stringify(games, null, 2));

    return games;
  } catch (error) {
    console.error('Error fetching basketball games:', error);
    if (error.response) {
      console.error('API Error Response:', error.response.data);
    }
    return [];
  }
} 
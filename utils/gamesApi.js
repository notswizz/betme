import nbaClient from './nbaClient';
import { getCurrentSeason, CACHE_CONFIG } from './config';
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
    const year = 2025;  // Use 2025 since it works with the API
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

    const response = await nbaClient.get('/games', {
      params: {
        date: formattedDate,
        league: 'standard',
        season: getCurrentSeason()
      },
      cacheDuration: 60000 // 1 minute cache for live games
    });

    console.log('Raw API response:', JSON.stringify(response, null, 2));

    if (!response || !Array.isArray(response)) {
      console.log('Invalid response format:', response);
      return [];
    }

    if (response.length === 0) {
      console.log('No games found for today');
      return [];
    }

    // Format games data
    const formattedGames = response.map(game => {
      console.log('Processing game data:', JSON.stringify(game, null, 2));
      
      const formattedGame = {
        id: game.id,
        status: game.status?.long || 'Unknown',
        date: game.date?.start,
        team1: {
          name: game.teams?.home?.name || 'Home Team',
          logo: game.teams?.home?.logo || '',
          score: parseInt(game.scores?.home?.points) || 0,
          quarterScores: {
            q1: parseInt(game.scores?.home?.linescore?.[0]) || 0,
            q2: parseInt(game.scores?.home?.linescore?.[1]) || 0,
            q3: parseInt(game.scores?.home?.linescore?.[2]) || 0,
            q4: parseInt(game.scores?.home?.linescore?.[3]) || 0,
            ot: parseInt(game.scores?.home?.linescore?.[4]) || 0
          }
        },
        team2: {
          name: game.teams?.visitors?.name || 'Away Team',
          logo: game.teams?.visitors?.logo || '',
          score: parseInt(game.scores?.visitors?.points) || 0,
          quarterScores: {
            q1: parseInt(game.scores?.visitors?.linescore?.[0]) || 0,
            q2: parseInt(game.scores?.visitors?.linescore?.[1]) || 0,
            q3: parseInt(game.scores?.visitors?.linescore?.[2]) || 0,
            q4: parseInt(game.scores?.visitors?.linescore?.[3]) || 0,
            ot: parseInt(game.scores?.visitors?.linescore?.[4]) || 0
          }
        },
        venue: game.arena ? `${game.arena.name}, ${game.arena.city}` : null
      };

      console.log('Formatted game:', JSON.stringify(formattedGame, null, 2));
      return formattedGame;
    });

    console.log(`Successfully formatted ${formattedGames.length} games`);
    return formattedGames;
  } catch (error) {
    console.error('Error fetching basketball games:', error);
    if (error.response) {
      console.error('API Error Response:', error.response.data);
    }
    return [];
  }
} 
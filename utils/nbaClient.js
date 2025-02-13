import axios from 'axios';

const API_KEY = process.env.NBA_API_KEY;
const BASE_URL = 'https://api-nba-v1.p.rapidapi.com';

class NBAClient {
  constructor() {
    if (!API_KEY) {
      console.error('NBA_API_KEY is not set in environment variables');
      throw new Error('NBA_API_KEY is required');
    }
    console.log('Initializing NBA Client with API Key:', API_KEY.substring(0, 5) + '...');

    this.client = axios.create({
      baseURL: BASE_URL,
      headers: {
        'X-RapidAPI-Key': API_KEY,
        'X-RapidAPI-Host': 'api-nba-v1.p.rapidapi.com'
      }
    });
  }

  async getGames(date) {
    try {
      console.log('Fetching games for date:', date);
      console.log('Using headers:', this.client.defaults.headers);
      
      const response = await this.client.get('/games', {
        params: {
          date: date,
          league: 'standard',
          season: '2024'  // Updated to 2024 for 2024-2025 season
        }
      });

      console.log('Raw API response:', JSON.stringify(response.data, null, 2));

      if (!response.data || !response.data.response) {
        console.error('Invalid response format:', response.data);
        return [];
      }

      const games = response.data.response.map(game => ({
        id: game.id,
        date: game.date.start,
        status: this.formatGameStatus(game.status.long),
        team1: {
          id: game.teams.home.id,
          name: game.teams.home.name,
          logo: game.teams.home.logo,
          score: game.scores.home.points || 0,
          quarterScores: {
            q1: game.scores.home.linescore?.[0] || 0,
            q2: game.scores.home.linescore?.[1] || 0,
            q3: game.scores.home.linescore?.[2] || 0,
            q4: game.scores.home.linescore?.[3] || 0,
            ot: game.scores.home.linescore?.[4] || 0
          }
        },
        team2: {
          id: game.teams.visitors.id,
          name: game.teams.visitors.name,
          logo: game.teams.visitors.logo,
          score: game.scores.visitors.points || 0,
          quarterScores: {
            q1: game.scores.visitors.linescore?.[0] || 0,
            q2: game.scores.visitors.linescore?.[1] || 0,
            q3: game.scores.visitors.linescore?.[2] || 0,
            q4: game.scores.visitors.linescore?.[3] || 0,
            ot: game.scores.visitors.linescore?.[4] || 0
          }
        },
        venue: game.arena ? `${game.arena.name}, ${game.arena.city}` : null
      }));

      console.log('Formatted games:', JSON.stringify(games, null, 2));
      return games;
    } catch (error) {
      console.error('Error fetching games:', error);
      if (error.response) {
        console.error('API Error Response:', error.response.data);
        console.error('API Error Status:', error.response.status);
        console.error('API Error Headers:', error.response.headers);
      } else if (error.request) {
        console.error('No response received:', error.request);
      } else {
        console.error('Error setting up request:', error.message);
      }
      return [];
    }
  }

  formatGameStatus(status) {
    const statusMap = {
      'Not Started': 'Not Started',
      'First Quarter': '1st Quarter',
      'Second Quarter': '2nd Quarter',
      'Third Quarter': '3rd Quarter',
      'Fourth Quarter': '4th Quarter',
      'Overtime': 'OT',
      'Finished': 'Final',
      'In Play': 'Live',
      'Halftime': 'Halftime'
    };

    return statusMap[status] || status;
  }
}

export default new NBAClient(); 
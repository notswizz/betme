import axios from 'axios';
import { NBA_API_KEY, NBA_API_HOST, NBA_BASE_URL } from './config';
import cache from './cache';

console.log('=== DEBUG: NBA API Config ===');
console.log('API Host:', NBA_API_HOST);
console.log('API Key exists:', !!NBA_API_KEY);

class NBAClient {
  constructor() {
    this.client = axios.create({
      baseURL: 'https://api-nba-v1.p.rapidapi.com',
      headers: {
        'X-RapidAPI-Key': NBA_API_KEY,
        'X-RapidAPI-Host': 'api-nba-v1.p.rapidapi.com'
      },
      timeout: 10000
    });

    // Debug log the configuration
    console.log('NBA Client Configuration:', {
      baseURL: this.client.defaults.baseURL,
      hasApiKey: !!NBA_API_KEY,
      apiHost: NBA_API_HOST
    });

    // Add request interceptor for debugging
    this.client.interceptors.request.use(request => {
      console.log('=== NBA API Request ===', {
        url: request.url,
        method: request.method,
        params: request.params
      });
      return request;
    });

    // Only handle errors in the interceptor
    this.client.interceptors.response.use(
      response => response,
      this._handleError.bind(this)
    );
  }

  // Handle errors
  _handleError(error) {
    const errorDetails = {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      endpoint: error.config?.url,
      params: error.config?.params
    };

    console.error('NBA API Error:', errorDetails);

    if (error.response?.status === 429) {
      console.error('NBA API Rate limit exceeded:', errorDetails);
      throw new Error('Rate limit exceeded. Please try again in a moment.');
    } else if (error.response?.status === 403) {
      console.error('NBA API Authorization failed:', errorDetails);
      throw new Error('API authorization failed. Please check your API key.');
    }
    
    throw error;
  }

  // Make a GET request with caching
  async get(endpoint, options = {}) {
    const cacheKey = this._getCacheKey(endpoint, options.params);
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      console.log('Using cached data for:', endpoint);
      return cachedData;
    }

    try {
      const response = await this.client.get(endpoint, options);
      
      console.log('=== NBA API Response ===', {
        status: response.status,
        endpoint: response.config.url,
        results: response.data.results,
        dataShape: Object.keys(response.data)
      });

      // Log full response for debugging
      console.log('Full API Response:', JSON.stringify(response.data, null, 2));

      if (!response?.data?.response) {
        console.log('No response data found');
        return [];
      }

      const responseData = response.data.response;
      console.log('Found games:', responseData.length);
      
      // Cache the data
      cache.set(cacheKey, responseData, options.cacheDuration);
      return responseData;
    } catch (error) {
      if (cachedData) {
        console.log('Error fetching fresh data, using cached data for:', endpoint);
        return cachedData;
      }
      throw error;
    }
  }

  // Generate cache key from endpoint and params
  _getCacheKey(endpoint, params = {}) {
    return `${endpoint}_${JSON.stringify(params)}`;
  }

  // Player-specific methods
  async searchPlayer(name, teamId = null) {
    return this.get('/players', {
      params: {
        ...(teamId && { team: teamId }),
        season: new Date().getFullYear()
      }
    });
  }

  async getPlayerStats(playerId, season) {
    return this.get('/players/statistics', {
      params: {
        id: playerId,
        season: season
      }
    });
  }
}

// Export a singleton instance
export default new NBAClient(); 
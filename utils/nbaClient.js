import axios from 'axios';
import { NBA_API_KEY, NBA_API_HOST } from './config';

console.log('=== DEBUG: NBA API Config ===');
console.log('API Host:', NBA_API_HOST);
console.log('API Key exists:', !!NBA_API_KEY);

const nbaApiClient = axios.create({
  baseURL: `https://${NBA_API_HOST}`,
  headers: {
    'X-RapidAPI-Key': NBA_API_KEY,
    'X-RapidAPI-Host': NBA_API_HOST,
    'Accept': 'application/json'
  },
  timeout: 10000,
  validateStatus: status => status >= 200 && status < 300
});

// Add request interceptor for debugging
nbaApiClient.interceptors.request.use(request => {
  console.log('=== DEBUG: NBA API Request ===');
  console.log('URL:', request.url);
  console.log('Method:', request.method);
  console.log('Params:', request.params);
  return request;
});

// Add response interceptor for debugging and data normalization
nbaApiClient.interceptors.response.use(
  response => {
    console.log('=== DEBUG: NBA API Response ===');
    console.log('Status:', response.status);
    console.log('Raw response data:', JSON.stringify(response.data, null, 2));
    
    // Handle the standard NBA API response format
    const data = response.data;
    
    if (!data) {
      console.log('No data in response, returning empty array');
      return [];
    }

    // NBA API returns data in { get, parameters, errors, results, response } format
    if (data.response !== undefined) {
      if (Array.isArray(data.response)) {
        return data.response;
      }
      return [data.response];
    }
    
    // Fallback for any other format
    if (Array.isArray(data)) {
      return data;
    }
    
    return [data];
  },
  error => {
    if (error.response?.status === 429) {
      console.error('NBA API Rate limit exceeded:', {
        endpoint: error.config?.url,
        params: error.config?.params
      });
      throw new Error('Rate limit exceeded. Please try again in a moment.');
    }
    
    console.error('NBA API Error:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      endpoint: error.config?.url,
      params: error.config?.params
    });
    
    throw error;
  }
);

export default nbaApiClient; 
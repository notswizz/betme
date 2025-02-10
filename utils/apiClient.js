import axios from 'axios';
import { NBA_API_KEY, NBA_API_HOST } from './config';

const nbaApiClient = axios.create({
  baseURL: 'https://api-nba-v1.p.rapidapi.com',
  headers: {
    'X-RapidAPI-Key': NBA_API_KEY,
    'X-RapidAPI-Host': NBA_API_HOST,
  },
});

export default nbaApiClient; 
import cache from './cache';

setInterval(() => {
  cache.clearExpired();
}, 15 * 60 * 1000); // Every 15 minutes 
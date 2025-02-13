import { CACHE_CONFIG } from './config';

class Cache {
  constructor() {
    this.cache = new Map();
    this.timeouts = new Map();
  }

  // Get item from cache
  get(key) {
    return this.cache.get(key);
  }

  // Set item in cache with expiration
  set(key, value, ttlSeconds) {
    // Clear any existing timeout for this key
    if (this.timeouts.has(key)) {
      clearTimeout(this.timeouts.get(key));
    }

    // Set the value in cache
    this.cache.set(key, value);

    // Set expiration timeout
    if (ttlSeconds) {
      const timeout = setTimeout(() => {
        this.cache.delete(key);
        this.timeouts.delete(key);
      }, ttlSeconds * 1000);

      this.timeouts.set(key, timeout);
    }
  }

  // Delete item from cache
  delete(key) {
    // Clear timeout if exists
    if (this.timeouts.has(key)) {
      clearTimeout(this.timeouts.get(key));
      this.timeouts.delete(key);
    }
    return this.cache.delete(key);
  }

  // Clear entire cache
  clear() {
    // Clear all timeouts
    for (const timeout of this.timeouts.values()) {
      clearTimeout(timeout);
    }
    this.timeouts.clear();
    this.cache.clear();
  }

  // Get cache size
  size() {
    return this.cache.size;
  }

  // Check if item exists in cache
  has(key) {
    return this.cache.has(key);
  }

  // Get all keys in cache
  keys() {
    return Array.from(this.cache.keys());
  }
}

// Export a singleton instance
export const cache = new Cache(); 
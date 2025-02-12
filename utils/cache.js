import { CACHE_CONFIG } from './config';

class Cache {
  constructor() {
    this.cache = new Map();
    this.setupCleanup();
  }

  // Get item from cache
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    const now = Date.now();
    if (now > item.expiry) {
      this.delete(key);
      return null;
    }

    return item.value;
  }

  // Set item in cache with expiration
  set(key, value, duration = CACHE_CONFIG.DEFAULT_DURATION) {
    const expiry = Date.now() + duration;
    this.cache.set(key, { value, expiry });
  }

  // Delete item from cache
  delete(key) {
    this.cache.delete(key);
  }

  // Clear entire cache
  clear() {
    this.cache.clear();
  }

  // Get cache size
  size() {
    return this.cache.size;
  }

  // Clean up expired items
  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.delete(key);
      }
    }
  }

  // Setup automatic cleanup
  setupCleanup() {
    // Run cleanup every minute
    setInterval(() => {
      console.log('Running cache cleanup...');
      this.cleanup();
      console.log(`Cache size after cleanup: ${this.size()} items`);
    }, 60000);
  }
}

// Export singleton instance
export default new Cache(); 
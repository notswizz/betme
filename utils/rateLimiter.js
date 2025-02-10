import { RATE_LIMIT } from './rateLimit';

class RateLimiter {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.lastRequest = {};
    this.retryCount = {};
  }

  async add(requestFn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ requestFn, resolve, reject, retries: 0 });
      if (!this.processing) {
        this.process();
      }
    });
  }

  async process() {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }

    this.processing = true;
    const request = this.queue[0]; // Don't shift yet, we might need to retry

    try {
      const endpoint = request.requestFn.toString().match(/get\('([^']+)'/)?.[1] || 'default';
      const now = Date.now();
      const lastRequest = this.lastRequest[endpoint] || 0;
      const delay = Math.max(0, RATE_LIMIT.MIN_DELAY - (now - lastRequest));

      if (delay > 0) {
        await new Promise(r => setTimeout(r, delay));
      }

      const result = await request.requestFn();
      this.lastRequest[endpoint] = Date.now();
      this.queue.shift(); // Only remove from queue after successful request
      request.resolve(result);
    } catch (error) {
      if (error.response?.status === 429 && request.retries < RATE_LIMIT.MAX_RETRIES) {
        // Rate limit hit - wait and retry
        request.retries++;
        console.log(`Rate limit hit for request, retry ${request.retries} of ${RATE_LIMIT.MAX_RETRIES}`);
        await new Promise(r => setTimeout(r, RATE_LIMIT.RETRY_DELAY));
        this.process(); // Try again
        return;
      }

      this.queue.shift(); // Remove failed request
      request.reject(error);
    }

    // Process next request
    setTimeout(() => this.process(), RATE_LIMIT.MIN_DELAY);
  }
}

export default new RateLimiter(); 
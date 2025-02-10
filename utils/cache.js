class Cache {
  constructor() {
    this.data = new Map();
    this.defaultDuration = 60 * 60 * 1000; // 1 hour
  }

  set(key, value, duration) {
    const expiresAt = Date.now() + (duration || this.defaultDuration);
    this.data.set(key, { value, expiresAt });
  }

  get(key) {
    const entry = this.data.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.data.delete(key);
      return null;
    }

    return entry.value;
  }

  clearExpired() {
    const now = Date.now();
    for (const [key, { expiresAt }] of this.data.entries()) {
      if (now > expiresAt) {
        this.data.delete(key);
      }
    }
  }
}

const cache = new Cache();
export default cache; 
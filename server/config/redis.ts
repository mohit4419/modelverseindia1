/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const REDIS_CONFIG = {
  url: process.env.REDIS_URL || '',
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || '',
};

export const isRedisConfigured = !!(REDIS_CONFIG.url || process.env.REDIS_HOST);

// In-Memory Cache Fallback to avoid service blocking
class MemoryCacheFallback {
  private cache = new Map<string, { value: any; expiresAt: number }>();

  async get(key: string): Promise<any> {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }
}

export const fallbackCache = new MemoryCacheFallback();

if (isRedisConfigured) {
  console.log('Redis environment credentials detected. Ready for caching services.');
} else {
  console.log('Using in-memory cache engine for session rate-limits and general caches.');
}

/**
 * Simple in-memory cache implementation
 * For production, consider using Redis or another distributed cache
 */
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class Cache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL: number = 5 * 60 * 1000; // 5 minutes default

  /**
   * Sets a value in cache with optional TTL
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const expiresAt = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { data, expiresAt });
  }

  /**
   * Gets a value from cache if not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Invalidates a specific cache key
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidates cache keys matching a pattern
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clears all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Removes expired entries from cache
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Gets cache statistics
   */
  stats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

export const cache = new Cache();

// Run cleanup every 10 minutes
const cleanupInterval = setInterval(() => {
  cache.cleanup();
}, 10 * 60 * 1000);

// Allow the process to exit even if the interval is still active
cleanupInterval.unref();

// Expose a way to stop the cleanup interval (useful for tests or graceful shutdown)
export function stopCacheCleanup(): void {
  clearInterval(cleanupInterval);
}
/**
 * Cache key generators for consistent naming
 */
export const CacheKeys = {
  user: (userId: string) => `user:${userId}`,
  userPermissions: (userId: string) => `user:${userId}:permissions`,
  cfConfig: () => 'cloudflare:config',
  zones: () => 'cloudflare:zones',
  zone: (zoneId: string) => `cloudflare:zone:${zoneId}`,
  dnsRecords: (zoneId: string) => `cloudflare:zone:${zoneId}:dns`,
};

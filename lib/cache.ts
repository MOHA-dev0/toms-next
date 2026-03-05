interface CacheItem<T> {
  value: T;
  expiry: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
class CacheService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private cache: Map<string, CacheItem<any>>;

  constructor() {
    this.cache = new Map();
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  set<T>(key: string, value: T, ttlMinutes: number = 30): void {
    const expiry = Date.now() + ttlMinutes * 60 * 1000;
    this.cache.set(key, { value, expiry });
  }

  invalidate(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

const globalForCache = globalThis as unknown as {
  reportCache: CacheService | undefined;
};

export const reportCache = globalForCache.reportCache ?? new CacheService();

if (process.env.NODE_ENV !== 'production') {
  globalForCache.reportCache = reportCache;
}

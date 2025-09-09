// Simple in-memory cache with TTL support
interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number
}

class MemoryCache {
  private cache = new Map<string, CacheItem<any>>()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Clean up expired items every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000)
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    
    if (!item) return null
    
    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return item.data
  }

  set<T>(key: string, data: T, ttlMs: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    })
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key)
      }
    }
  }

  // Get cache stats
  getStats() {
    return {
      size: this.cache.size,
      items: Array.from(this.cache.entries()).map(([key, item]) => ({
        key,
        timestamp: new Date(item.timestamp).toISOString(),
        ttl: item.ttl / 1000,
        expired: Date.now() - item.timestamp > item.ttl
      }))
    }
  }
}

// Global cache instance
export const cache = new MemoryCache()

// Cache TTL constants (in milliseconds)
export const CACHE_TTL = {
  DASHBOARD_STATS: 5 * 60 * 1000,     // 5 minutes
  PRODUCTS: 10 * 60 * 1000,           // 10 minutes  
  PRODUCT_DETAILS: 30 * 60 * 1000,    // 30 minutes
  FILTERS: 15 * 60 * 1000,            // 15 minutes
  BRANDS: 60 * 60 * 1000,             // 1 hour
  COLLECTIONS: 30 * 60 * 1000,        // 30 minutes
  INVENTORY: 2 * 60 * 1000,           // 2 minutes
  ORDERS: 1 * 60 * 1000,              // 1 minute
  ANALYTICS: 10 * 60 * 1000,          // 10 minutes
} as const

// Helper function to create cache-enabled API response
export function createCachedResponse<T>(
  cacheKey: string,
  ttl: number,
  dataProvider: () => Promise<T>
) {
  return async (): Promise<T> => {
    // Try to get from cache first
    const cachedData = cache.get<T>(cacheKey)
    if (cachedData !== null) {
      console.log(`Cache HIT for key: ${cacheKey}`)
      return cachedData
    }

    console.log(`Cache MISS for key: ${cacheKey}`)
    
    // Data not in cache, fetch fresh data
    const freshData = await dataProvider()
    
    // Store in cache
    cache.set(cacheKey, freshData, ttl)
    
    return freshData
  }
}
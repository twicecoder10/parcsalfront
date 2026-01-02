/**
 * General-purpose API cache utility with TTL support
 * Provides caching for various API endpoints to reduce server load
 */

interface CachedData<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

type CacheKey = string;

/**
 * Cache configuration for different endpoint types
 */
export const CACHE_CONFIG = {
  // High Priority - Long Cache (15-30 minutes)
  PLANS: { ttl: 30 * 60 * 1000 }, // 30 minutes
  COMPANY_PROFILE: { ttl: 15 * 60 * 1000 }, // 15 minutes
  COMPANY_SETTINGS: { ttl: 15 * 60 * 1000 }, // 15 minutes
  TEAM_MEMBERS: { ttl: 10 * 60 * 1000 }, // 10 minutes
  WAREHOUSES: { ttl: 15 * 60 * 1000 }, // 15 minutes
  PUBLIC_COMPANY_PROFILE: { ttl: 10 * 60 * 1000 }, // 10 minutes
  PUBLIC_WAREHOUSES: { ttl: 10 * 60 * 1000 }, // 10 minutes
  REVIEW_STATS: { ttl: 15 * 60 * 1000 }, // 15 minutes

  // Medium Priority - Short Cache (5-10 minutes)
  ANALYTICS: { ttl: 5 * 60 * 1000 }, // 5 minutes
  OVERVIEW_STATS: { ttl: 5 * 60 * 1000 }, // 5 minutes
  RECENT_BOOKINGS: { ttl: 2 * 60 * 1000 }, // 2 minutes
  UPCOMING_SHIPMENTS: { ttl: 5 * 60 * 1000 }, // 5 minutes
  USER_RESTRICTIONS: { ttl: 10 * 60 * 1000 }, // 10 minutes
  PUBLIC_REVIEWS: { ttl: 5 * 60 * 1000 }, // 5 minutes

  // Low Priority - Very Short Cache (1-2 minutes)
  INVITATIONS: { ttl: 2 * 60 * 1000 }, // 2 minutes
  SHIPMENT_SEARCH: { ttl: 2 * 60 * 1000 }, // 2 minutes
} as const;

/**
 * Generate cache key from parts
 */
export function createCacheKey(...parts: (string | number | undefined)[]): CacheKey {
  return parts.filter(Boolean).join(':');
}

/**
 * Get cached data if available and not expired
 */
export function getCachedData<T>(key: CacheKey): T | null {
  if (typeof window === 'undefined') return null;

  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const parsed: CachedData<T> = JSON.parse(cached);
    const now = Date.now();
    const age = now - parsed.timestamp;

    // Check if cache is still valid
    if (age < parsed.ttl) {
      return parsed.data;
    }

    // Cache expired, remove it
    localStorage.removeItem(key);
    return null;
  } catch (error) {
    console.error(`Error reading cache for key ${key}:`, error);
    return null;
  }
}

/**
 * Cache data with TTL
 */
export function setCachedData<T>(
  key: CacheKey,
  data: T,
  ttl: number
): void {
  if (typeof window === 'undefined') return;

  try {
    const cached: CachedData<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };
    localStorage.setItem(key, JSON.stringify(cached));
  } catch (error) {
    console.error(`Error writing cache for key ${key}:`, error);
    // If storage is full, try to clear old cache entries
    try {
      clearExpiredCache();
      // Retry once
      const cached: CachedData<T> = {
        data,
        timestamp: Date.now(),
        ttl,
      };
      localStorage.setItem(key, JSON.stringify(cached));
    } catch (retryError) {
      console.error(`Failed to cache data for key ${key} after cleanup:`, retryError);
    }
  }
}

/**
 * Remove specific cache entry
 */
export function invalidateCache(key: CacheKey): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error invalidating cache for key ${key}:`, error);
  }
}

/**
 * Invalidate cache entries matching a pattern
 */
export function invalidateCachePattern(pattern: string): void {
  if (typeof window === 'undefined') return;

  try {
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(pattern)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.error(`Error invalidating cache pattern ${pattern}:`, error);
  }
}

/**
 * Clear expired cache entries
 */
export function clearExpiredCache(): void {
  if (typeof window === 'undefined') return;

  try {
    const now = Date.now();
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('analytics_cache:') || key.startsWith('api_cache:'))) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const parsed: CachedData<any> = JSON.parse(cached);
            if (now - parsed.timestamp >= parsed.ttl) {
              keysToRemove.push(key);
            }
          }
        } catch (error) {
          // Invalid cache entry, remove it
          if (key) keysToRemove.push(key);
        }
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.error('Error clearing expired cache:', error);
  }
}

/**
 * Clear all API cache
 */
export function clearAllCache(): void {
  if (typeof window === 'undefined') return;

  try {
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('analytics_cache:') || key.startsWith('api_cache:'))) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.error('Error clearing all cache:', error);
  }
}

/**
 * Cache key generators for different resources
 */
export const CacheKeys = {
  plans: () => createCacheKey('api_cache', 'plans', 'all'),
  
  companyProfile: (userId: string) => createCacheKey('api_cache', 'company', 'profile', userId),
  
  companySettings: (userId: string) => createCacheKey('api_cache', 'company', 'settings', userId),
  
  teamMembers: (companyId: string) => createCacheKey('api_cache', 'company', 'team', companyId),
  
  warehouses: (companyId: string) => createCacheKey('api_cache', 'company', 'warehouses', companyId),
  
  publicCompanyProfile: (companyIdOrSlug: string) => 
    createCacheKey('api_cache', 'company', 'public', companyIdOrSlug),
  
  publicWarehouses: (companyIdOrSlug: string) => 
    createCacheKey('api_cache', 'company', 'public', 'warehouses', companyIdOrSlug),
  
  reviewStats: (companyId: string) => 
    createCacheKey('api_cache', 'company', 'reviews', 'stats', companyId),
  
  analytics: (companyId: string, period: string, offset: number) => 
    createCacheKey('api_cache', 'company', 'analytics', companyId, period, offset),
  
  overviewStats: (companyId: string) => 
    createCacheKey('api_cache', 'company', 'overview', 'stats', companyId),
  
  recentBookings: (companyId: string) => 
    createCacheKey('api_cache', 'company', 'overview', 'recent-bookings', companyId),
  
  upcomingShipments: (companyId: string) => 
    createCacheKey('api_cache', 'company', 'overview', 'upcoming-shipments', companyId),
  
  userRestrictions: (userId: string) => 
    createCacheKey('api_cache', 'user', 'restrictions', userId),
  
  publicReviews: (companyId: string, queryParams?: string) => 
    createCacheKey('api_cache', 'company', 'reviews', companyId, queryParams || 'default'),
  
  invitations: (companyId: string) => 
    createCacheKey('api_cache', 'company', 'invitations', companyId),
  
  shipmentSearch: (queryHash: string) => 
    createCacheKey('api_cache', 'shipments', 'search', queryHash),
};


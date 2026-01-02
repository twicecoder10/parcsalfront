/**
 * Analytics cache utility - now uses the general API cache
 * Maintains backward compatibility with existing analytics page
 */

import { getCachedData, setCachedData, CacheKeys, CACHE_CONFIG } from './api-cache';
import { getStoredUser } from './auth';

/**
 * Get cached analytics data if available and not expired
 */
export function getCachedAnalytics(
  period: string,
  offset: number
): any | null {
  const user = getStoredUser();
  const companyId = user?.companyId || user?.company?.id || 'unknown';
  const cacheKey = CacheKeys.analytics(companyId, period, offset);
  return getCachedData(cacheKey);
}

/**
 * Cache analytics data with TTL
 */
export function setCachedAnalytics(
  period: string,
  offset: number,
  data: any,
  ttl?: number
): void {
  const user = getStoredUser();
  const companyId = user?.companyId || user?.company?.id || 'unknown';
  const cacheKey = CacheKeys.analytics(companyId, period, offset);
  setCachedData(cacheKey, data, ttl || CACHE_CONFIG.ANALYTICS.ttl);
}

/**
 * Clear all analytics cache
 */
export function clearAnalyticsCache(): void {
  const user = getStoredUser();
  const companyId = user?.companyId || user?.company?.id || 'unknown';
  // Invalidate all analytics cache for this company
  const pattern = CacheKeys.analytics(companyId, '', 0).replace(':0', '');
  // This is a bit hacky, but we'll invalidate by pattern
  if (typeof window !== 'undefined') {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes('analytics') && key.includes(companyId)) {
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.error('Error clearing analytics cache:', error);
    }
  }
}


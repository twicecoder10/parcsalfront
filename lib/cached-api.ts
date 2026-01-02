/**
 * Cached API wrapper utilities
 * Provides caching layer for frequently accessed API endpoints
 */

import { 
  getCachedData, 
  setCachedData, 
  invalidateCache, 
  invalidateCachePattern,
  CacheKeys, 
  CACHE_CONFIG 
} from './api-cache';
import { getStoredUser } from './auth';
import { companyApi } from './company-api';
import { publicApi } from './api';
import type { 
  OverviewStats, 
  RecentBooking, 
  UpcomingShipment,
  CompanyProfile,
  CompanySettings,
  TeamMember,
  WarehouseAddress,
  Plan
} from './company-api';

/**
 * Get current user's company ID
 */
function getCompanyId(): string {
  const user = getStoredUser();
  return user?.companyId || user?.company?.id || 'unknown';
}

/**
 * Get current user's ID
 */
function getUserId(): string {
  const user = getStoredUser();
  return user?.id || 'unknown';
}

/**
 * Cached wrapper for getOverviewStats
 */
export async function getCachedOverviewStats(): Promise<OverviewStats> {
  const companyId = getCompanyId();
  const cacheKey = CacheKeys.overviewStats(companyId);
  
  // Check cache first
  const cached = getCachedData<OverviewStats>(cacheKey);
  if (cached) {
    return cached;
  }
  
  // Fetch from API
  const data = await companyApi.getOverviewStats();
  
  // Cache the result
  setCachedData(cacheKey, data, CACHE_CONFIG.OVERVIEW_STATS.ttl);
  
  return data;
}

/**
 * Cached wrapper for getRecentBookings
 */
export async function getCachedRecentBookings(limit: number = 5): Promise<RecentBooking[]> {
  const companyId = getCompanyId();
  const cacheKey = CacheKeys.recentBookings(companyId);
  
  const cached = getCachedData<RecentBooking[]>(cacheKey);
  if (cached) {
    return cached;
  }
  
  const data = await companyApi.getRecentBookings(limit);
  setCachedData(cacheKey, data, CACHE_CONFIG.RECENT_BOOKINGS.ttl);
  
  return data;
}

/**
 * Cached wrapper for getUpcomingShipments
 */
export async function getCachedUpcomingShipments(limit: number = 5): Promise<UpcomingShipment[]> {
  const companyId = getCompanyId();
  const cacheKey = CacheKeys.upcomingShipments(companyId);
  
  const cached = getCachedData<UpcomingShipment[]>(cacheKey);
  if (cached) {
    return cached;
  }
  
  const data = await companyApi.getUpcomingShipments(limit);
  setCachedData(cacheKey, data, CACHE_CONFIG.UPCOMING_SHIPMENTS.ttl);
  
  return data;
}

/**
 * Cached wrapper for getCompanyProfile
 */
export async function getCachedCompanyProfile(): Promise<CompanyProfile> {
  const userId = getUserId();
  const cacheKey = CacheKeys.companyProfile(userId);
  
  const cached = getCachedData<CompanyProfile>(cacheKey);
  if (cached) {
    return cached;
  }
  
  const data = await companyApi.getCompanyProfile();
  setCachedData(cacheKey, data, CACHE_CONFIG.COMPANY_PROFILE.ttl);
  
  return data;
}

/**
 * Cached wrapper for getCompanySettings
 */
export async function getCachedCompanySettings(): Promise<CompanySettings> {
  const userId = getUserId();
  const cacheKey = CacheKeys.companySettings(userId);
  
  const cached = getCachedData<CompanySettings>(cacheKey);
  if (cached) {
    return cached;
  }
  
  const data = await companyApi.getCompanySettings();
  setCachedData(cacheKey, data, CACHE_CONFIG.COMPANY_SETTINGS.ttl);
  
  return data;
}

/**
 * Cached wrapper for getTeamMembers
 */
export async function getCachedTeamMembers(): Promise<TeamMember[]> {
  const companyId = getCompanyId();
  const cacheKey = CacheKeys.teamMembers(companyId);
  
  const cached = getCachedData<TeamMember[]>(cacheKey);
  if (cached) {
    return cached;
  }
  
  const data = await companyApi.getTeamMembers();
  setCachedData(cacheKey, data, CACHE_CONFIG.TEAM_MEMBERS.ttl);
  
  return data;
}

/**
 * Cached wrapper for getWarehouseAddresses
 */
export async function getCachedWarehouseAddresses(): Promise<WarehouseAddress[]> {
  const companyId = getCompanyId();
  const cacheKey = CacheKeys.warehouses(companyId);
  
  const cached = getCachedData<WarehouseAddress[]>(cacheKey);
  if (cached) {
    return cached;
  }
  
  const data = await companyApi.getWarehouseAddresses();
  setCachedData(cacheKey, data, CACHE_CONFIG.WAREHOUSES.ttl);
  
  return data;
}

/**
 * Cached wrapper for getPlans
 */
export async function getCachedPlans(): Promise<Plan[]> {
  const cacheKey = CacheKeys.plans();
  
  const cached = getCachedData<Plan[]>(cacheKey);
  if (cached) {
    return cached;
  }
  
  const data = await companyApi.getPlans();
  setCachedData(cacheKey, data, CACHE_CONFIG.PLANS.ttl);
  
  return data;
}

/**
 * Cached wrapper for getMyRestrictions
 */
export async function getCachedUserRestrictions(): Promise<{ restrictions: Record<string, boolean>; isAdmin: boolean }> {
  const userId = getUserId();
  const cacheKey = CacheKeys.userRestrictions(userId);
  
  const cached = getCachedData<{ restrictions: Record<string, boolean>; isAdmin: boolean }>(cacheKey);
  if (cached) {
    return cached;
  }
  
  const data = await companyApi.getMyRestrictions();
  setCachedData(cacheKey, data, CACHE_CONFIG.USER_RESTRICTIONS.ttl);
  
  return data;
}

/**
 * Cached wrapper for public company profile
 */
export async function getCachedPublicCompanyProfile(companyIdOrSlug: string): Promise<any> {
  const cacheKey = CacheKeys.publicCompanyProfile(companyIdOrSlug);
  
  const cached = getCachedData<any>(cacheKey);
  if (cached) {
    return cached;
  }
  
  const data = await publicApi.getCompanyProfile(companyIdOrSlug);
  setCachedData(cacheKey, data, CACHE_CONFIG.PUBLIC_COMPANY_PROFILE.ttl);
  
  return data;
}

/**
 * Cached wrapper for public warehouses
 */
export async function getCachedPublicWarehouses(companyIdOrSlug: string): Promise<any[]> {
  const cacheKey = CacheKeys.publicWarehouses(companyIdOrSlug);
  
  const cached = getCachedData<any[]>(cacheKey);
  if (cached) {
    return cached;
  }
  
  const data = await publicApi.getWarehouseAddresses(companyIdOrSlug);
  setCachedData(cacheKey, data, CACHE_CONFIG.PUBLIC_WAREHOUSES.ttl);
  
  return data;
}

/**
 * Cache invalidation helpers
 */
export const cacheInvalidation = {
  // Invalidate overview-related caches
  overview: () => {
    const companyId = getCompanyId();
    invalidateCache(CacheKeys.overviewStats(companyId));
    invalidateCache(CacheKeys.recentBookings(companyId));
    invalidateCache(CacheKeys.upcomingShipments(companyId));
  },
  
  // Invalidate company profile
  companyProfile: () => {
    const userId = getUserId();
    invalidateCache(CacheKeys.companyProfile(userId));
  },
  
  // Invalidate company settings
  companySettings: () => {
    const userId = getUserId();
    invalidateCache(CacheKeys.companySettings(userId));
  },
  
  // Invalidate team members
  teamMembers: () => {
    const companyId = getCompanyId();
    invalidateCache(CacheKeys.teamMembers(companyId));
    invalidateCache(CacheKeys.invitations(companyId));
  },
  
  // Invalidate warehouses
  warehouses: () => {
    const companyId = getCompanyId();
    invalidateCache(CacheKeys.warehouses(companyId));
  },
  
  // Invalidate analytics
  analytics: () => {
    const companyId = getCompanyId();
    invalidateCachePattern(`api_cache:company:analytics:${companyId}`);
  },
  
  // Invalidate all company-related caches
  allCompany: () => {
    const companyId = getCompanyId();
    const userId = getUserId();
    invalidateCachePattern(`api_cache:company:${companyId}`);
    invalidateCachePattern(`api_cache:company:${userId}`);
  },
};


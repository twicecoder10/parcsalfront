import { User, UserRole, AuthResponse } from './api';
import { getNextOnboardingStepPath, getOnboardingPath } from './onboarding';

// Re-export UserRole for use in other modules
export type { UserRole };

export const getStoredUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    const user = JSON.parse(userStr);
    // Backward compatibility: if user has name but not fullName, map it
    if (user.name && !user.fullName) {
      user.fullName = user.name;
    }
    return user;
  } catch {
    return null;
  }
};

export const setStoredUser = (user: User): void => {
  if (typeof window === 'undefined') return;
  // Ensure onboardingCompleted is synced with localStorage
  if (user.onboardingCompleted) {
    localStorage.setItem('onboarding_completed', 'true');
  }
  localStorage.setItem('user', JSON.stringify(user));
};

export const setAuthTokens = (tokens: { accessToken: string; refreshToken: string }): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('accessToken', tokens.accessToken);
  localStorage.setItem('refreshToken', tokens.refreshToken);
  // Keep legacy token for backward compatibility
  localStorage.setItem('token', tokens.accessToken);
};

export const saveAuthData = (authResponse: AuthResponse): void => {
  setStoredUser(authResponse.user);
  setAuthTokens(authResponse.tokens);
  // Sync onboarding status with localStorage
  if (authResponse.user.onboardingCompleted) {
    localStorage.setItem('onboarding_completed', 'true');
  } else if (authResponse.user.onboardingCompleted === false) {
    localStorage.removeItem('onboarding_completed');
  }
};

export const removeStoredUser = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('user');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('token'); // legacy
};

export const getDashboardPath = (role: UserRole): string => {
  switch (role) {
    case 'CUSTOMER':
      return '/shipments/browse';
    case 'COMPANY_ADMIN':
    case 'COMPANY_STAFF':
      return '/company/overview';
    case 'SUPER_ADMIN':
      return '/admin/dashboard';
    default:
      return '/';
  }
};

/**
 * Get the path to redirect to after authentication (synchronous fallback)
 * Uses onboardingCompleted from the auth response for immediate redirect decision
 * 
 * Note: For detailed step-by-step progress, use getPostAuthPathAsync() instead
 */
export const getPostAuthPath = (user: { role: UserRole; onboardingCompleted?: boolean }): string => {
  const { role, onboardingCompleted } = user;
  
  // Check if user needs onboarding
  // onboardingCompleted is now included in all auth responses (login, register)
  if (onboardingCompleted !== true) {
    // Return generic onboarding path as fallback
    // For specific step redirects, use getPostAuthPathAsync()
    const onboardingPath = getOnboardingPath(role);
    if (onboardingPath) {
      return onboardingPath;
    }
  }
  
  // Otherwise go to dashboard
  return getDashboardPath(role);
};

/**
 * Get the path to redirect to after authentication (async, with detailed onboarding status)
 * ⚠️ EMAIL VERIFICATION IS CHECKED FIRST - it's mandatory before any other step
 * Fetches detailed onboarding status and redirects to the specific incomplete step
 * Falls back to generic onboarding path if status fetch fails
 */
export const getPostAuthPathAsync = async (
  user: { role: UserRole; isEmailVerified?: boolean; onboardingCompleted?: boolean }
): Promise<string> => {
  const { role, isEmailVerified, onboardingCompleted } = user;
  
  // ⚠️ EMAIL VERIFICATION MUST BE COMPLETED FIRST
  // Check isEmailVerified from login/registration response immediately
  // No need for additional API call - it's already in the response!
  if (isEmailVerified === false) {
    return '/auth/verify-email';
  }
  
  // If onboarding is complete, go to dashboard
  if (onboardingCompleted === true) {
    return getDashboardPath(role);
  }
  
  // Try to get the specific onboarding step path
  // getNextOnboardingStepPath will also check email verification as a safety measure
  try {
    const nextStepPath = await getNextOnboardingStepPath(user);
    if (nextStepPath) {
      return nextStepPath;
    }
    // If nextStepPath is null, onboarding is complete (shouldn't happen if onboardingCompleted is false)
    return getDashboardPath(role);
  } catch (error) {
    console.warn('Failed to get detailed onboarding step, using fallback:', error);
    // Fallback: if email not verified, redirect to verification
    if (isEmailVerified !== true) {
      return '/auth/verify-email';
    }
    // Otherwise fallback to generic onboarding path
    const onboardingPath = getOnboardingPath(role);
    if (onboardingPath) {
      return onboardingPath;
    }
    return getDashboardPath(role);
  }
};

export const hasRoleAccess = (userRole: UserRole, requiredRoles: UserRole[]): boolean => {
  return requiredRoles.includes(userRole);
};

/**
 * Build login URL with redirect parameter to return user to the page they were trying to access
 * @param redirectPath - The path to redirect to after login (defaults to current pathname if not provided)
 * @returns Login URL with redirect query parameter
 */
export const getLoginUrlWithRedirect = (redirectPath?: string): string => {
  if (typeof window === 'undefined') {
    return '/auth/login';
  }
  
  // Use provided path or current pathname (including search params for full URL context)
  const targetPath = redirectPath || window.location.pathname + window.location.search;
  
  // Don't redirect back to auth pages or login itself
  if (targetPath.startsWith('/auth/') || targetPath === '/auth/login') {
    return '/auth/login';
  }
  
  // Encode the redirect path as a query parameter
  return `/auth/login?redirect=${encodeURIComponent(targetPath)}`;
};


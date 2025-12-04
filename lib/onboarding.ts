import { UserRole, User, authApi, onboardingApi, OnboardingStatusResponse } from './api';
import { getStoredUser, setStoredUser } from './auth';

export interface OnboardingStatus {
  completed: boolean;
  currentStep?: number;
  skipped?: boolean;
}

export type { OnboardingStatusResponse };

export const getOnboardingPath = (role: UserRole): string | null => {
  switch (role) {
    case 'CUSTOMER':
      return '/onboarding/customer';
    case 'COMPANY_ADMIN':
    case 'COMPANY_STAFF':
      return '/onboarding/company';
    default:
      return null; // Admin doesn't need onboarding
  }
};

/**
 * Check onboarding status from backend API or fallback to localStorage
 */
export const checkOnboardingStatus = async (): Promise<OnboardingStatus> => {
  if (typeof window === 'undefined') return { completed: true };
  
  try {
    // Try to fetch from backend first
    const user = await authApi.getCurrentUser();
    if (user) {
      // Update stored user with latest data
      setStoredUser(user);
      return { completed: user.onboardingCompleted === true };
    }
  } catch (error) {
    // If API fails, fallback to localStorage
    console.warn('Failed to fetch onboarding status from backend, using localStorage:', error);
  }
  
  // Fallback: Check localStorage and stored user
  const storedUser = getStoredUser();
  if (storedUser?.onboardingCompleted !== undefined) {
    return { completed: storedUser.onboardingCompleted === true };
  }
  
  const onboardingStatus = localStorage.getItem('onboarding_completed');
  return { completed: onboardingStatus === 'true' };
};

/**
 * Mark onboarding as complete and sync with backend
 */
export const markOnboardingComplete = async (): Promise<void> => {
  if (typeof window === 'undefined') return;
  
  // Update localStorage
  localStorage.setItem('onboarding_completed', 'true');
  
  // Update stored user object
  const user = getStoredUser();
  if (user) {
    setStoredUser({ ...user, onboardingCompleted: true });
  }
  
  // Try to refresh user data from backend
  try {
    const updatedUser = await authApi.getCurrentUser();
    if (updatedUser) {
      setStoredUser(updatedUser);
    }
  } catch (error) {
    // Silently fail - we've already updated localStorage
    console.warn('Failed to refresh user data after onboarding completion:', error);
  }
};

/**
 * Check if user should be redirected to onboarding
 */
export const shouldRedirectToOnboarding = (role: UserRole): boolean => {
  if (role === 'SUPER_ADMIN') return false;
  
  if (typeof window === 'undefined') return false;
  
  // Check stored user first
  const user = getStoredUser();
  if (user?.onboardingCompleted === false) {
    return true;
  }
  if (user?.onboardingCompleted === true) {
    return false;
  }
  
  // Fallback to localStorage
  const onboardingStatus = localStorage.getItem('onboarding_completed');
  return onboardingStatus !== 'true';
};

/**
 * Get detailed onboarding status from backend
 * @param type - 'user' for user onboarding, 'company' for company onboarding
 */
export const getDetailedOnboardingStatus = async (
  type: 'user' | 'company' = 'user'
): Promise<OnboardingStatusResponse | null> => {
  if (typeof window === 'undefined') return null;
  
  try {
    const status = await onboardingApi.getStatus(type);
    return status;
  } catch (error) {
    console.warn(`Failed to fetch ${type} onboarding status:`, error);
    return null;
  }
};

/**
 * Get the next onboarding step path for a customer based on onboarding status
 * Returns the path to redirect to, or null if onboarding is complete
 */
export const getCustomerOnboardingStepPath = (
  status: OnboardingStatusResponse | null
): string | null => {
  if (!status || status.completed) return null;
  
  const { steps } = status;
  
  // Customer onboarding steps in order:
  // 1. email_verification
  // 2. profile_completion
  // 3. first_booking
  
  if (!steps.email_verification?.completed) {
    return '/auth/verify-email';
  }
  if (!steps.profile_completion?.completed) {
    return '/onboarding/customer'; // Profile completion page
  }
  if (!steps.first_booking?.completed) {
    return '/customer/shipments/browse'; // Browse shipments to make first booking
  }
  
  return null; // All steps complete
};

/**
 * Get the next onboarding step path for a company admin/staff
 * Handles both user and company onboarding
 * Returns the path to redirect to, or null if onboarding is complete
 * 
 * For COMPANY_STAFF: Only user-level steps (email_verification, profile_completion)
 * For COMPANY_ADMIN: User-level + company-level steps (company_profile, payment_setup)
 */
export const getCompanyOnboardingStepPath = async (
  userOnboarding: OnboardingStatusResponse | null,
  companyOnboarding: OnboardingStatusResponse | null,
  userRole: 'COMPANY_ADMIN' | 'COMPANY_STAFF'
): Promise<string | null> => {
  // Step 1: Email verification (user-level, required for all)
  if (userOnboarding && !userOnboarding.steps?.email_verification?.completed) {
    return '/auth/verify-email';
  }
  
  // For COMPANY_STAFF: Only user-level steps
  if (userRole === 'COMPANY_STAFF') {
    // Step 2: Profile completion (user-level)
    if (userOnboarding && !userOnboarding.steps?.profile_completion?.completed) {
      // For staff, profile completion might be handled differently
      // Check if there's a profile completion page or if it's auto-completed
      // For now, if profile is not complete, they may need to complete it via settings
      // But typically for invited staff, profile_completion might be auto-marked
      // If not complete, redirect to settings or a profile completion page
      return '/company/settings'; // Profile completion via settings
    }
    
    // COMPANY_STAFF can't complete company onboarding steps
    // Their onboardingCompleted depends on company onboarding being done by admin
    // If user steps are complete but onboarding is not, they're waiting for admin
    return null; // User steps complete, waiting for company onboarding
  }
  
  // For COMPANY_ADMIN: User-level + company-level steps
  // Step 2: Profile completion (user-level) - typically auto-marked with company_profile
  // But check it first in case it's not
  if (userOnboarding && !userOnboarding.steps?.profile_completion?.completed) {
    // Profile completion is usually auto-marked when company_profile is completed
    // But if not, they can complete it via company profile setup
    // Continue to company profile which will auto-mark profile_completion
  }
  
  // Step 3: Company profile (company-level, admin only)
  if (companyOnboarding && !companyOnboarding.steps?.company_profile?.completed) {
    return '/onboarding/company'; // Company profile completion
  }
  
  // Step 4: Payment setup (company-level, admin only)
  if (companyOnboarding && !companyOnboarding.steps?.payment_setup?.completed) {
    return '/onboarding/company/payment'; // Payment/subscription setup
  }
  
  // Note: first_shipment_slot is optional and doesn't block completion
  // Users can create shipments anytime after onboarding is complete
  
  return null; // All required steps complete
};

/**
 * Get the appropriate onboarding step based on detailed status
 * Returns the step index (0-based) that should be shown
 * @deprecated Use getCustomerOnboardingStepPath or getCompanyOnboardingStepPath instead
 */
export const getOnboardingStepFromStatus = (
  status: OnboardingStatusResponse | null
): number => {
  if (!status || status.completed) return 0;
  
  const { steps } = status;
  
  // Determine which step to show based on completed steps
  if (!steps.email_verification?.completed) {
    return 0; // Welcome/Email verification step
  }
  if (!steps.profile_completion?.completed) {
    return 1; // Profile step
  }
  
  return 0; // Default to first step
};

/**
 * Check if company admin needs to complete company onboarding
 * Company admins should check both user and company onboarding status
 */
export const shouldShowCompanyOnboarding = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return false;
  
  const user = getStoredUser();
  if (!user || (user.role !== 'COMPANY_ADMIN' && user.role !== 'COMPANY_STAFF')) {
    return false;
  }
  
  // If user doesn't have a companyId, they need company onboarding
  if (!user.companyId) {
    return true;
  }
  
  try {
    const companyStatus = await onboardingApi.getStatus('company');
    return !companyStatus.completed;
  } catch (error) {
    console.warn('Failed to fetch company onboarding status:', error);
    // If we can't fetch status, assume onboarding is needed
    return true;
  }
};

/**
 * Get the next onboarding step path based on user role and onboarding status
 * This is the main function to use after login/registration
 * ⚠️ EMAIL VERIFICATION IS CHECKED FIRST - it's mandatory before any other step
 * Returns the path to redirect to, or null if onboarding is complete
 */
export const getNextOnboardingStepPath = async (
  user: { role: UserRole; isEmailVerified?: boolean; onboardingCompleted?: boolean }
): Promise<string | null> => {
  if (typeof window === 'undefined') return null;
  
  const { role, isEmailVerified, onboardingCompleted } = user;
  
  // ⚠️ EMAIL VERIFICATION MUST BE COMPLETED FIRST
  // Check isEmailVerified from user object (from login/registration response)
  // This avoids an extra API call and ensures we check it immediately
  if (isEmailVerified !== true) {
    return '/auth/verify-email';
  }
  
  // If onboarding is complete, return null (go to dashboard)
  if (onboardingCompleted === true) {
    return null;
  }
  
  try {
    if (role === 'CUSTOMER') {
      // Get customer onboarding status
      const userOnboarding = await getDetailedOnboardingStatus('user');
      
      // Double-check email verification from status (in case user object is stale)
      if (userOnboarding && !userOnboarding.steps?.email_verification?.completed) {
        return '/auth/verify-email';
      }
      
      return getCustomerOnboardingStepPath(userOnboarding);
    } else if (role === 'COMPANY_ADMIN' || role === 'COMPANY_STAFF') {
      // Get both user and company onboarding status
      const [userOnboarding, companyOnboarding] = await Promise.all([
        getDetailedOnboardingStatus('user'),
        getDetailedOnboardingStatus('company'),
      ]);
      
      // Double-check email verification from status (in case user object is stale)
      if (userOnboarding && !userOnboarding.steps?.email_verification?.completed) {
        return '/auth/verify-email';
      }
      
      return await getCompanyOnboardingStepPath(userOnboarding, companyOnboarding, role);
    }
  } catch (error) {
    console.warn('Failed to get onboarding step path:', error);
    // Fallback: if we can't check status, redirect to email verification if not verified
    if (isEmailVerified !== true) {
      return '/auth/verify-email';
    }
    // Otherwise fallback to generic onboarding page
    return getOnboardingPath(role);
  }
  
  return null;
};

/**
 * Check if email is verified by fetching onboarding status
 * Used by route guards to verify email status
 */
export const checkEmailVerification = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return false;
  
  try {
    const userOnboarding = await getDetailedOnboardingStatus('user');
    return userOnboarding?.steps?.email_verification?.completed === true;
  } catch (error) {
    console.warn('Failed to check email verification:', error);
    return false;
  }
};


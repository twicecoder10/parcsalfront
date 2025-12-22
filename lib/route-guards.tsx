'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getStoredUser, hasRoleAccess, getLoginUrlWithRedirect, getDashboardPath, UserRole } from './auth';
import { checkEmailVerification, shouldRedirectToOnboarding } from './onboarding';

export interface RouteGuardOptions {
  allowedRoles: UserRole[];
  requireAuth?: boolean;
  requireEmailVerification?: boolean;
  requireOnboarding?: boolean;
  redirectTo?: string;
  allowPublicAccess?: boolean;
}

/**
 * Hook to protect routes based on user role and authentication status
 * Returns loading state and user information
 */
export function useRouteGuard(options: RouteGuardOptions) {
  const {
    allowedRoles,
    requireAuth = true,
    requireEmailVerification = true,
    requireOnboarding = true,
    redirectTo,
    allowPublicAccess = false,
  } = options;

  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [user, setUser] = useState<ReturnType<typeof getStoredUser>>(null);

  useEffect(() => {
    const checkAccess = async () => {
      const currentUser = getStoredUser();
      setUser(currentUser);

      // If public access is allowed and no auth required, allow access
      if (allowPublicAccess && !requireAuth) {
        setIsAuthorized(true);
        setIsChecking(false);
        return;
      }

      // Check authentication
      if (requireAuth) {
        if (!currentUser) {
          // Not authenticated - redirect to login
          router.push(getLoginUrlWithRedirect(pathname || ''));
          return;
        }

        // Check role access
        if (!hasRoleAccess(currentUser.role, allowedRoles)) {
          // Wrong role - redirect to their dashboard
          const dashboardPath = getDashboardPath(currentUser.role);
          router.push(dashboardPath);
          return;
        }

        // Check email verification
        if (requireEmailVerification && pathname !== '/auth/verify-email') {
          const isEmailVerified = await checkEmailVerification();
          if (!isEmailVerified && currentUser.isEmailVerified !== true) {
            router.push('/auth/verify-email');
            return;
          }
        }

        // Check onboarding
        if (requireOnboarding) {
          const needsOnboarding = shouldRedirectToOnboarding(currentUser.role);
          if (needsOnboarding && !pathname?.startsWith('/onboarding') && pathname !== '/auth/verify-email') {
            const onboardingPath = currentUser.role === 'CUSTOMER' 
              ? '/onboarding/customer' 
              : '/onboarding/company';
            router.push(onboardingPath);
            return;
          }
        }
      }

      // If redirectTo is specified and user is authenticated, redirect
      if (redirectTo && currentUser) {
        router.push(redirectTo);
        return;
      }

      setIsAuthorized(true);
      setIsChecking(false);
    };

    checkAccess();
  }, [router, pathname, allowedRoles, requireAuth, requireEmailVerification, requireOnboarding, redirectTo, allowPublicAccess]);

  return { isChecking, isAuthorized, user };
}

/**
 * Component wrapper for route protection
 */
export function RouteGuard({
  children,
  options,
  loadingComponent,
}: {
  children: React.ReactNode;
  options: RouteGuardOptions;
  loadingComponent?: React.ReactNode;
}) {
  const { isChecking, isAuthorized } = useRouteGuard(options);

  if (isChecking) {
    return (
      loadingComponent || (
        <div className="flex h-screen overflow-hidden items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-sm text-gray-600">Loading...</p>
          </div>
        </div>
      )
    );
  }

  if (!isAuthorized) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
}


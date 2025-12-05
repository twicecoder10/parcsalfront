'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { DashboardHeader } from '@/components/dashboard-header';
import { getStoredUser, hasRoleAccess, setStoredUser, getLoginUrlWithRedirect } from '@/lib/auth';
import { checkEmailVerification, getDetailedOnboardingStatus } from '@/lib/onboarding';
import { authApi } from '@/lib/api';
import { LayoutDashboard, Package, ShoppingCart, CreditCard, Users, Settings, BarChart3, Wallet, Warehouse } from 'lucide-react';
import { AppFooter } from '@/components/AppFooter';

const navItems = [
  { title: 'Overview', href: '/company/overview', icon: LayoutDashboard },
  { title: 'Slots', href: '/company/shipments', icon: Package },
  { title: 'Bookings', href: '/company/bookings', icon: ShoppingCart },
  { title: 'Analytics', href: '/company/analytics', icon: BarChart3 },
  { title: 'Payments', href: '/company/payments', icon: Wallet },
  { title: 'Subscription', href: '/company/subscription', icon: CreditCard },
  { title: 'Team', href: '/company/team', icon: Users },
  { title: 'Warehouses', href: '/company/warehouses', icon: Warehouse },
  { title: 'Settings', href: '/company/settings', icon: Settings },
];

export default function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const user = getStoredUser();
      if (!user || !hasRoleAccess(user.role, ['COMPANY_ADMIN', 'COMPANY_STAFF'])) {
        router.push(getLoginUrlWithRedirect(pathname));
        return;
      }
      
      // ⚠️ EMAIL VERIFICATION MUST BE COMPLETED FIRST
      // Block access to all routes until email is verified
      // Allow access to verify-email page itself
      if (pathname !== '/auth/verify-email') {
        const isEmailVerified = await checkEmailVerification();
        // Also check isEmailVerified from stored user (from login/registration response)
        if (!isEmailVerified && user.isEmailVerified !== true) {
          router.push('/auth/verify-email');
          return;
        }
      }
      
      // Check actual onboarding status from API (not just stored user)
      // For company admins, need to check both user and company onboarding
      try {
        // Refresh user data to get latest onboardingCompleted status
        const updatedUser = await authApi.getCurrentUser();
        setStoredUser(updatedUser);
        
        // If user.onboardingCompleted is true, allow access
        if (updatedUser.onboardingCompleted === true) {
          setIsChecking(false);
          return;
        }
        
        // If not complete, check detailed status to see what's missing
        const [userOnboarding, companyOnboarding] = await Promise.all([
          getDetailedOnboardingStatus('user'),
          getDetailedOnboardingStatus('company'),
        ]);
        
        // If both are complete, but user.onboardingCompleted is still false,
        // it might be a timing issue - allow access anyway
        if (userOnboarding?.completed && companyOnboarding?.completed) {
          setIsChecking(false);
          return;
        }
        
        // Redirect to onboarding if not completed (but allow access to onboarding pages)
        if (!pathname?.startsWith('/onboarding') && pathname !== '/auth/verify-email') {
          router.push('/onboarding/company');
          return;
        }
      } catch (error) {
        console.warn('Failed to check onboarding status:', error);
        // On error, check stored user as fallback
        if (user.onboardingCompleted !== true) {
          if (!pathname?.startsWith('/onboarding') && pathname !== '/auth/verify-email') {
            router.push('/onboarding/company');
            return;
          }
        }
      }
      
      setIsChecking(false);
    };
    
    checkAuth();
  }, [router, pathname]);

  // Show loading while checking
  if (isChecking) {
    return (
      <div className="flex h-screen overflow-hidden items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <DashboardSidebar navItems={navItems} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
        <AppFooter />
      </div>
    </div>
  );
}


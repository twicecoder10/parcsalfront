'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { DashboardHeader } from '@/components/dashboard-header';
import { getStoredUser, setStoredUser } from '@/lib/auth';
import { checkEmailVerification, getDetailedOnboardingStatus } from '@/lib/onboarding';
import { authApi } from '@/lib/api';
import { LayoutDashboard, Package, ShoppingCart, CreditCard, Users, Settings, BarChart3, Wallet, Warehouse, Star, ScanLine, MessageSquare, Banknote } from 'lucide-react';
import { AppFooter } from '@/components/AppFooter';
import { usePermissions, canPerformAction } from '@/lib/permissions';
import { RouteGuard } from '@/lib/route-guards';

// Helper function to get navigation items based on permissions
function getNavItems(permissions: ReturnType<typeof usePermissions>) {
  const user = getStoredUser();
  const isCompanyStaff = user?.role === 'COMPANY_STAFF';
  
  const items = [
    { title: 'Overview', href: '/company/overview', icon: LayoutDashboard },
  ];

  // Only show Shipments if user can view shipments
  if (canPerformAction(permissions, 'viewShipments')) {
    items.push({ title: 'Slots', href: '/company/shipments', icon: Package });
  }

  // Only show Bookings if user can view bookings
  if (canPerformAction(permissions, 'viewBookings')) {
    items.push({ title: 'Bookings', href: '/company/bookings', icon: ShoppingCart });
  }

  // Scan - always visible for company users (scanning barcodes)
  items.push({ title: 'Scan', href: '/company/scan', icon: ScanLine });

  // Reviews - typically always visible for company users
  items.push({ title: 'Reviews', href: '/company/reviews', icon: Star });

  // Messages - always visible for company users
  items.push({ title: 'Messages', href: '/company/chat', icon: MessageSquare });

  // Only show Analytics if user can view analytics
  if (canPerformAction(permissions, 'viewAnalytics')) {
    items.push({ title: 'Analytics', href: '/company/analytics', icon: BarChart3 });
  }

  // Payments - only if user can view payments
  if (canPerformAction(permissions, 'viewPayments')) {
    items.push({ title: 'Payments', href: '/company/payments', icon: Wallet });
    // Payouts - for company admins to manage their earnings
    if (!isCompanyStaff) {
      items.push({ title: 'Payouts', href: '/company/payouts', icon: Banknote });
    }
  }

  // Subscription - only visible for company admins, not staff
  if (!isCompanyStaff) {
    items.push({ title: 'Subscription', href: '/company/subscription', icon: CreditCard });
  }

  // Team - only visible for company admins, not staff
  if (!isCompanyStaff) {
    items.push({ title: 'Team', href: '/company/team', icon: Users });
  }

  // Warehouses - typically always visible for company users
  items.push({ title: 'Warehouses', href: '/company/warehouses', icon: Warehouse });

  // Settings - typically always visible for company users
  items.push({ title: 'Settings', href: '/company/settings', icon: Settings });

  return items;
}

export default function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
  const permissions = usePermissions();
  
  // Get navigation items based on permissions
  const navItems = getNavItems(permissions);

  // Additional onboarding check for company users (more complex than customer)
  useEffect(() => {
    const checkOnboarding = async () => {
      const user = getStoredUser();
      if (!user) {
        setIsCheckingOnboarding(false);
        return;
      }

      try {
        // Refresh user data to get latest onboardingCompleted status
        const updatedUser = await authApi.getCurrentUser();
        setStoredUser(updatedUser);
        
        // If user.onboardingCompleted is true, allow access
        if (updatedUser.onboardingCompleted === true) {
          setIsCheckingOnboarding(false);
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
          setIsCheckingOnboarding(false);
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
      
      setIsCheckingOnboarding(false);
    };
    
    checkOnboarding();
  }, [router, pathname]);

  // Show loading while checking onboarding
  if (isCheckingOnboarding) {
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
    <RouteGuard
      options={{
        allowedRoles: ['COMPANY_ADMIN', 'COMPANY_STAFF'],
        requireAuth: true,
        requireEmailVerification: true,
        requireOnboarding: false, // We handle onboarding check separately above
      }}
    >
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
    </RouteGuard>
  );
}


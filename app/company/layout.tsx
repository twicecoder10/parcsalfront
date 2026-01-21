'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { DashboardHeader } from '@/components/dashboard-header';
import { getStoredUser, setStoredUser } from '@/lib/auth';
import { checkEmailVerification, getDetailedOnboardingStatus } from '@/lib/onboarding';
import { authApi } from '@/lib/api';
import { LayoutDashboard, Package, ShoppingCart, CreditCard, Users, Settings, BarChart3, Wallet, Warehouse, Star, ScanLine, MessageSquare, Banknote, Mail, Briefcase, UserCircle } from 'lucide-react';
import type { NavItem } from '@/components/dashboard-sidebar';
import { AppFooter } from '@/components/AppFooter';
import { usePermissions, canPerformAction } from '@/lib/permissions';
import { RouteGuard } from '@/lib/route-guards';
import { useCompanyPlan } from '@/lib/hooks/use-company-plan';

// Helper function to get navigation items based on permissions and plan
function getNavItems(
  permissions: ReturnType<typeof usePermissions>,
  planFeatures: {
    canAccessScanModule: boolean;
    canAccessWarehouses: boolean;
    canAccessAnalytics: boolean;
  }
): NavItem[] {
  const user = getStoredUser();
  const isCompanyStaff = user?.role === 'COMPANY_STAFF';
  
  const items: NavItem[] = [];

  // Dashboard section
  const dashboardChildren: NavItem[] = [
    { title: 'Overview', href: '/company/overview', icon: LayoutDashboard },
  ];

  // Only show Analytics if user can view analytics (permissions check) AND has plan access (plan check)
  if (canPerformAction(permissions, 'viewAnalytics') && planFeatures.canAccessAnalytics) {
    dashboardChildren.push({ title: 'Analytics', href: '/company/analytics', icon: BarChart3 });
  }

  items.push({
    title: 'Dashboard',
    icon: LayoutDashboard,
    children: dashboardChildren,
  });

  // Operations section
  const operationsChildren: NavItem[] = [];

  // Only show Shipments if user can view shipments
  if (canPerformAction(permissions, 'viewShipments')) {
    operationsChildren.push({ title: 'Slots', href: '/company/shipments', icon: Package });
  }

  // Only show Bookings if user can view bookings
  if (canPerformAction(permissions, 'viewBookings')) {
    operationsChildren.push({ title: 'Bookings', href: '/company/bookings', icon: ShoppingCart });
  }

  // Scan - only visible if plan supports it (Professional+)
  if (planFeatures.canAccessScanModule) {
    operationsChildren.push({ title: 'Scan', href: '/company/scan', icon: ScanLine });
  }

  // Warehouses - only visible if plan supports it (Professional+)
  if (planFeatures.canAccessWarehouses) {
    operationsChildren.push({ title: 'Warehouses', href: '/company/warehouses', icon: Warehouse });
  }

  if (operationsChildren.length > 0) {
    items.push({
      title: 'Operations',
      icon: Briefcase,
      children: operationsChildren,
    });
  }

  // Customers section
  const customersChildren: NavItem[] = [
    { title: 'Reviews', href: '/company/reviews', icon: Star },
    { title: 'Messages', href: '/company/chat', icon: MessageSquare },
  ];

  items.push({
    title: 'Customers',
    icon: Users,
    children: customersChildren,
  });

  // Money section
  const moneyChildren: NavItem[] = [];

  // Payments - only if user can view payments
  if (canPerformAction(permissions, 'viewPayments')) {
    moneyChildren.push({ title: 'Payments', href: '/company/payments', icon: Wallet });
    // Payouts - for company admins to manage their earnings
    if (!isCompanyStaff) {
      moneyChildren.push({ title: 'Payouts', href: '/company/payouts', icon: Banknote });
    }
  }

  if (moneyChildren.length > 0) {
    items.push({
      title: 'Money',
      icon: Wallet,
      children: moneyChildren,
    });
  }

  // Marketing - only visible for company admins, not staff
  if (!isCompanyStaff) {
    items.push({ title: 'Marketing', href: '/company/marketing', icon: Mail });
  }

  // Account section
  const accountChildren: NavItem[] = [];

  // Subscription - only visible for company admins, not staff
  if (!isCompanyStaff) {
    accountChildren.push({ title: 'Subscription', href: '/company/subscription', icon: CreditCard });
  }

  // Team - only visible for company admins, not staff
  if (!isCompanyStaff) {
    accountChildren.push({ title: 'Team', href: '/company/team', icon: Users });
  }

  // Settings - typically always visible for company users
  accountChildren.push({ title: 'Settings', href: '/company/settings', icon: Settings });

  items.push({
    title: 'Account',
    icon: UserCircle,
    children: accountChildren,
  });

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const permissions = usePermissions();
  const planFeatures = useCompanyPlan();
  
  // Get navigation items based on permissions and plan
  const navItems = getNavItems(permissions, {
    canAccessScanModule: planFeatures.canAccessScanModule,
    canAccessWarehouses: planFeatures.canAccessWarehouses,
    canAccessAnalytics: planFeatures.canAccessAnalytics,
  });

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
        
        // Redirect to onboarding if not completed (but allow access to onboarding pages and payout setup)
        // Payout setup is part of onboarding, so allow access to /company/payouts
        if (!pathname?.startsWith('/onboarding') && pathname !== '/auth/verify-email' && pathname !== '/company/payouts') {
          router.push('/onboarding/company');
          return;
        }
      } catch (error) {
        console.warn('Failed to check onboarding status:', error);
        // On error, check stored user as fallback
        if (user.onboardingCompleted !== true) {
          // Allow access to onboarding pages, verify email, and payout setup
          if (!pathname?.startsWith('/onboarding') && pathname !== '/auth/verify-email' && pathname !== '/company/payouts') {
            router.push('/onboarding/company');
            return;
          }
        }
      }
      
      setIsCheckingOnboarding(false);
    };
    
    checkOnboarding();
  }, [router, pathname]);

  // Lock page scrolling on company layout
  useEffect(() => {
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

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
        <DashboardSidebar 
          navItems={navItems} 
          isOpen={isSidebarOpen}
          onClose={closeSidebar}
        />
        <div className="flex flex-1 flex-col overflow-hidden lg:ml-0">
          <DashboardHeader 
            onMenuClick={toggleSidebar}
            isSidebarOpen={isSidebarOpen}
          />
          <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">
            {children}
          </main>
          <AppFooter />
        </div>
      </div>
    </RouteGuard>
  );
}



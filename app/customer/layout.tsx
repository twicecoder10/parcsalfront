'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { DashboardHeader } from '@/components/dashboard-header';
import { getStoredUser, hasRoleAccess, getLoginUrlWithRedirect } from '@/lib/auth';
import { shouldRedirectToOnboarding, checkEmailVerification } from '@/lib/onboarding';
import { LayoutDashboard, Package, ShoppingCart, Settings } from 'lucide-react';
import { AppFooter } from '@/components/AppFooter';

const navItems = [
  { title: 'Dashboard', href: '/customer/dashboard', icon: LayoutDashboard },
  { title: 'Browse Shipments', href: '/customer/shipments/browse', icon: Package },
  { title: 'My Bookings', href: '/customer/bookings', icon: ShoppingCart },
  { title: 'Settings', href: '/customer/settings', icon: Settings },
];

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      const user = getStoredUser();
      if (!user || !hasRoleAccess(user.role, ['CUSTOMER'])) {
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
      
      // Redirect to onboarding if not completed (but allow access to onboarding page itself)
      if (shouldRedirectToOnboarding(user.role) && !pathname?.startsWith('/onboarding') && pathname !== '/auth/verify-email') {
        router.push('/onboarding/customer');
      }
    };
    
    checkAuth();
  }, [router, pathname]);

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


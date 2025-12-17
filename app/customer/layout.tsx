'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { CustomerHeader } from '@/components/customer-header';
import { getStoredUser, hasRoleAccess, getLoginUrlWithRedirect } from '@/lib/auth';
import { shouldRedirectToOnboarding, checkEmailVerification } from '@/lib/onboarding';
import { AppFooter } from '@/components/AppFooter';

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

      // Redirect dashboard to browse shipments
      if (pathname === '/customer/dashboard') {
        router.push('/customer/shipments/browse');
        return;
      }
    };
    
    checkAuth();
  }, [router, pathname]);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <CustomerHeader />
      <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
        {children}
      </main>
      <AppFooter />
    </div>
  );
}


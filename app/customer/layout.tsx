'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { CustomerHeader } from '@/components/customer-header';
import { RouteGuard } from '@/lib/route-guards';
import { AppFooter } from '@/components/AppFooter';

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  // Redirect dashboard to browse shipments
  useEffect(() => {
    if (pathname === '/customer/dashboard') {
      router.push('/customer/shipments/browse');
    }
  }, [router, pathname]);

  return (
    <RouteGuard
      options={{
        allowedRoles: ['CUSTOMER'],
        requireAuth: true,
        requireEmailVerification: true,
        requireOnboarding: true,
      }}
    >
      <div className="flex h-screen flex-col overflow-hidden">
        <CustomerHeader />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
        <AppFooter />
      </div>
    </RouteGuard>
  );
}


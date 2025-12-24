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
      router.push('/shipments/browse');
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
      <div className="fixed inset-0 flex flex-col overflow-hidden">
        <CustomerHeader />
        <main className="flex-1 overflow-hidden bg-gray-50 mt-16">
          <div className="h-full max-w-7xl mx-auto p-4 md:p-6">
            {children}
          </div>
        </main>
        <AppFooter />
      </div>
    </RouteGuard>
  );
}


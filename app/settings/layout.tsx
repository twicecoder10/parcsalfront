'use client';

import { RouteGuard } from '@/lib/route-guards';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RouteGuard
      options={{
        allowedRoles: ['CUSTOMER', 'COMPANY_ADMIN', 'COMPANY_STAFF', 'SUPER_ADMIN'],
        requireAuth: true,
        requireEmailVerification: true,
      }}
    >
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </div>
    </RouteGuard>
  );
}


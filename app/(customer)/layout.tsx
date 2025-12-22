'use client';

import { RouteGuard } from '@/lib/route-guards';

export default function CustomerRouteGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RouteGuard
      options={{
        allowedRoles: ['CUSTOMER'],
        requireAuth: true,
        requireEmailVerification: true,
        requireOnboarding: true,
      }}
    >
      {children}
    </RouteGuard>
  );
}


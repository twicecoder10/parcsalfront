'use client';

import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { DashboardHeader } from '@/components/dashboard-header';
import { RouteGuard } from '@/lib/route-guards';
import { LayoutDashboard, Building2, Users, Package, ShoppingCart, Settings } from 'lucide-react';
import { AppFooter } from '@/components/AppFooter';

const navItems = [
  { title: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { title: 'Companies', href: '/admin/companies', icon: Building2 },
  { title: 'Users', href: '/admin/users', icon: Users },
  { title: 'Shipments', href: '/admin/shipments', icon: Package },
  { title: 'Bookings', href: '/admin/bookings', icon: ShoppingCart },
  { title: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RouteGuard
      options={{
        allowedRoles: ['SUPER_ADMIN'],
        requireAuth: true,
        requireEmailVerification: true,
        requireOnboarding: false, // Admins might not need onboarding
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


'use client';

import { useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { DashboardHeader } from '@/components/dashboard-header';
import { RouteGuard } from '@/lib/route-guards';
import { LayoutDashboard, Building2, Users, Package, ShoppingCart, Settings, Mail, Inbox } from 'lucide-react';
import { AppFooter } from '@/components/AppFooter';

const buildNavItems = (basePath: string) => [
  { title: 'Dashboard', href: `${basePath}/dashboard`, icon: LayoutDashboard },
  { title: 'Companies', href: `${basePath}/companies`, icon: Building2 },
  { title: 'Users', href: `${basePath}/users`, icon: Users },
  { title: 'Shipments', href: `${basePath}/shipments`, icon: Package },
  { title: 'Bookings', href: `${basePath}/bookings`, icon: ShoppingCart },
  { title: 'Support Inbox', href: `${basePath}/support`, icon: Inbox },
  { title: 'Marketing', href: `${basePath}/marketing`, icon: Mail },
  { title: 'Settings', href: `${basePath}/settings`, icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  const basePath = pathname?.startsWith('/super-admin') ? '/super-admin' : '/admin';
  const navItems = useMemo(() => buildNavItems(basePath), [basePath]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

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


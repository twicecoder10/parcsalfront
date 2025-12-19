'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getStoredUser, removeStoredUser } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { User, LogOut, Settings, Package, ShoppingCart, MessageSquare } from 'lucide-react';
import { NotificationDropdown } from '@/components/notification-dropdown';
import { cn } from '@/lib/utils';

export function CustomerHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const user = getStoredUser();

  const handleLogout = () => {
    removeStoredUser();
    router.push('/auth/login');
  };

  const navItems = [
    { title: 'Live Slots', href: '/customer/shipments/browse', icon: Package },
    { title: 'My Bookings', href: '/customer/bookings', icon: ShoppingCart },
    { title: 'Messages', href: '/customer/chat', icon: MessageSquare },
  ];

  return (
    <nav className="border-b bg-white">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold text-orange-600">
          Parcsal
        </Link>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? 'default' : 'ghost'}
                  className={cn(
                    'flex items-center gap-2',
                    isActive && 'bg-orange-600 text-white hover:bg-orange-700'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.title}
                </Button>
              </Link>
            );
          })}
          
          {/* Notifications and Profile */}
          {user?.role && (
            <NotificationDropdown
              userRole={user.role as 'CUSTOMER' | 'COMPANY_ADMIN' | 'COMPANY_STAFF'}
            />
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                  <User className="h-5 w-5" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user?.fullName || user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <Link href="/customer/settings">
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}


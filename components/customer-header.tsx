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
import { User, LogOut, Settings, Package, ShoppingCart, MessageSquare, Menu, X } from 'lucide-react';
import { NotificationDropdown } from '@/components/notification-dropdown';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export function CustomerHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const user = getStoredUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    removeStoredUser();
    router.push('/auth/login');
  };

  const navItems = [
    { title: 'Live Slots', href: '/shipments/browse', icon: Package },
    { title: 'My Bookings', href: '/customer/bookings', icon: ShoppingCart },
    { title: 'Messages', href: '/customer/chat', icon: MessageSquare },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-white/95 backdrop-blur-md shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-lg md:text-xl shadow-md group-hover:shadow-lg transition-shadow">
              P
            </div>
            <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
              Parcsal
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
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

          {/* Mobile Right Section */}
          <div className="flex md:hidden items-center gap-2">
            {/* Notifications - Mobile */}
            {user?.role && (
              <NotificationDropdown
                userRole={user.role as 'CUSTOMER' | 'COMPANY_ADMIN' | 'COMPANY_STAFF'}
              />
            )}
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-600 hover:text-orange-600 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t animate-slide-in">
            <div className="flex flex-col gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button
                      variant={isActive ? 'default' : 'ghost'}
                      className={cn(
                        'w-full justify-start flex items-center gap-2',
                        isActive && 'bg-orange-600 text-white hover:bg-orange-700'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.title}
                    </Button>
                  </Link>
                );
              })}
              
              {/* Mobile Profile Section */}
              <div className="pt-4 mt-4 border-t">
                <div className="flex items-center gap-3 px-3 py-2 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <p className="text-sm font-medium">{user?.fullName || user?.name}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                </div>
                
                <Link href="/customer/settings" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Button>
                </Link>
                
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}


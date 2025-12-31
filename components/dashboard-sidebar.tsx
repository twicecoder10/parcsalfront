'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Package, ShoppingCart, Settings, Truck, Users, CreditCard, ChevronDown, ChevronRight } from 'lucide-react';

export interface NavItem {
  title: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: NavItem[];
}

interface DashboardSidebarProps {
  navItems: NavItem[];
}

export function DashboardSidebar({ navItems }: DashboardSidebarProps) {
  const pathname = usePathname();
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  // Auto-expand parent item if any child is active (only one at a time)
  useEffect(() => {
    let activeParent: string | null = null;
    navItems.forEach((item) => {
      if (item.children && !activeParent) {
        const hasActiveChild = item.children.some(
          (child) => pathname === child.href || (child.href && pathname.startsWith(child.href + '/'))
        );
        if (hasActiveChild) {
          activeParent = item.title;
        }
      }
    });
    setExpandedItem(activeParent);
  }, [pathname, navItems]);

  const toggleExpanded = (title: string) => {
    setExpandedItem((prev) => {
      // If clicking the same item, collapse it
      if (prev === title) {
        return null;
      }
      // Otherwise, expand the new item (this will collapse the previous one)
      return title;
    });
  };

  const renderNavItem = (item: NavItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItem === item.title;
    const isActive = item.href
      ? pathname === item.href || pathname.startsWith(item.href + '/')
      : false;
    const hasActiveChild = hasChildren
      ? item.children!.some(
          (child) => pathname === child.href || (child.href && pathname.startsWith(child.href + '/'))
        )
      : false;

    const Icon = item.icon;
    const paddingLeft = level * 16 + 12; // Base padding + level-based indentation

    if (hasChildren) {
      return (
        <div key={item.title}>
          <button
            onClick={() => toggleExpanded(item.title)}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              hasActiveChild
                ? 'bg-orange-100 text-orange-700'
                : 'text-gray-700 hover:bg-gray-100'
            )}
            style={{ paddingLeft: `${paddingLeft}px` }}
          >
            <Icon className="h-5 w-5 flex-shrink-0" />
            <span className="flex-1 text-left">{item.title}</span>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 flex-shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 flex-shrink-0" />
            )}
          </button>
          {isExpanded && (
            <div className="mt-1 space-y-1">
              {item.children!.map((child) => renderNavItem(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.href || item.title}
        href={item.href || '#'}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-orange-100 text-orange-700'
            : 'text-gray-700 hover:bg-gray-100'
        )}
        style={{ paddingLeft: `${paddingLeft}px` }}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        {item.title}
      </Link>
    );
  };

  return (
    <div className="flex h-full w-64 flex-col border-r bg-white">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/" className="text-xl font-bold text-orange-600">
          Parcsal
        </Link>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navItems.map((item) => renderNavItem(item))}
      </nav>
    </div>
  );
}


'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AppFooter } from '@/components/AppFooter';
import { getStoredUser, getDashboardPath } from '@/lib/auth';

// Auth pages that authenticated users should be redirected away from
const AUTH_PAGES = [
  '/auth/login',
  '/auth/register-customer',
  '/auth/register-company',
  '/auth/forgot-password',
  '/auth/reset-password',
];

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Redirect authenticated users away from auth pages
    if (pathname && AUTH_PAGES.includes(pathname)) {
      const user = getStoredUser();
      const token = typeof window !== 'undefined' 
        ? localStorage.getItem('accessToken') || localStorage.getItem('token')
        : null;
      
      if (user && token) {
        // User is authenticated, redirect to their dashboard
        router.push(getDashboardPath(user.role));
      }
    }
  }, [router, pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      {children}
      <AppFooter />
    </div>
  );
}


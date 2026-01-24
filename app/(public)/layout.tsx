'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AppFooter } from '@/components/AppFooter';
import { getStoredUser, getDashboardPath } from '@/lib/auth';
import { FeedbackDialog } from '@/components/feedback/FeedbackDialog';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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

  useEffect(() => {
    const user = getStoredUser();
    const token = typeof window !== 'undefined'
      ? localStorage.getItem('accessToken') || localStorage.getItem('token')
      : null;
    setIsAuthenticated(Boolean(user && token));
  }, []);

  // Handle scroll to hash anchor on navigation
  useEffect(() => {
    const handleHashScroll = () => {
      const hash = window.location.hash;
      if (hash) {
        // Small delay to ensure page is rendered
        setTimeout(() => {
          const element = document.querySelector(hash);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      }
    };

    // Scroll on initial load
    handleHashScroll();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashScroll);
    
    return () => {
      window.removeEventListener('hashchange', handleHashScroll);
    };
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      {children}
      {!isAuthenticated && (
        <div className="fixed bottom-5 right-5 z-50">
          <FeedbackDialog
            trigger={
              <Button
                variant="secondary"
                className="gap-2 shadow-md"
                aria-label="Send feedback"
              >
                <MessageSquare className="h-4 w-4" />
                Feedback
              </Button>
            }
          />
        </div>
      )}
      <AppFooter />
    </div>
  );
}


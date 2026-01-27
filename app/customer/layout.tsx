'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { CustomerHeader } from '@/components/customer-header';
import { RouteGuard } from '@/lib/route-guards';
import { AppFooter } from '@/components/AppFooter';
import { FeedbackDialog } from '@/components/feedback/FeedbackDialog';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
        <main className="flex-1 overflow-y-auto bg-gray-50 mt-16">
          <div className="max-w-7xl mx-auto p-4 md:p-6">
            {children}
          </div>
        </main>
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
        <AppFooter />
      </div>
    </RouteGuard>
  );
}


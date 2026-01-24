'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, Suspense } from 'react';
import { Toaster } from 'sonner';
import { SocketProvider } from '@/lib/use-socket';
import { PostHogProvider } from '@/lib/posthog';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={null}>
        <PostHogProvider>
          <SocketProvider>
            {children}
            <Toaster position="top-right" richColors />
          </SocketProvider>
        </PostHogProvider>
      </Suspense>
    </QueryClientProvider>
  );
}


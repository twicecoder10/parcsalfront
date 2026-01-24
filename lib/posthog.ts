'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { useEffect, createElement } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import type { User } from './api';
import { getConsent } from './consent';

// Initialize PostHog only on client side
export function initPostHog() {
  if (typeof window === 'undefined') return;

  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;
  const consent = getConsent();

  // Silently disable if keys are missing
  if (!posthogKey || !posthogHost) {
    return;
  }

  if (!consent?.analytics) {
    return;
  }

  if (!posthog.__loaded) {
    posthog.init(posthogKey, {
      api_host: posthogHost,
      loaded: (posthog) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('PostHog initialized');
        }
      },
    });
  }
}

// Identify user in PostHog
export function identifyUser(user: User, companyPlan?: string | null) {
  if (typeof window === 'undefined') return;
  
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const consent = getConsent();
  if (!posthogKey || !posthog.__loaded || !consent?.analytics) return;

  posthog.identify(user.id, {
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    companyId: user.companyId || null,
    plan: companyPlan || null,
  });
}

// PostHog Provider Component
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Track pageviews on route change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
    capture('$pageview', {
      $current_url: window.location.origin + url,
    });
  }, [pathname, searchParams]);

  // Only wrap with PHProvider if PostHog is initialized
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!posthogKey || !posthog.__loaded) {
    return children;
  }

  return createElement(PHProvider, { client: posthog }, children);
}

// Export posthog instance for direct use
export { posthog };

export function capture(event: string, properties?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const consent = getConsent();
  if (!posthogKey || !posthog.__loaded || !consent?.analytics) return;
  posthog.capture(event, properties);
}

export function disablePostHog() {
  if (typeof window === 'undefined') return;
  if (!posthog.__loaded) return;
  posthog.opt_out_capturing();
  posthog.reset();
}


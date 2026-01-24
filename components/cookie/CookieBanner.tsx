'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { CookiePreferencesDialog } from '@/components/cookie/CookiePreferencesDialog';
import type { ConsentState } from '@/lib/consent';
import { getConsent, setConsent, getDefaultConsent } from '@/lib/consent';
import { initPostHog, disablePostHog, capture, identifyUser } from '@/lib/posthog';
import { getStoredUser } from '@/lib/auth';

const OPEN_EVENT = 'parcsal:open-cookie-preferences';

export function CookieBanner() {
  const [consent, setConsentState] = useState<ConsentState | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  const applyConsent = useCallback((nextConsent: ConsentState) => {
    setConsent(nextConsent);
    setConsentState(nextConsent);
    setShowBanner(false);

    if (nextConsent.analytics) {
      initPostHog();
      const user = getStoredUser();
      if (user) {
        identifyUser(user, null);
      }
      capture('$pageview', { $current_url: window.location.href });
    } else {
      disablePostHog();
    }
  }, []);

  useEffect(() => {
    const stored = getConsent();
    setConsentState(stored);
    setShowBanner(!stored);

    if (stored?.analytics) {
      initPostHog();
      const user = getStoredUser();
      if (user) {
        identifyUser(user, null);
      }
    } else if (stored) {
      disablePostHog();
    }

    const openHandler = () => setIsDialogOpen(true);
    window.addEventListener(OPEN_EVENT, openHandler);
    return () => window.removeEventListener(OPEN_EVENT, openHandler);
  }, []);

  if (!showBanner && !isDialogOpen) {
    return (
      <CookiePreferencesDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        initialConsent={consent ?? getDefaultConsent()}
        onSave={applyConsent}
      />
    );
  }

  return (
    <>
      <CookiePreferencesDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        initialConsent={consent ?? getDefaultConsent()}
        onSave={applyConsent}
      />
      {showBanner && (
        <div className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-4xl rounded-2xl border border-gray-200 bg-white p-4 shadow-lg md:inset-x-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-gray-700">
              <p className="font-semibold text-gray-900">We use cookies</p>
              <p>
                We use cookies to keep Parcsal secure, analyze traffic, and improve your experience.
                You can manage your preferences at any time.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button
                variant="outline"
                onClick={() =>
                  applyConsent({ necessary: true, analytics: false, marketing: false })
                }
              >
                Reject all
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(true)}
              >
                Manage preferences
              </Button>
              <Button
                className="bg-orange-600 hover:bg-orange-700"
                onClick={() =>
                  applyConsent({ necessary: true, analytics: true, marketing: true })
                }
              >
                Accept all
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


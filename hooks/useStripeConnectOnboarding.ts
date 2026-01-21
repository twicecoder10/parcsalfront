'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { companyApi } from '@/lib/company-api';
import { getDetailedOnboardingStatus } from '@/lib/onboarding';
import type { OnboardingStatus, StripeConnectStatus } from '@/types/onboarding';
import { getErrorMessage } from '@/lib/api';
import { toast } from '@/lib/toast';

interface UseStripeConnectOnboardingOptions {
  onComplete?: () => void;
  onError?: (error: Error) => void;
  pollingInterval?: number; // milliseconds, default 5000
  maxPollingTime?: number; // milliseconds, default 5 minutes
}

export function useStripeConnectOnboarding(options: UseStripeConnectOnboardingOptions = {}) {
  const {
    onComplete,
    onError,
    pollingInterval = 5000,
    maxPollingTime = 5 * 60 * 1000, // 5 minutes
  } = options;

  const searchParams = useSearchParams();
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null>(null);
  const [connectStatus, setConnectStatus] = useState<StripeConnectStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollingStartTimeRef = useRef<number | null>(null);
  const isRefreshingRef = useRef<boolean>(false);
  const hasInitialLoadRef = useRef<boolean>(false);
  const handledStripeReturnRef = useRef<string | null>(null);
  const refreshStatusRef = useRef<() => Promise<void>>();
  const startPollingRef = useRef<() => (() => void) | undefined>();

  // Fetch onboarding status
  const fetchOnboardingStatus = useCallback(async () => {
    try {
      const data = await getDetailedOnboardingStatus('company');
      if (data) {
        const status: OnboardingStatus = {
          steps: {
            company_profile: data.steps.company_profile,
            payment_setup: data.steps.payment_setup,
            payout_setup: data.steps.payout_setup,
            first_shipment_slot: data.steps.first_shipment_slot,
          },
          completed: data.completed,
          progress: data.progress,
        };
        setOnboardingStatus(status);

        // Check if payout_setup is complete
        if (status.steps.payout_setup?.completed) {
          setIsPolling(false);
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          onComplete?.();
        }

        return status;
      }
      return null;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      onError?.(error);
      throw error;
    }
  }, [onComplete, onError]);

  // Fetch Stripe Connect status
  const fetchConnectStatus = useCallback(async () => {
    try {
      const data = await companyApi.getConnectStatus();
      setConnectStatus(data);
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      onError?.(error);
      throw error;
    }
  }, [onError]);

  // Create onboarding link and redirect
  const startOnboarding = useCallback(async (returnUrl: string, fromOnboarding: boolean = true) => {
    setIsLoading(true);
    setError(null);

    try {
      const { url } = await companyApi.createOnboardingLink(returnUrl, fromOnboarding);
      // Redirect to Stripe
      window.location.href = url;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      setIsLoading(false);
      onError?.(error);
      toast.error(getErrorMessage(err) || 'Failed to create onboarding link');
    }
  }, [onError]);

  // Refresh status (calls both endpoints)
  const refreshStatus = useCallback(async () => {
    // Prevent concurrent calls
    if (isRefreshingRef.current) {
      return;
    }
    
    isRefreshingRef.current = true;
    setIsLoading(true);
    try {
      // First refresh Stripe Connect status (this will mark step complete if ready)
      await fetchConnectStatus();
      
      // Then check onboarding status
      await fetchOnboardingStatus();
    } catch (err) {
      console.error('Failed to refresh status:', err);
    } finally {
      setIsLoading(false);
      isRefreshingRef.current = false;
    }
  }, [fetchConnectStatus, fetchOnboardingStatus]);

  // Start polling for status updates
  const startPolling = useCallback(() => {
    if (isPolling) return;

    setIsPolling(true);
    pollingStartTimeRef.current = Date.now();

    const poll = async () => {
      // Check if max polling time exceeded
      if (pollingStartTimeRef.current && Date.now() - pollingStartTimeRef.current > maxPollingTime) {
        setIsPolling(false);
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        return;
      }

      try {
        await refreshStatus();
      } catch (err) {
        console.error('Polling error:', err);
      }
    };

    // Poll immediately
    poll();

    // Then poll at intervals
    pollingIntervalRef.current = setInterval(poll, pollingInterval);

    // Return cleanup function
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      setIsPolling(false);
    };
  }, [isPolling, pollingInterval, maxPollingTime, refreshStatus]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setIsPolling(false);
    pollingStartTimeRef.current = null;
  }, []);

  // Keep refs up to date
  useEffect(() => {
    refreshStatusRef.current = refreshStatus;
    startPollingRef.current = startPolling;
  }, [refreshStatus, startPolling]);

  // Check status on mount (only once)
  useEffect(() => {
    if (!hasInitialLoadRef.current) {
      hasInitialLoadRef.current = true;
      refreshStatusRef.current?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Handle return from Stripe
  useEffect(() => {
    const fromStripe = searchParams?.get('from_stripe');
    const success = searchParams?.get('success');
    const searchParamsString = searchParams?.toString() || '';
    
    // Only process if we have the params and haven't already handled this exact state
    if ((fromStripe === 'true' || success === 'true') && handledStripeReturnRef.current !== searchParamsString) {
      handledStripeReturnRef.current = searchParamsString;
      
      // User returned from Stripe - refresh status
      if (!isRefreshingRef.current && refreshStatusRef.current) {
        refreshStatusRef.current();
      }
      
      // Start polling in case webhook hasn't processed yet (only if not already polling)
      if (!isPolling && startPollingRef.current) {
        const cleanup = startPollingRef.current();
        
        return () => {
          cleanup?.();
        };
      }
    }
  }, [searchParams, isPolling]); // Only depend on searchParams and isPolling

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  return {
    onboardingStatus,
    connectStatus,
    isLoading,
    error,
    isPolling,
    fetchOnboardingStatus,
    fetchConnectStatus,
    startOnboarding,
    refreshStatus,
    startPolling,
    stopPolling,
  };
}


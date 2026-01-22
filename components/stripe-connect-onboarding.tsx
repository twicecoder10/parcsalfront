'use client';

import React, { useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStripeConnectOnboarding } from '@/hooks/useStripeConnectOnboarding';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, CheckCircle2, Banknote, ArrowRight, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StripeConnectOnboarding() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}${window.location.pathname}?from_stripe=true`
    : '';

  // Memoize callbacks to prevent infinite loops
  const handleComplete = useCallback(() => {
    // Show success message
    console.log('Stripe Connect setup completed!');
    // Optionally navigate to next step
  }, []);

  const handleError = useCallback((error: Error) => {
    console.error('Stripe Connect error:', error);
  }, []);

  const {
    onboardingStatus,
    connectStatus,
    isLoading,
    error,
    isPolling,
    startOnboarding,
    refreshStatus,
  } = useStripeConnectOnboarding({
    onComplete: handleComplete,
    onError: handleError,
  });

  // Clean up URL parameters after processing
  useEffect(() => {
    const fromStripe = searchParams?.get('from_stripe');
    const success = searchParams?.get('success');
    
    if (fromStripe === 'true' || success === 'true') {
      // Clean up URL after a short delay to allow status refresh
      const timer = setTimeout(() => {
        const newSearchParams = new URLSearchParams(searchParams?.toString() || '');
        newSearchParams.delete('from_stripe');
        newSearchParams.delete('success');
        const newUrl = newSearchParams.toString()
          ? `${window.location.pathname}?${newSearchParams.toString()}`
          : window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const handleStartSetup = async () => {
    if (!returnUrl) return;
    await startOnboarding(returnUrl, true);
  };

  const handleRetry = async () => {
    if (!returnUrl) return;
    await startOnboarding(returnUrl, true);
  };

  const payoutSetupStep = onboardingStatus?.steps.payout_setup;
  const isPayoutSetupComplete = payoutSetupStep?.completed ?? false;

  // Show loading state
  if (isLoading && !onboardingStatus) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-orange-600 mb-4" />
          <p className="text-sm text-gray-600">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  // Show error state
  if (error && !connectStatus) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-900">Stripe Connect Setup Error</CardTitle>
          <CardDescription className="text-red-700">{error.message}</CardDescription>
        </CardHeader>
        <CardContent>
          {error.message.includes('not enabled') && (
            <p className="text-sm text-red-600 mb-4">
              Please contact support to enable Stripe Connect for your account.
            </p>
          )}
          <Button onClick={handleRetry} variant="outline" className="w-full">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show success state
  if (isPayoutSetupComplete) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-green-900 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Stripe Connect Setup Complete!
          </CardTitle>
          <CardDescription className="text-green-700">
            Your Stripe Connect account setup is complete. You can now receive payments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payoutSetupStep?.completedAt && (
            <p className="text-sm text-green-600 mb-4">
              Completed: {new Date(payoutSetupStep.completedAt).toLocaleString()}
            </p>
          )}
          <Button
            onClick={() => router.push('/onboarding/company')}
            className="w-full"
            variant="outline"
          >
            Finish Onboarding
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show in-progress state (user is on Stripe or webhook is processing)
  if (isPolling) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900">Completing Stripe Connect Setup...</CardTitle>
          <CardDescription className="text-blue-700">
            Please wait while we verify your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-4" />
          <p className="text-sm text-blue-600">This may take a few moments.</p>
        </CardContent>
      </Card>
    );
  }

  // Show account rejection state
  if (
    connectStatus &&
    !connectStatus.chargesEnabled &&
    !connectStatus.payoutsEnabled &&
    connectStatus.stripeAccountId
  ) {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="text-orange-900 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Account Verification Needed
          </CardTitle>
          <CardDescription className="text-orange-700">
            Your Stripe account needs additional verification.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-orange-600 mb-4">
            Please complete the verification requirements in your Stripe Dashboard.
          </p>
          <div className="space-y-2">
            <Button onClick={handleRetry} className="w-full">
              Complete Verification
            </Button>
            <Button onClick={refreshStatus} variant="outline" className="w-full">
              Check Status
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show initial setup state
  return (
    <Card>
      <CardHeader>
        <CardTitle>Set Up Stripe Connect</CardTitle>
        <CardDescription>
          Complete your payout account setup to receive payments.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {onboardingStatus && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Overall Progress</span>
              <span className="font-semibold text-orange-600">{onboardingStatus.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${onboardingStatus.progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div
            className={cn(
              'flex items-center gap-3 p-3 rounded-lg border transition-colors',
              onboardingStatus?.steps.company_profile?.completed
                ? 'bg-green-50 border-green-200'
                : 'bg-gray-50 border-gray-200'
            )}
          >
            <div className="flex-shrink-0">
              {onboardingStatus?.steps.company_profile?.completed ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <div className="h-5 w-5 rounded-full border-2 border-gray-400" />
              )}
            </div>
            <span className="text-sm font-medium text-gray-700">Company Profile</span>
          </div>
          <div
            className={cn(
              'flex items-center gap-3 p-3 rounded-lg border transition-colors',
              onboardingStatus?.steps.payment_setup?.completed
                ? 'bg-green-50 border-green-200'
                : 'bg-gray-50 border-gray-200'
            )}
          >
            <div className="flex-shrink-0">
              {onboardingStatus?.steps.payment_setup?.completed ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <div className="h-5 w-5 rounded-full border-2 border-gray-400" />
              )}
            </div>
            <span className="text-sm font-medium text-gray-700">Payment Setup</span>
          </div>
          <div
            className={cn(
              'flex items-center gap-3 p-3 rounded-lg border transition-colors',
              isPayoutSetupComplete
                ? 'bg-green-50 border-green-200'
                : 'bg-orange-50 border-orange-200'
            )}
          >
            <div className="flex-shrink-0">
              {isPayoutSetupComplete ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <div className="h-5 w-5 rounded-full border-2 border-orange-600 bg-orange-600" />
              )}
            </div>
            <span className="text-sm font-medium text-gray-700">Payout Setup (Stripe Connect)</span>
          </div>
        </div>

        <Button
          onClick={handleStartSetup}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Starting...
            </>
          ) : (
            <>
              <Banknote className="h-4 w-4 mr-2" />
              Start Stripe Connect Setup
            </>
          )}
        </Button>

        {connectStatus?.stripeAccountId && !isPayoutSetupComplete && (
          <p className="text-sm text-gray-500 text-center">
            You have an incomplete setup. Click above to continue.
          </p>
        )}
      </CardContent>
    </Card>
  );
}


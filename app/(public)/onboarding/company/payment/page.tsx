'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Navbar } from '@/components/navbar';
import { OnboardingChecklist } from '@/components/onboarding-checklist';
import {
  CheckCircle2,
  ArrowRight,
  CreditCard,
  Loader2,
  Check,
  ArrowLeft,
  AlertCircle
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getStoredUser, setStoredUser } from '@/lib/auth';
import { getDetailedOnboardingStatus } from '@/lib/onboarding';
import { authApi } from '@/lib/api';
import { companyApi, Plan } from '@/lib/company-api';
import { Badge } from '@/components/ui/badge';

/**
 * Payment Setup Onboarding Page
 * Step 3 of 3: Payment Setup
 */
function PaymentOnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const user = getStoredUser();
  const [isMounted, setIsMounted] = useState(false);

  // Check if user is COMPANY_STAFF (invited team member)
  const isStaff = user?.role === 'COMPANY_STAFF';
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch both user and company onboarding status
  const { data: userOnboardingStatus, refetch: refetchUserStatus } = useQuery({
    queryKey: ['onboarding-status', 'user'],
    queryFn: () => getDetailedOnboardingStatus('user'),
    enabled: isMounted,
    staleTime: 0,
    refetchInterval: 3000,
    refetchOnWindowFocus: true,
  });

  const { data: companyOnboardingStatus, refetch: refetchCompanyStatus } = useQuery({
    queryKey: ['onboarding-status', 'company'],
    queryFn: () => getDetailedOnboardingStatus('company'),
    enabled: isMounted,
    staleTime: 0,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.completed) {
        return false;
      }
      return 3000;
    },
    refetchOnWindowFocus: true,
  });

  // Check for return from Stripe checkout
  useEffect(() => {
    if (!isMounted) return;

    const success = searchParams.get('success');
    const cancelled = searchParams.get('cancelled');
    const fromOnboarding = searchParams.get('fromOnboarding');

    if (success === 'true' && fromOnboarding === 'true') {
      setSuccessMessage('Payment successful! Processing your subscription...');
      // Refresh onboarding status to check if webhook has processed
      refetchUserStatus();
      refetchCompanyStatus();
      queryClient.invalidateQueries({ queryKey: ['onboarding-status'] });

      // Also refresh user data
      authApi.getCurrentUser().then((updatedUser) => {
        setStoredUser(updatedUser);
      }).catch(console.warn);
    } else if (cancelled === 'true' && fromOnboarding === 'true') {
      setError('Payment was cancelled. You can try again when ready.');
    }
  }, [isMounted, searchParams, refetchUserStatus, refetchCompanyStatus, queryClient]);

  // Step tracking
  const isEmailVerified = userOnboardingStatus?.steps?.email_verification?.completed === true;
  const isProfileComplete = userOnboardingStatus?.steps?.profile_completion?.completed === true;
  const isCompanyProfileComplete = companyOnboardingStatus?.steps?.company_profile?.completed === true;
  const isPaymentSetupComplete = companyOnboardingStatus?.steps?.payment_setup?.completed === true;
  const isAllComplete = user?.onboardingCompleted === true ||
    (isEmailVerified && isProfileComplete && isCompanyProfileComplete && isPaymentSetupComplete);

  // Calculate progress
  const calculateOverallProgress = (): number => {
    let completed = 0;
    if (isEmailVerified) completed++;
    if (isCompanyProfileComplete) completed++;
    if (isPaymentSetupComplete) completed++;
    return Math.round((completed / 3) * 100);
  };

  const overallProgress = calculateOverallProgress();

  // Fetch plans from API
  const { data: plans, isLoading: plansLoading, error: plansError } = useQuery({
    queryKey: ['plans'],
    queryFn: () => companyApi.getPlans(),
    enabled: isMounted,
    staleTime: 300000, // Cache for 5 minutes
  });

  // Transform plans for display
  const displayPlans = plans?.map((plan: Plan) => {
    const features: string[] = [];

    // Add shipment slots feature
    if (plan.maxActiveShipmentSlots === null) {
      features.push('Unlimited active shipment slots');
    } else {
      features.push(`Up to ${plan.maxActiveShipmentSlots} active shipment slots`);
    }

    // Add team members feature
    if (plan.maxTeamMembers === null) {
      features.push('Unlimited team members');
    } else {
      features.push(`Up to ${plan.maxTeamMembers} team members`);
    }

    // Add plan-specific features based on plan name or ID
    const planNameUpper = plan.name.toUpperCase();
    const planIdUpper = (plan.id || '').toUpperCase();
    
    if (planNameUpper === 'FREE' || planIdUpper === 'FREE' || plan.name === 'Free') {
      features.push(
        'List services on Parcsal (standard ranking)',
        'Basic analytics (shipments, revenue, average rating)',
        'Standard payout within 48 hours'
      );
    } else if (planNameUpper === 'STARTER' || planIdUpper === 'STARTER' || plan.name === 'Starter') {
      features.push(
        'Verified Carrier badge',
        'Enhanced analytics with corridor breakdown',
        'Faster payouts (24–48 hours)',
        'Email campaigns (up to 5,000/month)',
        '100 SMS/WhatsApp credits/month'
      );
    } else if (planNameUpper === 'PROFESSIONAL' || planIdUpper === 'PROFESSIONAL' || plan.name === 'Professional') {
      features.push(
        'Priority search ranking',
        'Full analytics suite with A/B testing',
        'Next-day payout options',
        'Email campaigns (up to 20,000/month)',
        '500 SMS/WhatsApp credits/month',
        'Access to Scan and Warehouses modules'
      );
    } else if (planNameUpper === 'ENTERPRISE' || planIdUpper === 'ENTERPRISE' || plan.name === 'Enterprise') {
      features.push(
        'Dedicated account manager',
        'Custom SLAs on support and payouts',
        'Multi-branch/multi-country structure',
        'Deep API integrations',
        'Custom reporting and data feeds',
        'Co-branded landing pages'
      );
    }
    // Backward compatibility with old plan names
    else if (plan.name === 'Basic') {
      features.push('Basic analytics', 'Email support');
    } else if (plan.name === 'Pro') {
      features.push(
        'Advanced analytics & reports',
        'Priority email & phone support',
        'Advanced booking management',
        'Team collaboration tools',
        'API access'
      );
    }

    // Safely convert priceMonthly to number and format
    const priceMonthly = typeof plan.priceMonthly === 'number'
      ? plan.priceMonthly
      : typeof plan.priceMonthly === 'string'
        ? parseFloat(plan.priceMonthly)
        : 0;

    return {
      id: plan.id,
      name: plan.name,
      price: priceMonthly,
      priceDisplay: `£${priceMonthly.toFixed(2)}`,
      billingCycle: 'monthly',
      features,
      recommended: plan.isDefault,
    };
  }) || [];

  const handleSubscribe = async (planId: string) => {
    if (!planId) {
      setError('Please select a plan');
      return;
    }

    setIsProcessing(true);
    setError('');
    setSuccessMessage(null);

    try {
      // Get current URL for return redirect
      const returnUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/onboarding/company/payment`
        : '/onboarding/company/payment';

      const response = await companyApi.createCheckoutSession({
        planId,
        returnUrl,
        fromOnboarding: true,
      });

      // Redirect to Stripe checkout
      // After successful payment, Stripe will redirect back to returnUrl with ?success=true&fromOnboarding=true
      // The webhook will process the payment and mark payment_setup as complete
      window.location.href = response.url;
    } catch (error: any) {
      console.error('Failed to create checkout session:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create checkout session. Please try again.';
      setError(errorMessage);
      setIsProcessing(false);
    }
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-orange-50 via-white to-orange-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-orange-600 animate-spin" />
        </div>
      </div>
    );
  }

  // If payment is already complete, redirect to main onboarding page to show completion screen
  if (isAllComplete) {
    router.push('/onboarding/company');
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-orange-50 via-white to-orange-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-orange-600 animate-spin" />
        </div>
      </div>
    );
  }

  // For COMPANY_STAFF: Payment setup can only be done by admin
  if (isStaff) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-orange-50 via-white to-orange-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-4xl">
            <Card className="border-0 shadow-xl">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <div className="flex justify-center mb-6">
                    <div className="rounded-full bg-orange-100 p-6">
                      <AlertCircle className="h-12 w-12 text-orange-600" />
                    </div>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    Admin Access Required
                  </h2>
                  <p className="text-lg text-gray-600 mb-4">
                    Payment setup can only be completed by a company administrator. Please contact your company admin to complete this step.
                  </p>
                </div>

                <div className="flex justify-center gap-4">
                  <Button
                    onClick={() => router.push('/company/overview')}
                    className="bg-orange-600 hover:bg-orange-700 h-12 px-8"
                  >
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // If company profile is not complete, redirect back
  if (!isCompanyProfileComplete) {
    router.push('/onboarding/company');
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-orange-50 via-white to-orange-50">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-6xl">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Step 3 of 3 - Payment Setup
              </span>
              <span className="text-sm text-gray-500">{overallProgress}% Complete</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Onboarding Checklist */}
            <div className="md:col-span-1 space-y-4">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Onboarding Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <OnboardingChecklist
                    userStatus={userOnboardingStatus || null}
                    companyStatus={companyOnboardingStatus || null}
                    type="company"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Payment Plans */}
            <div className="md:col-span-2">
              <Card className="border-0 shadow-xl">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="rounded-full bg-orange-100 p-3">
                      <CreditCard className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">Choose Your Plan</CardTitle>
                      <CardDescription>
                        Select a subscription plan to complete onboarding (Step 3 of 3)
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {successMessage && (
                    <div className="mb-6 p-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Payment Successful!</p>
                        <p className="text-green-600">{successMessage}</p>
                      </div>
                    </div>
                  )}
                  {error && (
                    <div className="mb-6 p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
                      {error}
                    </div>
                  )}

                  {plansLoading && (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 text-orange-600 animate-spin" />
                    </div>
                  )}

                  {plansError && (
                    <div className="mb-6 p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
                      Failed to load plans. Please try again.
                    </div>
                  )}

                  {!plansLoading && !plansError && displayPlans.length > 0 && (
                    <div className="grid md:grid-cols-3 gap-4 mb-6">
                      {displayPlans.map((plan) => (
                        <Card
                          key={plan.id}
                          className={`cursor-pointer transition-all ${selectedPlan === plan.id
                              ? 'border-orange-600 border-2 shadow-lg'
                              : 'border-gray-200 hover:border-gray-300'
                            } ${plan.recommended ? 'md:scale-105' : ''}`}
                          onClick={() => setSelectedPlan(plan.id)}
                        >
                          <CardHeader>
                            <div className="flex items-center justify-between mb-2">
                              <CardTitle className="text-lg">{plan.name}</CardTitle>
                              {plan.recommended && (
                                <Badge className="bg-orange-600">Recommended</Badge>
                              )}
                            </div>
                            <div className="mt-4">
                              <span className="text-3xl font-bold">
                                {plan.priceDisplay}
                              </span>
                              <span className="text-gray-500 text-sm">/{plan.billingCycle}</span>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-2 mb-4">
                              {plan.features.map((feature, index) => (
                                <li key={index} className="flex items-start gap-2 text-sm">
                                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                  <span>{feature}</span>
                                </li>
                              ))}
                            </ul>
                            {selectedPlan === plan.id && (
                              <div className="mt-4 pt-4 border-t">
                                <div className="flex items-center gap-2 text-sm text-green-600">
                                  <CheckCircle2 className="h-4 w-4" />
                                  <span>Selected</span>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => router.push('/onboarding/company')}
                      className="text-gray-600"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    <Button
                      onClick={() => selectedPlan && handleSubscribe(selectedPlan)}
                      disabled={!selectedPlan || isProcessing}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Subscribe & Complete
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentOnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-orange-50 via-white to-orange-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-orange-600 animate-spin" />
        </div>
      </div>
    }>
      <PaymentOnboardingContent />
    </Suspense>
  );
}


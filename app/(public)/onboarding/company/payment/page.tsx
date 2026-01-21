'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
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

  // Transform plans for display (excluding Enterprise)
  const displayPlans = plans?.filter((plan: Plan) => {
    const planNameUpper = plan.name.toUpperCase();
    const planIdUpper = (plan.id || '').toUpperCase();
    return planNameUpper !== 'ENTERPRISE' && planIdUpper !== 'ENTERPRISE';
  }).map((plan: Plan) => {
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
        'Up to 3 shipments per month List services on Parcsal (standard ranking).',
        'Create/manage Slots & Bookings',
        'View reviews/ratings',
        'Reply to messages one-to-one.',
        'View Payments &',
        'Manage Payouts',
        'Basic analytics (shipments, revenue, average rating).',
        'Email & InApp notifications',
        'Promo campaigns via pay-as-you-go credits.'
      );
    } else if (planNameUpper === 'STARTER' || planIdUpper === 'STARTER' || plan.name === 'Starter') {
      features.push(
        'Everything in Free',
        'up to 20 shipments per month List services on Parcsal (Starter ranking)',
        'Access to Scan and Warehouses modules.',
        '"Verified Carrier" badge on listings.',
        'Enhanced analytics',
        'Email campaigns to past customers (e.g., up to 1,000 / month; extra billed).',
        '20 post on WhatsApp storis',
        '100 promotional WhatsApp messages per month; extra billed via top-ups.',
        'Via Email / InApp / Live chat success contact.'
      );
    } else if (planNameUpper === 'PROFESSIONAL' || planIdUpper === 'PROFESSIONAL' || plan.name === 'Professional') {
      features.push(
        'Everything in Starter',
        'Unlimited Listing per month.',
        'Priority search ranking above Free & Starter.',
        'Featured placement and "Recommended Carrier" rotation.',
        'Higher email limits (e.g., up to 5,000 / month) extra billed.',
        '50 post on WhatsApp stories + Billed extra',
        '250 promotional WhatsApp messages per month; extra billed via top-ups.',
        'Phone + Dedicated success contact.'
      );
    } else if (planNameUpper === 'ENTERPRISE' || planIdUpper === 'ENTERPRISE' || plan.name === 'Enterprise') {
      features.push(
        'Contact support for dedicated plan details'
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
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="rounded-full bg-orange-100 p-3">
                      <CreditCard className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold">Choose Your Plan</CardTitle>
                      <CardDescription className="mt-1">
                        Select a subscription plan to complete onboarding (Step 3 of 3)
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
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
                      {displayPlans.map((plan) => {
                        const planNameUpper = plan.name.toUpperCase();
                        const planIdUpper = (plan.id || '').toUpperCase();
                        
                        // Key highlights - only 2-3 main features
                        const keyHighlights: string[] = [];
                        if (planNameUpper === 'FREE' || planIdUpper === 'FREE' || plan.name === 'Free') {
                          keyHighlights.push('Up to 3 shipments/month');
                          keyHighlights.push('Standard ranking');
                          keyHighlights.push('1 admin user');
                        } else if (planNameUpper === 'STARTER' || planIdUpper === 'STARTER' || plan.name === 'Starter') {
                          keyHighlights.push('Up to 20 shipments/month');
                          keyHighlights.push('Priority ranking');
                          keyHighlights.push('Up to 3 team members');
                        } else if (planNameUpper === 'PROFESSIONAL' || planIdUpper === 'PROFESSIONAL' || plan.name === 'Professional') {
                          keyHighlights.push('Unlimited shipments');
                          keyHighlights.push('Highest priority ranking');
                          keyHighlights.push('Unlimited team members');
                        } else if (planNameUpper === 'ENTERPRISE' || planIdUpper === 'ENTERPRISE' || plan.name === 'Enterprise') {
                          keyHighlights.push('Custom plan');
                          keyHighlights.push('Dedicated support');
                        } else {
                          // Fallback - use first few features
                          keyHighlights.push(...plan.features.slice(0, 3));
                        }

                        return (
                          <Card
                            key={plan.id}
                            className={`relative transition-all hover:shadow-lg ${
                              selectedPlan === plan.id
                                ? 'border-orange-500 border-2 shadow-lg'
                                : plan.recommended
                                ? 'border-orange-300 border-2 shadow-md'
                                : 'border-gray-200'
                            }`}
                          >
                            {plan.recommended && (
                              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                                <Badge className="bg-orange-600 text-white px-3 py-0.5 text-xs font-medium">Most Popular</Badge>
                              </div>
                            )}
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between mb-2">
                                <CardTitle className="text-lg font-semibold">{plan.name}</CardTitle>
                                {selectedPlan === plan.id && (
                                  <Badge className="bg-green-100 text-green-800 text-xs font-medium whitespace-nowrap">Selected</Badge>
                                )}
                              </div>
                              <div className="mt-3">
                                <span className="text-2xl font-bold text-gray-900">
                                  {planNameUpper === 'ENTERPRISE' || planIdUpper === 'ENTERPRISE' ? 'Custom' : plan.priceDisplay}
                                </span>
                                {planNameUpper !== 'ENTERPRISE' && planIdUpper !== 'ENTERPRISE' && (
                                  <span className="text-gray-600 text-sm ml-1">/month</span>
                                )}
                              </div>
                              <p className="text-xs text-gray-600 mt-2">
                                Commission: {planNameUpper === 'FREE' || planIdUpper === 'FREE' ? '15%' : planNameUpper === 'ENTERPRISE' || planIdUpper === 'ENTERPRISE' ? 'Custom' : '0%'}
                              </p>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <ul className="space-y-2.5 mb-5">
                                {keyHighlights.slice(0, 3).map((highlight, index) => (
                                  <li key={index} className="flex items-start gap-2">
                                    <Check className="h-3.5 w-3.5 text-green-600 flex-shrink-0 mt-0.5" />
                                    <span className="text-xs text-gray-700 leading-relaxed break-words">{highlight}</span>
                                  </li>
                                ))}
                              </ul>
                              <div className="space-y-2">
                                <Button
                                  className="w-full"
                                  variant={selectedPlan === plan.id ? 'default' : plan.recommended ? 'default' : 'outline'}
                                  disabled={isProcessing}
                                  onClick={() => {
                                    if (plan.id) {
                                      setSelectedPlan(plan.id);
                                    }
                                  }}
                                >
                                  {selectedPlan === plan.id ? (
                                    <>
                                      <CheckCircle2 className="h-4 w-4 mr-2" />
                                      Selected
                                    </>
                                  ) : (
                                    'Select Plan'
                                  )}
                                </Button>
                                <Link 
                                  href="/pricing" 
                                  className="block text-center text-xs text-gray-500 hover:text-orange-600 transition-colors"
                                >
                                  View all features →
                                </Link>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
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


'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, CheckCircle2, XCircle, AlertCircle, Loader2, ArrowRight, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { companyApi } from '@/lib/company-api';
import type { Subscription, Plan } from '@/lib/company-api';
import type { CompanyUsage } from '@/lib/plan-entitlements';
import { getErrorMessage } from '@/lib/api';
import { toast } from '@/lib/toast';

function SubscriptionContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'idle' | 'success' | 'cancelled'>('idle');
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(false);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [usage, setUsage] = useState<CompanyUsage | null>(null);

  const formatCurrency = (value?: number | null) => {
    if (value === null || value === undefined || Number.isNaN(value)) return '—';
    return `£${value.toLocaleString()}`;
  };

  useEffect(() => {
    fetchSubscriptionData();
    fetchPlans();
    fetchUsageData();
  }, []);

  const fetchSubscriptionData = async () => {
    setIsLoadingSubscription(true);
    setLoading(true);
    try {
      const subscriptionData = await companyApi.getSubscription();
      setSubscription(subscriptionData);
    } catch (error) {
      console.error('Failed to fetch subscription data:', error);
    } finally {
      setIsLoadingSubscription(false);
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const plansData = await companyApi.getPlans();
      setPlans(plansData);
    } catch (error) {
      console.error('Failed to fetch plans:', error);
    }
  };

  const fetchUsageData = async () => {
    try {
      const usageData = await companyApi.getCompanyUsage();
      setUsage(usageData);
    } catch (error) {
      console.error('Failed to fetch usage data:', error);
    }
  };

  const handlePlanSelect = async (planId: string) => {
    if (processingPlan) return;
    
    setProcessingPlan(planId);
    try {
      const checkoutSession = await companyApi.createCheckoutSession({
        planId,
        returnUrl: `${window.location.origin}/company/subscription?success=true`,
        fromOnboarding: false,
      });
      
      // Redirect to checkout
      window.location.href = checkoutSession.url;
    } catch (error: any) {
      console.error('Failed to create checkout session:', error);
      toast.error(getErrorMessage(error) || 'Failed to start checkout. Please try again.');
      setProcessingPlan(null);
    }
  };

  const handleUpdatePaymentMethod = async () => {
    try {
      const { url } = await companyApi.updatePaymentMethod();
      window.location.href = url;
    } catch (error: any) {
      console.error('Failed to update payment method:', error);
      toast.error(getErrorMessage(error) || 'Failed to update payment method. Please try again.');
    }
  };

  const handleManageSubscription = async () => {
    try {
      const { url } = await companyApi.createSubscriptionPortalSession();
      window.location.href = url;
    } catch (error: any) {
      console.error('Failed to open subscription portal:', error);
      toast.error(getErrorMessage(error) || 'Failed to manage subscription. Please try again.');
    }
  };

  useEffect(() => {
    const success = searchParams.get('success');
    const cancelled = searchParams.get('cancelled');

    // Reset status if no parameters are present
    if (!success && !cancelled) {
      setStatus('idle');
      return;
    }

    // Handle cancelled first (takes priority if both are present)
    if (cancelled === 'true') {
      setStatus('cancelled');
      // Clean URL
      window.history.replaceState({}, '', '/company/subscription');
    } else if (success === 'true') {
      setStatus('success');
      // Fetch updated subscription data
      fetchSubscriptionData();
      fetchUsageData();
      // Clean URL
      window.history.replaceState({}, '', '/company/subscription');
    }
  }, [searchParams]);

  const planNameUpper = (usage?.company?.plan || subscription?.companyPlan?.name || 'FREE').toUpperCase();
  const isFreePlan = planNameUpper === 'FREE';
  const isStarterPlan = planNameUpper === 'STARTER';
  const isProfessionalPlan = planNameUpper === 'PROFESSIONAL';

  const commissionRate = usage?.commissionRatePercent;
  const commissionRateDisplay = commissionRate !== undefined
    ? `${commissionRate}%`
    : isFreePlan
      ? '15%'
      : '0%';

  const shipmentLimit = usage?.limits?.monthlyShipmentLimit ?? subscription?.companyPlan?.maxActiveShipmentSlots ?? null;
  const shipmentsUsedThisMonth = usage?.shipmentsCreated ?? 0;
  const shipmentUsagePercent = shipmentLimit ? Math.min(100, (shipmentsUsedThisMonth / shipmentLimit) * 100) : 0;

  const teamMembersUsed = usage?.teamMembersCount ?? 0;
  const teamMembersAllowed = usage?.limits?.teamMembersLimit ?? subscription?.companyPlan?.maxTeamMembers ?? null;

  const monthlyRevenue = usage?.revenueProcessed ?? 0;
  const commissionPaidThisMonth = usage?.commissionPaid ?? 0;
  const estimatedCommissionOnFree = commissionRate !== undefined
    ? (monthlyRevenue * (commissionRate / 100))
    : (monthlyRevenue * 0.15);
  const potentialSavings = usage?.potentialSavings ?? (isFreePlan ? commissionPaidThisMonth : estimatedCommissionOnFree);

  const rankingTier = usage?.rankingTier === 'PRIORITY'
    ? 'Priority'
    : usage?.rankingTier === 'STARTER'
      ? 'Starter'
      : usage?.rankingTier === 'HIGHEST'
        ? 'Highest'
        : usage?.rankingTier === 'CUSTOM'
          ? 'Custom'
          : isProfessionalPlan
            ? 'Priority'
            : isStarterPlan
              ? 'Starter'
              : 'Standard';

  const shipmentLimitWarning = shipmentLimit
    ? (shipmentsUsedThisMonth / shipmentLimit) >= 0.8
    : false;

  const marketingLimitUsed = usage?.marketingEmailsSent;
  const marketingLimitTotal = usage?.limits?.marketingEmailLimit;
  const marketingLimitWarning = marketingLimitUsed !== undefined && marketingLimitTotal
    ? (marketingLimitUsed / marketingLimitTotal) >= 0.8
    : false;

  const upgradePlan = plans.find((plan) => {
    const planName = plan.name.toUpperCase();
    const planId = (plan.id || '').toUpperCase();
    return planName !== 'FREE' && planId !== 'FREE' && planName !== 'ENTERPRISE' && planId !== 'ENTERPRISE';
  });
  const handleUpgradeClick = () => {
    if (upgradePlan?.id) {
      handlePlanSelect(upgradePlan.id);
      return;
    }
    handleManageSubscription();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Subscription</h1>
        <p className="text-gray-600 mt-2 text-sm sm:text-base">Manage your subscription plan</p>
      </div>

      {/* Success Message */}
      {status === 'success' && (
        <Card className="border-green-500 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-green-100 p-2">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-green-900 mb-1">Subscription Successful!</h3>
                <p className="text-sm text-green-700">
                  Your subscription has been activated successfully. Your subscription details have been updated.
                  {isLoadingSubscription && (
                    <span className="ml-2 inline-flex items-center">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </span>
                  )}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStatus('idle')}
                className="text-green-700 hover:text-green-900"
              >
                <XCircle className="h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cancelled Message */}
      {status === 'cancelled' && (
        <Card className="border-orange-500 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-orange-100 p-2">
                <AlertCircle className="h-6 w-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-orange-900 mb-1">Subscription Cancelled</h3>
                <p className="text-sm text-orange-700 mb-4">
                  The subscription checkout was cancelled. You can try again by selecting a plan below.
                </p>
                <Button
                  onClick={() => setStatus('idle')}
                  variant="outline"
                  size="sm"
                  className="border-orange-600 text-orange-700 hover:bg-orange-100"
                >
                  Dismiss
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStatus('idle')}
                className="text-orange-700 hover:text-orange-900"
              >
                <XCircle className="h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <Card>
          <CardContent className="text-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-orange-600" />
          </CardContent>
        </Card>
      ) : subscription ? (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Current Plan</CardTitle>
                <CardDescription>Your active subscription details</CardDescription>
              </div>
              <Badge className={subscription.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                {subscription.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                {isFreePlan && (
                  <Badge className="bg-orange-100 text-orange-700">
                    You pay 15% commission on every booking
                  </Badge>
                )}
              <div className="flex flex-col gap-2 sm:items-end">
                <Button variant="outline" onClick={handleUpdatePaymentMethod} className="w-full sm:w-auto">
                  Manage Billing
                </Button>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Commission Rate</p>
                <p className={`mt-1 text-lg font-semibold ${commissionRateDisplay === '0%' ? 'text-green-700' : 'text-gray-900'}`}>
                  {commissionRateDisplay}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Monthly Slot Limit</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {shipmentsUsedThisMonth} / {shipmentLimit ?? 'Unlimited'}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Team Members</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {teamMembersUsed} / {teamMembersAllowed ?? 'Unlimited'}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Slot Listing Ranking Tier</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">{rankingTier}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">No active subscription</p>
          </CardContent>
        </Card>
      )}

      {/* This Month's Usage */}
      {subscription && (
        <Card>
          <CardHeader>
            <CardTitle>📊 This Month’s Usage</CardTitle>
            <CardDescription>Track your usage and see commission savings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Shipments Used</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {shipmentsUsedThisMonth} / {shipmentLimit ?? 'Unlimited'}
                </p>
                {shipmentLimit && (
                  <div className="mt-3 h-2 w-full rounded-full bg-gray-100">
                    <div
                      className="h-2 rounded-full bg-orange-500"
                      style={{ width: `${shipmentUsagePercent}%` }}
                    />
                  </div>
                )}
              </div>
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Commission Paid</p>
                <p className={`mt-1 text-lg font-semibold ${isFreePlan ? 'text-gray-900' : 'text-green-700'}`}>
                  {isFreePlan ? formatCurrency(commissionPaidThisMonth) : '£0'}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Potential Savings</p>
                <p className={`mt-1 text-lg font-semibold ${isFreePlan ? 'text-gray-900' : 'text-green-700'}`}>
                  {formatCurrency(potentialSavings)}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {isFreePlan
                    ? `Upgrade to save ${formatCurrency(potentialSavings)} in commission`
                    : `You saved ${formatCurrency(potentialSavings)} in commission this month`}
                </p>
              </div>
            </div>
            {commissionPaidThisMonth > 0 && (
              <div className="mt-4">
                <Button onClick={handleUpgradeClick} className="w-full sm:w-auto">
                  Upgrade to stop paying commission
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Marketing & Promotions Usage */}
      {subscription && (
        <Card>
          <CardHeader>
            <CardTitle>📣 Marketing & Promotions</CardTitle>
            <CardDescription>Monthly marketing activity and credits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Marketing Emails</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {usage?.marketingEmailsSent ?? 0} / {usage?.limits?.marketingEmailLimit ?? '—'}
                </p>
                {usage?.limits?.marketingEmailLimit ? (
                  <div className="mt-3 h-2 w-full rounded-full bg-gray-100">
                    <div
                      className="h-2 rounded-full bg-orange-500"
                      style={{
                        width: `${Math.min(
                          100,
                          (usage?.marketingEmailsSent ?? 0) / usage.limits.marketingEmailLimit * 100
                        )}%`,
                      }}
                    />
                  </div>
                ) : null}
              </div>
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">WhatsApp Promos</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {usage?.whatsappPromoSent ?? 0} / {usage?.limits?.whatsappPromoLimit ?? '—'}
                </p>
                {usage?.limits?.whatsappPromoLimit ? (
                  <div className="mt-3 h-2 w-full rounded-full bg-gray-100">
                    <div
                      className="h-2 rounded-full bg-orange-500"
                      style={{
                        width: `${Math.min(
                          100,
                          (usage?.whatsappPromoSent ?? 0) / usage.limits.whatsappPromoLimit * 100
                        )}%`,
                      }}
                    />
                  </div>
                ) : null}
              </div>
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">WhatsApp Stories</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {usage?.whatsappStoriesPosted ?? 0} / {usage?.limits?.whatsappStoryLimit ?? '—'}
                </p>
                {usage?.limits?.whatsappStoryLimit ? (
                  <div className="mt-3 h-2 w-full rounded-full bg-gray-100">
                    <div
                      className="h-2 rounded-full bg-orange-500"
                      style={{
                        width: `${Math.min(
                          100,
                          (usage?.whatsappStoriesPosted ?? 0) / usage.limits.whatsappStoryLimit * 100
                        )}%`,
                      }}
                    />
                  </div>
                ) : null}
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">WhatsApp Promo Credits</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {usage?.creditWallets?.whatsappPromo?.balance ?? usage?.whatsappPromoCreditsBalance ?? 0} balance
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {usage?.creditWallets?.whatsappPromo?.used ?? usage?.whatsappPromoCreditsUsed ?? 0} used / {usage?.limits?.monthlyWhatsappPromoCreditsIncluded ?? 0} included
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">WhatsApp Story Credits</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {usage?.creditWallets?.whatsappStory?.balance ?? usage?.whatsappStoryCreditsBalance ?? 0} balance
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {usage?.creditWallets?.whatsappStory?.used ?? usage?.whatsappStoryCreditsUsed ?? 0} used / {usage?.limits?.monthlyWhatsappStoryCreditsIncluded ?? 0} included
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Marketing Email Credits</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {usage?.creditWallets?.marketingEmail?.balance ?? usage?.marketingEmailCreditsBalance ?? 0} balance
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {usage?.creditWallets?.marketingEmail?.used ?? usage?.marketingEmailCreditsUsed ?? 0} used / {usage?.limits?.monthlyMarketingEmailCreditsIncluded ?? 0} included
                </p>
              </div>
            </div>
            <p className="mt-4 text-xs text-gray-500">
              Billing period: {usage?.periodStart ? new Date(usage.periodStart).toLocaleDateString() : '—'} →{' '}
              {usage?.periodEnd ? new Date(usage.periodEnd).toLocaleDateString() : '—'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Available Plans */}
      {plans.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Available Plans</CardTitle>
                <CardDescription>Choose the plan that works best for your business</CardDescription>
              </div>
              <Link href="/pricing" className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1">
                View full details
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.filter((plan) => {
                const planNameUpper = plan.name.toUpperCase();
                const planIdUpper = (plan.id || '').toUpperCase();
                return planNameUpper !== 'ENTERPRISE' && planIdUpper !== 'ENTERPRISE' && plan.name !== 'Enterprise';
              }).map((plan) => {
                const isCurrentPlan = subscription?.companyPlan.id === plan.id;
                const currentPlanPrice = subscription?.companyPlan.priceMonthly 
                  ? parseFloat(String(subscription.companyPlan.priceMonthly)) 
                  : 0;
                const planPrice = parseFloat(String(plan.priceMonthly));
                const isUpgrade = planPrice > currentPlanPrice;
                const isDowngrade = planPrice < currentPlanPrice && !isCurrentPlan;
                const isFreePlan = subscription?.companyPlan.name?.toUpperCase() === 'FREE' || 
                                  subscription?.companyPlan.name === 'Free' ||
                                  currentPlanPrice === 0;
                const isUpgradingFromFree = isFreePlan && isUpgrade;
                
                const planNameUpper = plan.name.toUpperCase();
                const planIdUpper = (plan.id || '').toUpperCase();

                const planLabel = planNameUpper === 'FREE' || planIdUpper === 'FREE'
                  ? '15% commission per shipment'
                  : planNameUpper === 'PROFESSIONAL' || planIdUpper === 'PROFESSIONAL'
                    ? '0% commission + priority exposure'
                    : '0% commission';

                const bestFor = planNameUpper === 'FREE' || planIdUpper === 'FREE'
                  ? 'Occasional shippers'
                  : planNameUpper === 'PROFESSIONAL' || planIdUpper === 'PROFESSIONAL'
                    ? 'High-volume operators'
                    : 'Growing carriers';

                const isDowngradeRestricted = isDowngrade && (
                  (plan.maxActiveShipmentSlots !== null && shipmentsUsedThisMonth > plan.maxActiveShipmentSlots) ||
                  (plan.maxTeamMembers !== null && teamMembersUsed > plan.maxTeamMembers)
                );
                
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
                  // Fallback
                  if (plan.maxActiveShipmentSlots !== null) {
                    keyHighlights.push(`Up to ${plan.maxActiveShipmentSlots} shipments`);
                  } else {
                    keyHighlights.push('Unlimited shipments');
                  }
                  if (plan.maxTeamMembers !== null) {
                    keyHighlights.push(`Up to ${plan.maxTeamMembers} team members`);
                  } else {
                    keyHighlights.push('Unlimited team members');
                  }
                }

                return (
                  <Card 
                    key={plan.id} 
                    className={`relative transition-all hover:shadow-lg ${
                      plan.isDefault ? 'border-orange-300 border-2 shadow-md' : 'border-gray-200'
                    } ${isCurrentPlan ? 'ring-2 ring-green-500 ring-offset-2' : ''}`}
                  >
                    {plan.isDefault && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                        <Badge className="bg-orange-600 text-white px-3 py-0.5">Most Popular</Badge>
                      </div>
                    )}
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between mb-2">
                        <CardTitle className="text-xl">{plan.name}</CardTitle>
                        {isCurrentPlan && (
                          <Badge className="bg-green-100 text-green-800 text-xs">Current</Badge>
                        )}
                        {/* {!isCurrentPlan && subscription && (
                          <>
                            {isUpgrade && (
                              <Badge className="bg-blue-100 text-blue-800 text-xs">Upgrade</Badge>
                            )}
                            {isDowngrade && (
                              <Badge className="bg-gray-100 text-gray-800 text-xs">Downgrade</Badge>
                            )}
                          </>
                        )} */}
                      </div>
                      <div className="mt-4">
                        <span className="text-3xl font-bold text-gray-900">
                          {planNameUpper === 'ENTERPRISE' || planIdUpper === 'ENTERPRISE' ? 'Custom' : `£${plan.priceMonthly}`}
                        </span>
                        {planNameUpper !== 'ENTERPRISE' && planIdUpper !== 'ENTERPRISE' && (
                          <span className="text-gray-600 text-base ml-1">/month</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-2">{planLabel}</p>
                      <p className="text-xs text-gray-500 mt-1">Best for: {bestFor}</p>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <ul className="space-y-2 mb-6 min-h-[80px]">
                        {keyHighlights.slice(0, 3).map((highlight, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-gray-700">{highlight}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="space-y-2">
                        <Button
                          className="w-full"
                          variant={isCurrentPlan ? 'outline' : plan.isDefault ? 'default' : 'outline'}
                          disabled={isCurrentPlan || processingPlan === plan.id || isDowngradeRestricted}
                          onClick={() => {
                            if (isUpgradingFromFree) {
                              handlePlanSelect(plan.id);
                            } else if (isUpgrade || isDowngrade) {
                              handleManageSubscription();
                            } else {
                              handlePlanSelect(plan.id);
                            }
                          }}
                        >
                          {processingPlan === plan.id ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : isCurrentPlan ? (
                            'Current Plan'
                          ) : isUpgrade ? (
                            'Upgrade'
                          ) : isDowngrade ? (
                            'Downgrade'
                          ) : (
                            'Select Plan'
                          )}
                        </Button>
                        {isDowngradeRestricted && (
                          <p className="text-xs text-orange-600 text-center">
                            Downgrade blocked due to current usage limits
                          </p>
                        )}
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
          </CardContent>
        </Card>
      )}

      {/* Limit Warnings */}
      {(shipmentLimitWarning || marketingLimitWarning) && (
        <div className="space-y-3">
          {shipmentLimitWarning && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="pt-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-orange-900">You’ve used 80% of your shipment limit</p>
                    <p className="text-sm text-orange-700">
                      Upgrade to keep publishing without interruptions.
                    </p>
                  </div>
                  <Button className="sm:w-auto w-full">Upgrade plan</Button>
                </div>
              </CardContent>
            </Card>
          )}
          {marketingLimitWarning && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="pt-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-orange-900">You’re close to your marketing limit</p>
                    <p className="text-sm text-orange-700">
                      Upgrade to keep reaching new customers without caps.
                    </p>
                  </div>
                  <Button className="sm:w-auto w-full">Upgrade plan</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Billing & Payments */}
      <Card>
        <CardHeader>
          <CardTitle>💳 Billing & Payments</CardTitle>
          <CardDescription>View billing details and manage your subscription</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Current Plan</p>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {subscription?.companyPlan?.name ?? 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Subscription Status</p>
              <p className="mt-1 text-sm font-medium text-gray-900">{subscription?.status ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Next Billing Date</p>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : '—'}
              </p>
            </div>
            <div className="flex items-center">
              <Button variant="outline" onClick={handleUpdatePaymentMethod} className="w-full">
                Manage billing in Stripe
              </Button>
            </div>
          </div>
          {isFreePlan && (
            <p className="mt-4 text-sm text-gray-500">You’re currently on the Free plan.</p>
          )}
        </CardContent>
      </Card>

      {/* Enterprise CTA */}
      <Card className="border-gray-200 bg-gray-50">
        <CardHeader>
          <CardTitle>Need more scale?</CardTitle>
          <CardDescription>
            For high-volume logistics companies with custom needs, SLAs, and integrations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/contact">Contact sales</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SubscriptionPage() {
  return (
    <Suspense fallback={
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Subscription</h1>
          <p className="text-gray-600 mt-2">Manage your subscription plan</p>
        </div>
        <Card>
          <CardContent className="text-center py-8">
            <Loader2 className="h-8 w-8 text-orange-600 animate-spin mx-auto mb-4" />
            <p className="text-sm text-gray-600">Loading...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <SubscriptionContent />
    </Suspense>
  );
}


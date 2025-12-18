'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { companyApi } from '@/lib/company-api';
import type { Subscription, Plan } from '@/lib/company-api';
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

  useEffect(() => {
    fetchSubscriptionData();
    fetchPlans();
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
      // Clean URL
      window.history.replaceState({}, '', '/company/subscription');
    }
  }, [searchParams]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Subscription</h1>
        <p className="text-gray-600 mt-2">Manage your subscription plan</p>
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

      {/* Current Plan */}
      {loading ? (
        <Card>
          <CardContent className="text-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-orange-600" />
          </CardContent>
        </Card>
      ) : subscription ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
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
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{subscription.companyPlan.name} Plan</p>
                <p className="text-gray-600">
                  £{subscription.companyPlan.priceMonthly}/month
                </p>
                {subscription.currentPeriodEnd && (
                  <p className="text-sm text-gray-500 mt-2">
                    Next billing date: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </p>
                )}
              </div>
              <Button variant="outline" onClick={handleUpdatePaymentMethod}>
                Manage Billing
              </Button>
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

      {/* Plans Comparison */}
      {plans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Available Plans</CardTitle>
            <CardDescription>Choose the plan that works best for your business</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              {plans.map((plan) => {
                const isCurrentPlan = subscription?.companyPlan.id === plan.id;
                const features: string[] = [];
                
                if (plan.maxActiveShipmentSlots !== null) {
                  features.push(`Up to ${plan.maxActiveShipmentSlots} active shipments`);
                } else {
                  features.push('Unlimited active shipments');
                }
                
                if (plan.maxTeamMembers !== null) {
                  features.push(`Up to ${plan.maxTeamMembers} team members`);
                } else {
                  features.push('Unlimited team members');
                }
                
                features.push('Basic analytics');
                if (!plan.isDefault) {
                  features.push('Advanced analytics & reports');
                  features.push('Priority support');
                }

                return (
                  <Card key={plan.id} className={plan.isDefault ? 'border-orange-600 border-2' : ''}>
                    {plan.isDefault && (
                      <div className="p-4 pb-0">
                        <Badge className="bg-orange-600">Recommended</Badge>
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle>{plan.name}</CardTitle>
                      <div className="mt-4">
                        <span className="text-3xl font-bold">
                          £{plan.priceMonthly}
                        </span>
                        <span className="text-gray-600">/month</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3 mb-6">
                        {features.map((feature, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <Check className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Button
                        className="w-full"
                        variant={isCurrentPlan ? 'outline' : plan.isDefault ? 'default' : 'outline'}
                        disabled={isCurrentPlan || processingPlan === plan.id}
                        onClick={() => handlePlanSelect(plan.id)}
                      >
                        {processingPlan === plan.id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : isCurrentPlan ? (
                          'Current Plan'
                        ) : (
                          'Select Plan'
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
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


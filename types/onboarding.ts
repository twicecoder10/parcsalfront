// Types for Stripe Connect onboarding

export interface OnboardingStep {
  completed: boolean;
  completedAt?: string;
}

export interface OnboardingStatus {
  steps: {
    company_profile?: OnboardingStep;
    payment_setup?: OnboardingStep;
    payout_setup?: OnboardingStep;
    first_shipment_slot?: OnboardingStep;
    [key: string]: OnboardingStep | undefined;
  };
  completed: boolean;
  progress: number;
}

export interface StripeConnectStatus {
  stripeAccountId: string | null;
  stripeOnboardingStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETE';
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
}


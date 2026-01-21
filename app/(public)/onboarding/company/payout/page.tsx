'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { StripeConnectOnboarding } from '@/components/stripe-connect-onboarding';

export default function OnboardingPayoutPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-orange-50 via-white to-orange-50">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => router.push('/onboarding/company')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Onboarding
            </Button>
          </div>

          <div className="space-y-6">
            <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
              <StripeConnectOnboarding />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}


'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { CarrierPlan } from '@/lib/plan-entitlements';
import { getUpgradePlan } from '@/lib/plan-entitlements';

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan?: CarrierPlan | null;
  feature?: string;
  message?: string;
}

export function UpgradeModal({
  open,
  onOpenChange,
  currentPlan,
  feature,
  message,
}: UpgradeModalProps) {
  const router = useRouter();
  const upgradePlan = getUpgradePlan(currentPlan || null);

  const handleUpgrade = () => {
    onOpenChange(false);
    router.push('/company/subscription');
  };

  const getFeatureName = () => {
    if (feature) return feature;
    if (message?.includes('Starter')) return 'Starter plan features';
    if (message?.includes('Professional')) return 'Professional plan features';
    return 'this feature';
  };

  const getRequiredPlan = () => {
    if (message?.includes('Starter')) return 'Starter';
    if (message?.includes('Professional')) return 'Professional';
    if (message?.includes('Enterprise')) return 'Enterprise';
    return upgradePlan || 'Starter';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-full bg-orange-100 p-2">
              <Sparkles className="h-5 w-5 text-orange-600" />
            </div>
            <DialogTitle>Upgrade Required</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            {message || `This feature requires a ${getRequiredPlan()} plan or higher.`}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
            <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-orange-900">
                {getFeatureName()} is not available on your current plan.
              </p>
              <p className="text-sm text-orange-700 mt-1">
                Upgrade to {upgradePlan || getRequiredPlan()} plan to unlock this feature and more.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Maybe Later
          </Button>
          <Button
            onClick={handleUpgrade}
            className="w-full sm:w-auto"
          >
            View Plans
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


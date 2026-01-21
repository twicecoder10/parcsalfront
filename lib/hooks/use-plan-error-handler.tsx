import { useState, useCallback } from 'react';
import { UpgradeModal } from '@/components/upgrade-modal';
import { handlePlanError, type PlanErrorInfo } from '@/lib/error-handler';
import { useCompanyPlan } from './use-company-plan';

/**
 * Hook for handling plan-related errors with upgrade modal
 */
export function usePlanErrorHandler() {
  const { plan } = useCompanyPlan();
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [errorInfo, setErrorInfo] = useState<PlanErrorInfo | null>(null);

  const handleError = useCallback((error: any) => {
    const planError = handlePlanError(error);
    if (planError.isPlanError) {
      setErrorInfo(planError);
      setUpgradeModalOpen(true);
      return true; // Error was handled
    }
    return false; // Error was not a plan error
  }, []);

  const UpgradeModalComponent = () => (
    <UpgradeModal
      open={upgradeModalOpen}
      onOpenChange={setUpgradeModalOpen}
      currentPlan={plan || null}
      feature={errorInfo?.feature}
      message={errorInfo?.message}
    />
  );

  return {
    handleError,
    UpgradeModal: UpgradeModalComponent,
  };
}


# Plan Entitlements Usage Guide

This guide shows how to use the plan entitlements system in your components.

## Basic Usage

### 1. Using the `useCompanyPlan` Hook

```tsx
import { useCompanyPlan } from '@/lib/hooks/use-company-plan';

function MyComponent() {
  const {
    plan,
    planActive,
    canUseSlotTemplates,
    canAccessWarehouses,
    maxTeamMembers,
    marketingEmailLimit,
    usage,
    isMarketingEmailLimitReached,
  } = useCompanyPlan();

  return (
    <div>
      <p>Current Plan: {plan}</p>
      {canUseSlotTemplates && <SlotTemplatesButton />}
      {canAccessWarehouses && <WarehousesSection />}
    </div>
  );
}
```

### 2. Handling 403 Errors with Upgrade Modal

```tsx
import { usePlanErrorHandler } from '@/lib/hooks/use-plan-error-handler';
import { companyApi } from '@/lib/company-api';

function MyComponent() {
  const { handleError, UpgradeModal } = usePlanErrorHandler();

  const handleAction = async () => {
    try {
      await companyApi.someGatedAction();
    } catch (error) {
      // This will automatically show upgrade modal for plan errors
      if (!handleError(error)) {
        // Handle non-plan errors
        toast.error(getErrorMessage(error));
      }
    }
  };

  return (
    <>
      <Button onClick={handleAction}>Do Action</Button>
      <UpgradeModal />
    </>
  );
}
```

### 3. Feature Gating in UI

```tsx
import { useCompanyPlan } from '@/lib/hooks/use-company-plan';
import { Button } from '@/components/ui/button';

function FeatureButton() {
  const { canUseSlotTemplates, plan } = useCompanyPlan();

  return (
    <Button
      disabled={!canUseSlotTemplates}
      title={!canUseSlotTemplates ? `Upgrade to Starter plan to use slot templates` : ''}
      onClick={handleClick}
    >
      Create Template
    </Button>
  );
}
```

### 4. Using Usage Display Components

```tsx
import { UsageMeter } from '@/components/usage-meter';
import { TeamUsageDisplay } from '@/components/team-usage-display';
import { useCompanyPlan } from '@/lib/hooks/use-company-plan';

function UsageDashboard() {
  const { usage, marketingEmailLimit, plan } = useCompanyPlan();

  return (
    <div className="grid grid-cols-3 gap-4">
      <TeamUsageDisplay
        currentCount={5}
        limit={10}
        plan={plan}
      />
      <UsageMeter
        current={usage?.marketingEmailsSent || 0}
        limit={marketingEmailLimit}
        label="Marketing Emails"
        unit="emails"
        periodLabel="This month"
      />
      <UsageMeter
        current={usage?.promoCreditsBalance || 0}
        limit={usage?.limits.promoCreditsIncluded || 0}
        label="Promo Credits"
        unit="credits"
      />
    </div>
  );
}
```

### 5. Manual Plan Checks

```tsx
import {
  canUseSlotTemplates,
  canAccessWarehouses,
  getMaxTeamMembers,
  getMinimumPlanForFeature,
} from '@/lib/plan-entitlements';
import type { CarrierPlan } from '@/lib/plan-entitlements';

function MyComponent() {
  const currentPlan: CarrierPlan = 'FREE';
  
  if (canUseSlotTemplates(currentPlan)) {
    // Show slot templates feature
  }
  
  const minPlan = getMinimumPlanForFeature('warehouses'); // Returns 'PROFESSIONAL'
}
```

## API Endpoints

The system uses these endpoints:

- `GET /companies/me` - Returns company info including plan
- `GET /companies/me/usage` - Returns usage statistics

## Error Handling

The backend returns 403 errors with descriptive messages. The frontend:

1. Parses the error message
2. Shows upgrade modal if it's a plan error
3. Handles limit errors (team, email, credits) appropriately

Example error messages handled:
- "This feature requires Starter plan or higher."
- "Team member limit reached. Maximum X team members allowed on [PLAN] plan."
- "Email limit exceeded. You have sent X emails this month."

## Plan Features Reference

### FREE Plan
- ✅ maxTeamMembers: 1
- ❌ slotTemplates: Not available
- ❌ advancedSlotRules: Not available
- ❌ scanModule: Not available
- ❌ warehousesModule: Not available
- ❌ marketingEmailsIncluded: 0

### STARTER Plan
- ✅ maxTeamMembers: 3
- ✅ slotTemplates: Available
- ❌ advancedSlotRules: Not available
- ❌ scanModule: Not available
- ❌ warehousesModule: Not available
- ✅ marketingEmailsIncluded: 5,000 / month

### PROFESSIONAL Plan
- ✅ maxTeamMembers: 10
- ✅ slotTemplates: Available
- ✅ advancedSlotRules: Available
- ✅ scanModule: Available
- ✅ warehousesModule: Available
- ✅ marketingEmailsIncluded: 20,000 / month

### ENTERPRISE Plan
- ✅ maxTeamMembers: UNLIMITED
- ✅ All features available
- ✅ marketingEmailsIncluded: CUSTOM/UNLIMITED


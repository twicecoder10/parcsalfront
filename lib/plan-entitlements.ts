// Plan entitlements types and helper functions

export type CarrierPlan = 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';

export interface CompanyInfo {
  id: string;
  plan: CarrierPlan;
  planActive: boolean;
  rankingTier: 'STANDARD' | 'STARTER' | 'PRIORITY' | 'HIGHEST' | 'CUSTOM';
  commissionRateBps: number | null;
  [key: string]: any; // Allow other fields from API
}

export interface CompanyUsage {
  id?: string;
  companyId?: string;
  periodStart: string | Date;
  periodEnd: string | Date;
  shipmentsCreated: number; // Shipments created this month
  marketingEmailsSent: number;
  whatsappPromoSent: number; // WhatsApp promo messages sent this month
  whatsappStoriesPosted: number; // WhatsApp stories posted this month
  whatsappPromoCreditsBalance?: number;
  whatsappPromoCreditsUsed?: number;
  whatsappStoryCreditsBalance?: number;
  whatsappStoryCreditsUsed?: number;
  marketingEmailCreditsBalance?: number;
  marketingEmailCreditsUsed?: number;
  updatedAt?: string;
  createdAt?: string;
  company?: {
    plan: CarrierPlan;
  };
  teamMembersCount?: number;
  revenueProcessed?: number;
  commissionPaid?: number;
  potentialSavings?: number;
  commissionRate?: number;
  commissionRatePercent?: number;
  rankingTier?: 'STANDARD' | 'STARTER' | 'PRIORITY' | 'HIGHEST' | 'CUSTOM';
  creditWallets?: {
    whatsappPromo: {
      balance: number;
      used: number;
    };
    whatsappStory: {
      balance: number;
      used: number;
    };
    marketingEmail: {
      balance: number;
      used: number;
    };
  };
  limits: {
    marketingEmailLimit: number;
    monthlyWhatsappPromoCreditsIncluded?: number;
    monthlyWhatsappStoryCreditsIncluded?: number;
    monthlyMarketingEmailCreditsIncluded?: number;
    monthlyShipmentLimit?: number;
    teamMembersLimit?: number;
    whatsappPromoLimit?: number;
    whatsappStoryLimit?: number;
  };
}

// Plan feature checks
export const canUseSlotTemplates = (plan: CarrierPlan | undefined | null): boolean => {
  if (!plan) return false;
  return ['STARTER', 'PROFESSIONAL', 'ENTERPRISE'].includes(plan);
};

export const canUseAdvancedSlotRules = (plan: CarrierPlan | undefined | null): boolean => {
  if (!plan) return false;
  return ['PROFESSIONAL', 'ENTERPRISE'].includes(plan);
};

export const canAccessScanModule = (plan: CarrierPlan | undefined | null): boolean => {
  // Scan module is available for STARTER and above
  if (!plan) return false;
  return ['STARTER', 'PROFESSIONAL', 'ENTERPRISE'].includes(plan);
};

export const canAccessWarehouses = (plan: CarrierPlan | undefined | null): boolean => {
  // Warehouses are available for STARTER and above
  if (!plan) return false;
  return ['STARTER', 'PROFESSIONAL', 'ENTERPRISE'].includes(plan);
};

export const canAccessAnalytics = (plan: CarrierPlan | undefined | null): boolean => {
  if (!plan) return false;
  return ['STARTER', 'PROFESSIONAL', 'ENTERPRISE'].includes(plan);
};

export const getMaxTeamMembers = (plan: CarrierPlan | undefined | null): number => {
  if (!plan) return 1;
  const limits: Record<CarrierPlan, number> = {
    FREE: 1,
    STARTER: 3,
    PROFESSIONAL: Infinity,
    ENTERPRISE: Infinity,
  };
  return limits[plan];
};

export const getMarketingEmailLimit = (plan: CarrierPlan | undefined | null): number => {
  if (!plan) return 0;
  const limits: Record<CarrierPlan, number> = {
    FREE: 0, // Cannot run email campaigns
    STARTER: 1000,
    PROFESSIONAL: 5000,
    ENTERPRISE: Infinity,
  };
  return limits[plan];
};

export const getPromoCreditsIncluded = (plan: CarrierPlan | undefined | null): number => {
  if (!plan) return 0;
  const limits: Record<CarrierPlan, number> = {
    FREE: 0,
    STARTER: 100,
    PROFESSIONAL: 500,
    ENTERPRISE: Infinity,
  };
  return limits[plan];
};

export const getMaxShipmentsPerMonth = (plan: CarrierPlan | undefined | null): number => {
  if (!plan) return 3;
  const limits: Record<CarrierPlan, number> = {
    FREE: 3,
    STARTER: 20,
    PROFESSIONAL: Infinity,
    ENTERPRISE: Infinity,
  };
  return limits[plan];
};

export const getWhatsappPromoLimit = (plan: CarrierPlan | undefined | null): number => {
  if (!plan) return 0;
  const limits: Record<CarrierPlan, number> = {
    FREE: 0, // Can purchase PAYG credits
    STARTER: 100,
    PROFESSIONAL: 250,
    ENTERPRISE: Infinity,
  };
  return limits[plan];
};

export const getWhatsappStoryLimit = (plan: CarrierPlan | undefined | null): number => {
  if (!plan) return 0;
  const limits: Record<CarrierPlan, number> = {
    FREE: 0,
    STARTER: 20,
    PROFESSIONAL: 50,
    ENTERPRISE: Infinity,
  };
  return limits[plan];
};

export const getCommissionRate = (plan: CarrierPlan | undefined | null): number => {
  if (!plan) return 0.15; // Default to FREE rate
  const rates: Record<CarrierPlan, number> = {
    FREE: 0.15, // 15%
    STARTER: 0, // 0%
    PROFESSIONAL: 0, // 0%
    ENTERPRISE: 0, // 0% (can be overridden by admin)
  };
  return rates[plan];
};

export const getRankingTier = (plan: CarrierPlan | undefined | null): 'STANDARD' | 'STARTER' | 'PRIORITY' | 'HIGHEST' | 'CUSTOM' => {
  if (!plan) return 'STANDARD';
  const tiers: Record<CarrierPlan, 'STANDARD' | 'STARTER' | 'PRIORITY' | 'HIGHEST' | 'CUSTOM'> = {
    FREE: 'STANDARD',
    STARTER: 'STARTER',
    PROFESSIONAL: 'PRIORITY',
    ENTERPRISE: 'CUSTOM', // Enterprise can have custom ranking
  };
  return tiers[plan];
};

// Helper to check if a plan supports a feature
export const planSupportsFeature = (
  plan: CarrierPlan | undefined | null,
  feature: 'slotTemplates' | 'advancedSlotRules' | 'scanModule' | 'warehouses' | 'analytics'
): boolean => {
  switch (feature) {
    case 'slotTemplates':
      return canUseSlotTemplates(plan);
    case 'advancedSlotRules':
      return canUseAdvancedSlotRules(plan);
    case 'scanModule':
      return canAccessScanModule(plan);
    case 'warehouses':
      return canAccessWarehouses(plan);
    case 'analytics':
      return canAccessAnalytics(plan);
    default:
      return false;
  }
};

// Helper to get the minimum plan required for a feature
export const getMinimumPlanForFeature = (
  feature: 'slotTemplates' | 'advancedSlotRules' | 'scanModule' | 'warehouses' | 'analytics'
): CarrierPlan => {
  switch (feature) {
    case 'slotTemplates':
    case 'analytics':
      return 'STARTER';
    case 'advancedSlotRules':
      return 'PROFESSIONAL';
    case 'scanModule':
      // Available to STARTER and above
      return 'STARTER';
    case 'warehouses':
      // Available to STARTER and above
      return 'STARTER';
    default:
      return 'FREE';
  }
};

// Helper to get upgrade plan suggestion
export const getUpgradePlan = (currentPlan: CarrierPlan | undefined | null): CarrierPlan | null => {
  if (!currentPlan) return 'STARTER';
  const upgradePath: Record<CarrierPlan, CarrierPlan | null> = {
    FREE: 'STARTER',
    STARTER: 'PROFESSIONAL',
    PROFESSIONAL: 'ENTERPRISE',
    ENTERPRISE: null,
  };
  return upgradePath[currentPlan];
};


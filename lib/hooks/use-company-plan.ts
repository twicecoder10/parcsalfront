import { useQuery } from '@tanstack/react-query';
import { companyApi } from '@/lib/company-api';
import type { CarrierPlan, CompanyInfo, CompanyUsage } from '@/lib/plan-entitlements';
import {
  canUseSlotTemplates,
  canUseAdvancedSlotRules,
  canAccessScanModule,
  canAccessWarehouses,
  canAccessAnalytics,
  getMaxTeamMembers,
  getMaxShipmentsPerMonth,
  getMarketingEmailLimit,
  getPromoCreditsIncluded,
  getWhatsappPromoLimit,
  getWhatsappStoryLimit,
  getCommissionRate,
} from '@/lib/plan-entitlements';

export interface UseCompanyPlanReturn {
  plan: CarrierPlan | undefined;
  planActive: boolean | undefined;
  rankingTier: 'STANDARD' | 'STARTER' | 'PRIORITY' | 'HIGHEST' | 'CUSTOM' | undefined;
  commissionRateBps: number | null | undefined;
  usage: CompanyUsage | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  // Feature checks
  canUseSlotTemplates: boolean;
  canUseAdvancedSlotRules: boolean;
  canAccessScanModule: boolean;
  canAccessWarehouses: boolean;
  canAccessAnalytics: boolean;
  // Limits
  maxTeamMembers: number;
  maxShipmentsPerMonth: number;
  marketingEmailLimit: number;
  promoCreditsIncluded: number;
  whatsappPromoLimit: number;
  whatsappStoryLimit: number;
  commissionRate: number;
  // Usage helpers
  marketingEmailsRemaining: number;
  isMarketingEmailLimitReached: boolean;
  promoCreditsRemaining: number;
  isPromoCreditsLow: boolean;
}

export function useCompanyPlan(): UseCompanyPlanReturn {
  // Fetch company info (includes plan)
  const {
    data: companyInfo,
    isLoading: isLoadingInfo,
    isError: isErrorInfo,
    error: errorInfo,
  } = useQuery<CompanyInfo>({
    queryKey: ['company', 'info'],
    queryFn: async () => {
      const data = await companyApi.getCompanyInfo();
      return {
        ...data,
        plan: data.plan,
        planActive: data.planActive,
        rankingTier: data.rankingTier,
        commissionRateBps: data.commissionRateBps,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  // Fetch company usage
  const {
    data: usage,
    isLoading: isLoadingUsage,
    isError: isErrorUsage,
    error: errorUsage,
  } = useQuery<CompanyUsage>({
    queryKey: ['company', 'usage'],
    queryFn: async () => {
      const data = await companyApi.getCompanyUsage();
      return {
        shipmentsCreated: 0, // Not provided by API
        marketingEmailsSent: data.marketingEmailsSent,
        whatsappPromoSent: 0, // Not provided by API
        whatsappStoriesPosted: 0, // Not provided by API
        promoCreditsBalance: data.promoCreditsBalance,
        promoCreditsUsed: data.promoCreditsUsed,
        periodStart: new Date(data.periodStart),
        periodEnd: new Date(data.periodEnd),
        limits: {
          marketingEmailLimit: data.limits.marketingEmailLimit,
          promoCreditsIncluded: data.limits.promoCreditsIncluded,
        },
      };
    },
    enabled: !!companyInfo, // Only fetch if company info exists
    staleTime: 2 * 60 * 1000, // 2 minutes (usage changes more frequently)
    retry: 1,
  });

  const plan = companyInfo?.plan;
  const planActive = companyInfo?.planActive;
  const rankingTier = companyInfo?.rankingTier;
  const commissionRateBps = companyInfo?.commissionRateBps;

  // Calculate usage helpers
  const marketingEmailLimit = getMarketingEmailLimit(plan);
  const marketingEmailsRemaining = Math.max(0, marketingEmailLimit - (usage?.marketingEmailsSent || 0));
  const isMarketingEmailLimitReached = marketingEmailLimit > 0 && marketingEmailsRemaining === 0;

  const promoCreditsRemaining = usage?.promoCreditsBalance || 0;
  const promoCreditsIncluded = getPromoCreditsIncluded(plan);
  const isPromoCreditsLow = promoCreditsRemaining < 10; // Low threshold

  return {
    plan,
    planActive,
    rankingTier,
    commissionRateBps,
    usage,
    isLoading: isLoadingInfo || isLoadingUsage,
    isError: isErrorInfo || isErrorUsage,
    error: (errorInfo as Error) || (errorUsage as Error) || null,
    // Feature checks
    canUseSlotTemplates: canUseSlotTemplates(plan),
    canUseAdvancedSlotRules: canUseAdvancedSlotRules(plan),
    canAccessScanModule: canAccessScanModule(plan),
    canAccessWarehouses: canAccessWarehouses(plan),
    canAccessAnalytics: canAccessAnalytics(plan),
    // Limits
    maxTeamMembers: getMaxTeamMembers(plan),
    maxShipmentsPerMonth: getMaxShipmentsPerMonth(plan),
    marketingEmailLimit,
    promoCreditsIncluded,
    whatsappPromoLimit: getWhatsappPromoLimit(plan),
    whatsappStoryLimit: getWhatsappStoryLimit(plan),
    commissionRate: getCommissionRate(plan),
    // Usage helpers
    marketingEmailsRemaining,
    isMarketingEmailLimitReached,
    promoCreditsRemaining,
    isPromoCreditsLow,
  };
}


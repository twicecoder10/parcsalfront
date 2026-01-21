import { getErrorMessage } from './api';
import type { CarrierPlan } from './plan-entitlements';

export interface PlanErrorInfo {
  isPlanError: boolean;
  requiredPlan?: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  feature?: string;
  message: string;
  isLimitError?: boolean;
  limitType?: 'team' | 'email' | 'credits';
}

/**
 * Parses error messages to extract plan-related information
 */
export function parsePlanError(error: any): PlanErrorInfo {
  const message = getErrorMessage(error);
  const lowerMessage = message.toLowerCase();

  // Check if it's a 403 error
  const is403 = error?.response?.status === 403;

  if (!is403) {
    return {
      isPlanError: false,
      message,
    };
  }

  // Check for plan requirement errors
  if (lowerMessage.includes('requires starter') || lowerMessage.includes('starter plan')) {
    return {
      isPlanError: true,
      requiredPlan: 'STARTER',
      message,
    };
  }

  if (lowerMessage.includes('requires professional') || lowerMessage.includes('professional plan')) {
    return {
      isPlanError: true,
      requiredPlan: 'PROFESSIONAL',
      message,
    };
  }

  if (lowerMessage.includes('requires enterprise') || lowerMessage.includes('enterprise plan')) {
    return {
      isPlanError: true,
      requiredPlan: 'ENTERPRISE',
      message,
    };
  }

  // Check for limit errors
  if (lowerMessage.includes('team member limit') || lowerMessage.includes('team members')) {
    return {
      isPlanError: true,
      message,
      isLimitError: true,
      limitType: 'team',
    };
  }

  if (lowerMessage.includes('email limit') || lowerMessage.includes('emails')) {
    return {
      isPlanError: true,
      message,
      isLimitError: true,
      limitType: 'email',
    };
  }

  if (lowerMessage.includes('promo credits') || lowerMessage.includes('credits')) {
    return {
      isPlanError: true,
      message,
      isLimitError: true,
      limitType: 'credits',
    };
  }

  // Generic 403 error
  if (is403) {
    return {
      isPlanError: true,
      message,
    };
  }

  return {
    isPlanError: false,
    message,
  };
}

/**
 * Hook-friendly error handler that returns plan error info
 */
export function handlePlanError(error: any): PlanErrorInfo {
  return parsePlanError(error);
}


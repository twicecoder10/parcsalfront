'use client';

import { CheckCircle2, Circle, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OnboardingStatusResponse } from '@/lib/api';

interface OnboardingChecklistProps {
  status: OnboardingStatusResponse | null;
  type: 'customer' | 'company';
  className?: string;
}

interface StepDefinition {
  key: string;
  label: string;
  description?: string;
}

const CUSTOMER_STEPS: StepDefinition[] = [
  {
    key: 'email_verification',
    label: 'Email Verification',
    description: 'Verify your email address',
  },
  {
    key: 'profile_completion',
    label: 'Profile Completion',
    description: 'Complete your user profile',
  },
  {
    key: 'first_booking',
    label: 'First Booking',
    description: 'Create your first booking',
  },
];

const COMPANY_USER_STEPS: StepDefinition[] = [
  {
    key: 'email_verification',
    label: 'Email Verification',
    description: 'Verify your email address',
  },
  {
    key: 'profile_completion',
    label: 'Profile Completion',
    description: 'Complete your profile',
  },
];

const COMPANY_STEPS: StepDefinition[] = [
  {
    key: 'company_profile',
    label: 'Company Profile',
    description: 'Complete company information',
  },
  {
    key: 'first_shipment_slot',
    label: 'First Shipment',
    description: 'Create your first shipment slot',
  },
  {
    key: 'payment_setup',
    label: 'Payment Setup',
    description: 'Set up payment/subscription',
  },
];

export function OnboardingChecklist({ status, type, className }: OnboardingChecklistProps) {
  if (!status) {
    return (
      <div className={cn('space-y-3', className)}>
        <p className="text-sm text-gray-500">Loading onboarding status...</p>
      </div>
    );
  }

  const steps = type === 'customer' ? CUSTOMER_STEPS : COMPANY_STEPS;
  const userSteps = type === 'company' ? COMPANY_USER_STEPS : [];

  return (
    <div className={cn('space-y-4', className)}>
      {/* User-level steps for company admins */}
      {userSteps.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            User Steps
          </h3>
          {userSteps.map((step) => {
            const stepStatus = status.steps[step.key];
            const isCompleted = stepStatus?.completed === true;
            const isCurrent = !isCompleted && !status.completed;

            return (
              <div
                key={step.key}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg border transition-colors',
                  isCompleted && 'bg-green-50 border-green-200',
                  isCurrent && 'bg-orange-50 border-orange-200',
                  !isCompleted && !isCurrent && 'bg-gray-50 border-gray-200'
                )}
              >
                <div className="mt-0.5">
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : isCurrent ? (
                    <Circle className="h-5 w-5 text-orange-600 fill-orange-600" />
                  ) : (
                    <Lock className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      'text-sm font-medium',
                      isCompleted && 'text-green-900',
                      isCurrent && 'text-orange-900',
                      !isCompleted && !isCurrent && 'text-gray-600'
                    )}
                  >
                    {step.label}
                  </p>
                  {step.description && (
                    <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
                  )}
                  {isCompleted && stepStatus.completedAt && (
                    <p className="text-xs text-gray-400 mt-1">
                      Completed {new Date(stepStatus.completedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Main steps */}
      <div className="space-y-3">
        {userSteps.length > 0 && (
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            {type === 'company' ? 'Company Steps' : 'Steps'}
          </h3>
        )}
        {steps.map((step) => {
          const stepStatus = status.steps[step.key];
          const isCompleted = stepStatus?.completed === true;
          const isCurrent = !isCompleted && !status.completed;

          return (
            <div
              key={step.key}
              className={cn(
                'flex items-start gap-3 p-3 rounded-lg border transition-colors',
                isCompleted && 'bg-green-50 border-green-200',
                isCurrent && 'bg-orange-50 border-orange-200',
                !isCompleted && !isCurrent && 'bg-gray-50 border-gray-200'
              )}
            >
              <div className="mt-0.5">
                {isCompleted ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : isCurrent ? (
                  <Circle className="h-5 w-5 text-orange-600 fill-orange-600" />
                ) : (
                  <Lock className="h-5 w-5 text-gray-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    'text-sm font-medium',
                    isCompleted && 'text-green-900',
                    isCurrent && 'text-orange-900',
                    !isCompleted && !isCurrent && 'text-gray-600'
                  )}
                >
                  {step.label}
                </p>
                {step.description && (
                  <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
                )}
                {isCompleted && stepStatus.completedAt && (
                  <p className="text-xs text-gray-400 mt-1">
                    Completed {new Date(stepStatus.completedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress Summary */}
      <div className="pt-4 border-t">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Progress</span>
          <span className="text-sm font-semibold text-orange-600">{status.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-orange-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${status.progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}


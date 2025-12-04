'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  id: string;
  title: string;
  description?: string;
}

interface OnboardingStepperProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export function OnboardingStepper({ steps, currentStep, className }: OnboardingStepperProps) {
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isUpcoming = index > currentStep;

          return (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                {/* Step Circle */}
                <div
                  className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all',
                    isCompleted &&
                      'bg-orange-600 border-orange-600 text-white',
                    isCurrent &&
                      'bg-orange-100 border-orange-600 text-orange-600 ring-4 ring-orange-100',
                    isUpcoming &&
                      'bg-white border-gray-300 text-gray-400'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </div>
                {/* Step Label */}
                <div className="mt-2 text-center max-w-[120px]">
                  <p
                    className={cn(
                      'text-xs font-medium',
                      isCurrent && 'text-orange-600',
                      isCompleted && 'text-gray-900',
                      isUpcoming && 'text-gray-400'
                    )}
                  >
                    {step.title}
                  </p>
                  {step.description && (
                    <p className="text-xs text-gray-500 mt-1 hidden sm:block">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-2 transition-all',
                    isCompleted ? 'bg-orange-600' : 'bg-gray-300'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


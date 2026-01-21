'use client';

import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UsageMeterProps {
  current: number;
  limit: number;
  label: string;
  unit?: string;
  periodLabel?: string;
  className?: string;
  showWarning?: boolean;
  warningThreshold?: number; // Percentage (0-100) at which to show warning
}

export function UsageMeter({
  current,
  limit,
  label,
  unit = '',
  periodLabel,
  className,
  showWarning = true,
  warningThreshold = 80,
}: UsageMeterProps) {
  const percentage = limit > 0 ? Math.min(100, (current / limit) * 100) : 0;
  const remaining = Math.max(0, limit - current);
  const isLimitReached = limit > 0 && current >= limit;
  const isWarning = showWarning && percentage >= warningThreshold && !isLimitReached;

  const getProgressColor = () => {
    if (isLimitReached) return 'bg-red-500';
    if (isWarning) return 'bg-orange-500';
    return 'bg-green-500';
  };

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{label}</CardTitle>
          {isLimitReached && (
            <div className="flex items-center gap-1 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-xs font-medium">Limit Reached</span>
            </div>
          )}
          {isWarning && !isLimitReached && (
            <div className="flex items-center gap-1 text-orange-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-xs font-medium">Warning</span>
            </div>
          )}
        </div>
        {periodLabel && (
          <CardDescription className="text-xs">{periodLabel}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <div>
            <span className="font-semibold">
              {current.toLocaleString()}
              {unit && ` ${unit}`}
            </span>
            {limit > 0 && (
              <span className="text-gray-500">
                {' '}/ {limit === Infinity ? 'Unlimited' : `${limit.toLocaleString()}${unit ? ` ${unit}` : ''}`}
              </span>
            )}
          </div>
          {limit > 0 && limit !== Infinity && (
            <div className="text-gray-500">
              {remaining.toLocaleString()} remaining
            </div>
          )}
        </div>
        {limit > 0 && limit !== Infinity && (
          <Progress
            value={percentage}
            className="h-2"
            indicatorClassName={getProgressColor()}
          />
        )}
        {limit === 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <AlertCircle className="h-4 w-4" />
            <span>Not available on your current plan</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


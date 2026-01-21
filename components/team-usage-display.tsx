'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { UpgradeModal } from '@/components/upgrade-modal';
import { useState } from 'react';

interface TeamUsageDisplayProps {
  currentCount: number;
  limit: number;
  plan?: string | null;
  className?: string;
}

export function TeamUsageDisplay({
  currentCount,
  limit,
  plan,
  className,
}: TeamUsageDisplayProps) {
  const router = useRouter();
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const isLimitReached = limit !== Infinity && currentCount >= limit;
  const percentage = limit !== Infinity ? Math.min(100, (currentCount / limit) * 100) : 0;

  const handleUpgrade = () => {
    router.push('/company/subscription');
  };

  return (
    <>
      <Card className={className}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-gray-500" />
              <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            </div>
            {isLimitReached && (
              <Badge variant="destructive" className="text-xs">
                Limit Reached
              </Badge>
            )}
          </div>
          <CardDescription className="text-xs">
            {limit === Infinity ? 'Unlimited team members' : `Up to ${limit} team members on ${plan || 'your'} plan`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold">
              {currentCount}
              {limit !== Infinity && (
                <span className="text-lg font-normal text-gray-500">
                  {' '}/ {limit}
                </span>
              )}
            </div>
            {isLimitReached && (
              <Button
                size="sm"
                onClick={() => setUpgradeModalOpen(true)}
                className="text-xs"
              >
                Upgrade Plan
              </Button>
            )}
          </div>
          {isLimitReached && (
            <div className="flex items-start gap-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
              <AlertCircle className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-orange-900">
                  Team member limit reached
                </p>
                <p className="text-xs text-orange-700 mt-1">
                  Upgrade your plan to add more team members.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <UpgradeModal
        open={upgradeModalOpen}
        onOpenChange={setUpgradeModalOpen}
        currentPlan={plan as any}
        message={`Team member limit reached. Maximum ${limit} team members allowed on ${plan || 'your current'} plan. Upgrade to add more team members.`}
      />
    </>
  );
}


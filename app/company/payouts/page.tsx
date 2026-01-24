'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle, CheckCircle2, Wallet, Banknote, RefreshCw, ExternalLink } from 'lucide-react';
import { companyApi } from '@/lib/company-api';
import { getErrorMessage } from '@/lib/api';
import { toast } from '@/lib/toast';

export default function PayoutsPage() {
  const [status, setStatus] = useState<{
    stripeAccountId: string | null;
    stripeOnboardingStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETE';
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
  } | null>(null);
  const [balance, setBalance] = useState<{
    available: number;
    pending: number;
    currency: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [onboardingUrl, setOnboardingUrl] = useState<string | null>(null);
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [processingPayout, setProcessingPayout] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const data = await companyApi.getConnectStatus();
      setStatus(data);
    } catch (error) {
      console.error('Failed to fetch connect status:', error);
      toast.error(getErrorMessage(error) || 'Failed to load payout status');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBalance = useCallback(async () => {
    setBalanceLoading(true);
    try {
      const data = await companyApi.getConnectBalance();
      setBalance(data);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      // Don't show error if account not set up yet
      if (status?.stripeAccountId) {
        toast.error(getErrorMessage(error) || 'Failed to load balance');
      }
    } finally {
      setBalanceLoading(false);
    }
  }, [status?.stripeAccountId]);

  useEffect(() => {
    fetchStatus();
    fetchBalance();
  }, [fetchStatus, fetchBalance]);

  const handleEnablePayouts = async () => {
    try {
      const returnUrl = window.location.href;
      const { url } = await companyApi.createOnboardingLink(returnUrl);
      setOnboardingUrl(url);
      window.location.href = url;
    } catch (error) {
      console.error('Failed to create onboarding link:', error);
      toast.error(getErrorMessage(error) || 'Failed to start payout setup');
    }
  };

  const handleRequestPayout = async () => {
    if (!payoutAmount || Number(payoutAmount) <= 0) {
      toast.error('Please enter a valid payout amount');
      return;
    }

    const amountInPounds = Number(payoutAmount);
    const minimumPayout = 10;

    if (amountInPounds < minimumPayout) {
      const currencySymbol = balance?.currency?.toUpperCase() === 'EUR' ? '€' : balance?.currency?.toUpperCase() === 'USD' ? '$' : '£';
      toast.error(`Minimum payout amount is ${currencySymbol}${minimumPayout}`);
      return;
    }

    if (balance && amountInPounds > balance.available / 100) {
      toast.error('Requested amount exceeds available balance');
      return;
    }

    setProcessingPayout(true);
    try {
      await companyApi.requestPayout(amountInPounds);
      setPayoutDialogOpen(false);
      setPayoutAmount('');
      toast.success('Payout request submitted successfully');
      fetchBalance();
      fetchStatus();
    } catch (error) {
      console.error('Failed to request payout:', error);
      toast.error(getErrorMessage(error) || 'Failed to request payout');
    } finally {
      setProcessingPayout(false);
    }
  };

  const handleOpenDashboard = async () => {
    setDashboardLoading(true);
    try {
      const { url } = await companyApi.createDashboardLoginLink();
      window.open(url, '_blank');
      setDashboardLoading(false);
    } catch (error) {
      console.error('Failed to open Stripe Connect dashboard:', error);
      toast.error(getErrorMessage(error) || 'Failed to open Stripe dashboard');
      setDashboardLoading(false);
    }
  };

  const formatAmount = (pence: number, currency: string = 'gbp'): string => {
    const amount = (pence / 100).toFixed(2);
    const currencyUpper = currency.toUpperCase();
    
    // Currency symbol mapping
    const currencySymbols: Record<string, string> = {
      'GBP': '£',
      'EUR': '€',
      'USD': '$',
      'NGN': '₦',
    };
    
    const symbol = currencySymbols[currencyUpper] || currencyUpper;
    
    // For EUR and some currencies, symbol comes after
    if (currencyUpper === 'EUR') {
      return `${amount} ${symbol}`;
    }
    
    return `${symbol}${amount}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    );
  }

  const isOnboardingComplete = status?.stripeOnboardingStatus === 'COMPLETE' && status?.payoutsEnabled;
  const needsOnboarding = !status?.stripeAccountId || status?.stripeOnboardingStatus === 'NOT_STARTED';
  const onboardingInProgress = status?.stripeOnboardingStatus === 'IN_PROGRESS';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payouts</h1>
        <p className="text-gray-600 mt-2">Manage your earnings and request payouts</p>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle>Payout Status</CardTitle>
          <CardDescription>Your payout account setup status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Account Status</span>
              <Badge
                className={
                  isOnboardingComplete
                    ? 'bg-green-100 text-green-800'
                    : onboardingInProgress
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }
              >
                {status?.stripeOnboardingStatus === 'COMPLETE'
                  ? 'Complete'
                  : status?.stripeOnboardingStatus === 'IN_PROGRESS'
                  ? 'In Progress'
                  : 'Not Started'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Charges Enabled</span>
              {status?.chargesEnabled ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-gray-400" />
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Payouts Enabled</span>
              {status?.payoutsEnabled ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-gray-400" />
              )}
            </div>
            {needsOnboarding && (
              <Button onClick={handleEnablePayouts} className="w-full">
                <Banknote className="h-4 w-4 mr-2" />
                Enable Payouts
              </Button>
            )}
            {onboardingInProgress && (
              <Button onClick={handleEnablePayouts} variant="outline" className="w-full">
                <Banknote className="h-4 w-4 mr-2" />
                Add Bank Details
              </Button>
            )}
            {status?.stripeAccountId && (
              <Button
                onClick={handleOpenDashboard}
                variant="outline"
                className="w-full"
                disabled={dashboardLoading}
              >
                {dashboardLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Opening Stripe Connect Dashboard...
                  </>
                ) : (
                  <>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Stripe Connect Dashboard
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Balance Card */}
      {status?.stripeAccountId && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Available Balance</CardTitle>
                <CardDescription>Your earnings ready for payout</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchBalance}
                disabled={balanceLoading}
              >
                <RefreshCw className={`h-4 w-4 ${balanceLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {balanceLoading && !balance ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
              </div>
            ) : balance ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-green-600" />
                    <div>
                      <span className="text-sm font-medium block">Available</span>
                      <span className="text-xs text-gray-500">Ready for payout</span>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-green-600">
                    {formatAmount(balance.available, balance.currency)}
                  </span>
                </div>
                {balance.pending > 0 && (
                  <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-5 w-5 text-yellow-600" />
                      <div>
                        <span className="text-sm font-medium block">Pending</span>
                        <span className="text-xs text-gray-500">Settling (2-7 days)</span>
                      </div>
                    </div>
                    <span className="text-lg font-semibold text-yellow-600">
                      {formatAmount(balance.pending, balance.currency)}
                    </span>
                  </div>
                )}
                {balance.available + balance.pending > 0 && (
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <span className="text-sm font-medium text-blue-900">Total Balance</span>
                    <span className="text-lg font-bold text-blue-600">
                      {formatAmount(balance.available + balance.pending, balance.currency)}
                    </span>
                  </div>
                )}
                {isOnboardingComplete && (
                  <Button
                    onClick={() => setPayoutDialogOpen(true)}
                    className="w-full"
                    disabled={balance.available < 1000} // Minimum £10 in pence
                  >
                    <Banknote className="h-4 w-4 mr-2" />
                    Request Payout
                  </Button>
                )}
                {balance.available < 1000 && balance.pending > 0 && (
                  <p className="text-xs text-gray-500 text-center">
                    Minimum payout amount is {formatAmount(1000, balance.currency)}. You have {formatAmount(balance.pending, balance.currency)} pending settlement.
                  </p>
                )}
                {balance.available < 1000 && balance.pending === 0 && (
                  <p className="text-xs text-gray-500 text-center">
                    Minimum payout amount is {formatAmount(1000, balance.currency)}
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                Unable to load balance
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Request Payout Dialog */}
      <Dialog open={payoutDialogOpen} onOpenChange={setPayoutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Payout</DialogTitle>
            <DialogDescription>
              Enter the amount you want to withdraw. Minimum payout is {balance ? formatAmount(1000, balance.currency) : '£10.00'}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="payoutAmount">
                Amount {balance?.currency?.toUpperCase() === 'EUR' ? '(€)' : balance?.currency?.toUpperCase() === 'USD' ? '($)' : '(£)'}
              </Label>
              <Input
                id="payoutAmount"
                type="number"
                step="0.01"
                min="10"
                placeholder="10.00"
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
              />
              {balance && (
                <p className="text-xs text-gray-500">
                  Available: {formatAmount(balance.available, balance.currency)}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPayoutDialogOpen(false);
                setPayoutAmount('');
              }}
              disabled={processingPayout}
            >
              Cancel
            </Button>
            <Button onClick={handleRequestPayout} disabled={processingPayout}>
              {processingPayout ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Request Payout'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


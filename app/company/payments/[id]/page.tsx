'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Eye, Loader2, RefreshCw, AlertCircle, CreditCard, Calendar, User, Package, Info } from 'lucide-react';
import { companyApi, getCustomerName, getCustomerEmail } from '@/lib/company-api';
import type { Payment } from '@/lib/company-api';
import { getErrorMessage } from '@/lib/api';
import { usePermissions, canPerformAction } from '@/lib/permissions';
import { toast } from '@/lib/toast';
import { useCompanyPlan } from '@/lib/hooks/use-company-plan';

const statusColors: Record<string, string> = {
  SUCCEEDED: 'bg-green-100 text-green-800',
  PAID: 'bg-green-100 text-green-800', // Keep for backward compatibility
  PENDING: 'bg-yellow-100 text-yellow-800',
  FAILED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-gray-100 text-gray-800',
  PARTIALLY_REFUNDED: 'bg-orange-100 text-orange-800',
};

export default function PaymentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const permissions = usePermissions();
  const { plan } = useCompanyPlan();
  const paymentId = params.id as string;
  
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [processingRefund, setProcessingRefund] = useState(false);
  
  // Calculate company payout (baseAmount - commissionAmount)
  const companyPayout = payment && payment.baseAmount != null && payment.commissionAmount != null
    ? Number(payment.baseAmount) - Number(payment.commissionAmount)
    : null;
  
  // Check if company has paid subscription (not FREE plan)
  const hasPaidSubscription = plan && plan !== 'FREE';

  const fetchPayment = useCallback(async () => {
    setLoading(true);
    try {
      const paymentData = await companyApi.getPaymentById(paymentId);
      setPayment(paymentData);
    } catch (error: any) {
      console.error('Failed to fetch payment:', error);
      toast.error(getErrorMessage(error) || 'Failed to load payment details');
    } finally {
      setLoading(false);
    }
  }, [paymentId]);

  useEffect(() => {
    fetchPayment();
  }, [fetchPayment]);

  const handleRefund = async () => {
    if (!payment) return;
    setProcessingRefund(true);
    try {
      await companyApi.refundPayment(payment.id, {
        amount: refundAmount ? Number(refundAmount) : undefined,
        reason: refundReason || undefined,
      });
      setRefundDialogOpen(false);
      setRefundAmount('');
      setRefundReason('');
      fetchPayment();
      toast.success('Refund processed successfully');
    } catch (error: any) {
      console.error('Failed to process refund:', error);
      toast.error(getErrorMessage(error) || 'Failed to process refund. Please try again.');
    } finally {
      setProcessingRefund(false);
    }
  };

  const openRefundDialog = () => {
    if (!canPerformAction(permissions, 'processRefund')) {
      toast.error('You do not have permission to process refunds.');
      return;
    }
    if (payment && payment.status !== 'SUCCEEDED' && payment.status !== 'PARTIALLY_REFUNDED') {
      toast.error('Only succeeded or partially refunded payments can be refunded.');
      return;
    }
    setRefundAmount('');
    setRefundReason('');
    setRefundDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="text-center py-8">
            <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Payment Not Found</h2>
            <p className="text-gray-600 mb-4">The payment you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
            <Button onClick={() => router.push('/company/payments')} className="w-full sm:w-auto">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Payments
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/company/payments')} className="w-fit">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">Payment Details</h1>
            <p className="text-gray-600 mt-2 text-sm sm:text-base">View and manage payment transaction</p>
          </div>
        </div>
        {(payment.status === 'SUCCEEDED' || payment.status === 'PARTIALLY_REFUNDED') && 
         canPerformAction(permissions, 'processRefund') && (
          <Button onClick={openRefundDialog} variant="outline" className="w-full sm:w-auto">
            <RefreshCw className="h-4 w-4 mr-2" />
            Process Refund
          </Button>
        )}
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Payment Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm text-gray-500">Payment ID</Label>
              <p className="font-mono text-sm mt-1">{payment.id}</p>
            </div>
            {payment.type && (
              <div>
                <Label className="text-sm text-gray-500">Type</Label>
                <div className="mt-1">
                  <Badge className="bg-gray-50 text-gray-700 border-gray-200">
                    {payment.type === 'EXTRA_CHARGE' ? 'Extra Charge' : 'Booking Payment'}
                  </Badge>
                </div>
              </div>
            )}
            <div>
              <Label className="text-sm text-gray-500">Amount</Label>
              <p className="text-2xl font-bold mt-1">£{payment.amount.toFixed(2)}</p>
              {payment.refundedAmount != null && Number(payment.refundedAmount) > 0 && (
                <p className="text-sm text-red-600 mt-1">
                  Refunded: £{Number(payment.refundedAmount).toFixed(2)}
                </p>
              )}
            </div>
            
            {/* Fee Breakdown */}
            {(payment.baseAmount != null || payment.adminFeeAmount != null || payment.processingFeeAmount != null || payment.commissionAmount != null || payment.totalAmount != null) && (
              <div className="pt-2 border-t">
                <Label className="text-sm text-gray-500 mb-2 block">Fee Breakdown</Label>
                <div className="space-y-1 text-sm">
                  {payment.baseAmount != null && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Base Amount</span>
                      <span className="font-medium">£{Number(payment.baseAmount).toFixed(2)}</span>
                    </div>
                  )}
                  {payment.adminFeeAmount != null && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Admin Fee</span>
                      <span className="font-medium">£{Number(payment.adminFeeAmount).toFixed(2)}</span>
                    </div>
                  )}
                  {payment.processingFeeAmount != null && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Processing Fee</span>
                      <span className="font-medium">£{Number(payment.processingFeeAmount).toFixed(2)}</span>
                    </div>
                  )}
                  {payment.commissionAmount != null && payment.commissionAmount !== 0 && (
                    <div className="flex justify-between pt-1 border-t">
                      <span className="text-gray-600">Commission</span>
                      <span className="font-medium text-red-600">-£{Number(payment.commissionAmount).toFixed(2)}</span>
                    </div>
                  )}
                  {companyPayout != null && payment.commissionAmount != null && payment.commissionAmount !== 0 && (
                    <div className="flex justify-between pt-1 border-t">
                      <span className="text-gray-600">Your Payout</span>
                      <span className="font-semibold text-green-600">£{companyPayout.toFixed(2)}</span>
                    </div>
                  )}
                  {payment.totalAmount != null && (
                    <div className="flex justify-between pt-1 border-t font-semibold">
                      <span className="text-gray-900">Total Amount (Customer Paid)</span>
                      <span className="text-orange-600">£{Number(payment.totalAmount).toFixed(2)}</span>
                    </div>
                  )}
                </div>
                {payment.commissionAmount != null && payment.commissionAmount !== 0 && !hasPaidSubscription && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 text-sm">
                        <p className="text-blue-900 font-medium mb-1">Upgrade to eliminate commission fees</p>
                        <p className="text-blue-700">
                          With a paid subscription, you&apos;ll receive 0% commission on your income. 
                          <Link href="/company/subscription" className="underline font-medium ml-1">
                            Upgrade now
                          </Link>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div>
              <Label className="text-sm text-gray-500">Status</Label>
              <div className="mt-1">
                <Badge className={statusColors[payment.status] || ''}>
                  {payment.status.replace('_', ' ')}
                </Badge>
              </div>
            </div>
            <div>
              <Label className="text-sm text-gray-500">Currency</Label>
              <p className="mt-1">{payment.currency.toUpperCase()}</p>
            </div>
            {payment.paymentMethod && (
              <div>
                <Label className="text-sm text-gray-500">Payment Method</Label>
                <p className="mt-1 capitalize">{payment.paymentMethod.toLowerCase()}</p>
              </div>
            )}
            {payment.stripePaymentIntentId && (
              <div>
                <Label className="text-sm text-gray-500">Stripe Payment Intent</Label>
                <p className="font-mono text-xs mt-1 break-all">{payment.stripePaymentIntentId}</p>
              </div>
            )}
            {payment.stripeChargeId && (
              <div>
                <Label className="text-sm text-gray-500">Stripe Charge ID</Label>
                <p className="font-mono text-xs mt-1 break-all">{payment.stripeChargeId}</p>
              </div>
            )}
            {(payment.status === 'SUCCEEDED' || payment.status === 'PARTIALLY_REFUNDED') && 
             canPerformAction(permissions, 'processRefund') && (
              <div className="pt-4 border-t">
                <Button onClick={openRefundDialog} className="w-full sm:w-auto" variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Process Refund
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dates & Booking Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Dates & Booking
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm text-gray-500">Created At</Label>
              <p className="mt-1">
                {new Date(payment.createdAt).toLocaleDateString()} {new Date(payment.createdAt).toLocaleTimeString()}
              </p>
            </div>
            {payment.updatedAt && (
              <div>
                <Label className="text-sm text-gray-500">Last Updated</Label>
                <p className="mt-1">
                  {new Date(payment.updatedAt).toLocaleDateString()} {new Date(payment.updatedAt).toLocaleTimeString()}
                </p>
              </div>
            )}
            {payment.paidAt && (
              <div>
                <Label className="text-sm text-gray-500">Paid At</Label>
                <p className="mt-1">
                  {new Date(payment.paidAt).toLocaleDateString()} {new Date(payment.paidAt).toLocaleTimeString()}
                </p>
              </div>
            )}
            {payment.refundedAt && (
              <div>
                <Label className="text-sm text-gray-500">Refunded At</Label>
                <p className="mt-1">
                  {new Date(payment.refundedAt).toLocaleDateString()} {new Date(payment.refundedAt).toLocaleTimeString()}
                </p>
              </div>
            )}
            {payment.booking && (
              <div>
                <Label className="text-sm text-gray-500">Booking</Label>
                <div className="mt-1">
                  <Link 
                    href={`/company/bookings/${payment.bookingId}`}
                    className="text-orange-600 hover:underline flex items-center gap-1"
                  >
                    <Package className="h-4 w-4" />
                    Booking #{payment.bookingId}
                  </Link>
                </div>
              </div>
            )}
            {payment.booking?.customer && (
              <div>
                <Label className="text-sm text-gray-500">Customer</Label>
                <div className="mt-1">
                  <p className="font-medium">{getCustomerName(payment.booking.customer)}</p>
                  {getCustomerEmail(payment.booking.customer) && (
                    <p className="text-sm text-gray-500">{getCustomerEmail(payment.booking.customer)}</p>
                  )}
                </div>
              </div>
            )}
            {payment.booking?.shipmentSlot && (
              <div>
                <Label className="text-sm text-gray-500">Route</Label>
                <p className="mt-1">
                  {payment.booking.shipmentSlot.originCity}, {payment.booking.shipmentSlot.originCountry} → {payment.booking.shipmentSlot.destinationCity}, {payment.booking.shipmentSlot.destinationCountry}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Extra Charge Information */}
      {payment.type === 'EXTRA_CHARGE' && (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Extra Charge Details</CardTitle>
              {payment.bookingId && (
                <Link href={`/company/bookings/${payment.bookingId}`} className="w-full sm:w-auto">
                  <Button variant="outline" size="sm" className="w-full sm:w-auto">
                    <Package className="h-4 w-4 mr-2" />
                    View Booking
                  </Button>
                </Link>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {payment.extraChargeReason && (
                <div>
                  <Label className="text-sm text-gray-500">Reason</Label>
                  <p className="mt-1 font-medium text-lg">
                    {payment.extraChargeReason === 'EXCESS_WEIGHT' ? 'Excess Weight' :
                     payment.extraChargeReason === 'EXTRA_ITEMS' ? 'Extra Items' :
                     payment.extraChargeReason === 'OVERSIZE' ? 'Oversize' :
                     payment.extraChargeReason === 'REPACKING' ? 'Repacking' :
                     payment.extraChargeReason === 'LATE_DROP_OFF' ? 'Late Drop-off' :
                     payment.extraChargeReason === 'OTHER' ? 'Other' :
                     payment.extraChargeReason.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </p>
                </div>
              )}
              {payment.extraChargeDescription && (
                <div>
                  <Label className="text-sm text-gray-500">Description</Label>
                  <p className="mt-1">{payment.extraChargeDescription}</p>
                </div>
              )}
              {!payment.extraChargeDescription && (
                <div>
                  <Label className="text-sm text-gray-500">Description</Label>
                  <p className="mt-1 text-gray-400 italic">No description provided</p>
                </div>
              )}
              {payment.booking && (
                <div className="pt-4 border-t">
                  <Label className="text-sm text-gray-500 mb-2 block">Related Booking</Label>
                  <div className="space-y-2">
                    <div>
                      <Link 
                        href={`/company/bookings/${payment.bookingId}`}
                        className="text-orange-600 hover:underline flex items-center gap-1"
                      >
                        <Package className="h-4 w-4" />
                        Booking #{payment.bookingId}
                      </Link>
                    </div>
                    {payment.booking.customer && (
                      <div>
                        <span className="text-sm text-gray-600">Customer: </span>
                        <span className="text-sm font-medium">{getCustomerName(payment.booking.customer)}</span>
                      </div>
                    )}
                    {payment.booking.shipmentSlot && (
                      <div>
                        <span className="text-sm text-gray-600">Route: </span>
                        <span className="text-sm">
                          {payment.booking.shipmentSlot.originCity}, {payment.booking.shipmentSlot.originCountry} → {payment.booking.shipmentSlot.destinationCity}, {payment.booking.shipmentSlot.destinationCountry}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Refund Information */}
      {payment.refundedAmount != null && Number(payment.refundedAmount) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Refund Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <Label className="text-sm text-gray-500">Refunded Amount</Label>
                <p className="text-lg font-semibold text-red-600 mt-1">£{Number(payment.refundedAmount).toFixed(2)}</p>
              </div>
              {payment.refundReason && (
                <div>
                  <Label className="text-sm text-gray-500">Refund Reason</Label>
                  <p className="mt-1">{payment.refundReason}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Refund Dialog */}
      <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
        <DialogContent className="w-[calc(100%-1.5rem)] max-w-lg">
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
            <DialogDescription>
              {payment && (
                <>
                  Refund payment for booking #{payment.bookingId}.
                  {payment.status === 'PARTIALLY_REFUNDED' && (
                    <span className="block mt-2 text-sm text-gray-600">
                      Already refunded: £{payment.refundedAmount?.toFixed(2) || '0.00'}. 
                      Remaining: £{((payment.amount || 0) - (payment.refundedAmount || 0)).toFixed(2)}
                    </span>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="refundAmount">
                Refund Amount (Optional - leave empty for full refund)
              </Label>
              <Input
                id="refundAmount"
                type="number"
                step="0.01"
                placeholder={payment ? `Max: £${payment.amount.toFixed(2)}` : ''}
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
              />
              {payment && (
                <p className="text-xs text-gray-500">
                  Full refund amount: £{payment.amount.toFixed(2)}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="refundReason">Reason (Optional)</Label>
              <Textarea
                id="refundReason"
                placeholder="Enter reason for refund..."
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setRefundDialogOpen(false)} disabled={processingRefund} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={handleRefund} disabled={processingRefund} className="w-full sm:w-auto">
              {processingRefund ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Process Refund'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


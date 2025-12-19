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
import { ArrowLeft, Eye, Loader2, RefreshCw, AlertCircle, CreditCard, Calendar, User, Package } from 'lucide-react';
import { companyApi } from '@/lib/company-api';
import type { Payment } from '@/lib/company-api';
import { getErrorMessage } from '@/lib/api';
import { usePermissions, canPerformAction } from '@/lib/permissions';
import { toast } from '@/lib/toast';

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
  const paymentId = params.id as string;
  
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [processingRefund, setProcessingRefund] = useState(false);

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
    if (payment && payment.status !== 'SUCCEEDED' && payment.status !== 'PAID' && payment.status !== 'PARTIALLY_REFUNDED') {
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
            <Button onClick={() => router.push('/company/payments')}>
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/company/payments')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Payment Details</h1>
            <p className="text-gray-600 mt-2">View and manage payment transaction</p>
          </div>
        </div>
        {(payment.status === 'SUCCEEDED' || payment.status === 'PAID' || payment.status === 'PARTIALLY_REFUNDED') && 
         canPerformAction(permissions, 'processRefund') && (
          <Button onClick={openRefundDialog} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Process Refund
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
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
            <div>
              <Label className="text-sm text-gray-500">Amount</Label>
              <p className="text-2xl font-bold mt-1">£{payment.amount.toFixed(2)}</p>
              {payment.refundedAmount && payment.refundedAmount > 0 && (
                <p className="text-sm text-red-600 mt-1">
                  Refunded: £{payment.refundedAmount.toFixed(2)}
                </p>
              )}
            </div>
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
                <p className="font-mono text-xs mt-1">{payment.stripePaymentIntentId}</p>
              </div>
            )}
            {payment.stripeChargeId && (
              <div>
                <Label className="text-sm text-gray-500">Stripe Charge ID</Label>
                <p className="font-mono text-xs mt-1">{payment.stripeChargeId}</p>
              </div>
            )}
            {(payment.status === 'SUCCEEDED' || payment.status === 'PAID' || payment.status === 'PARTIALLY_REFUNDED') && 
             canPerformAction(permissions, 'processRefund') && (
              <div className="pt-4 border-t">
                <Button onClick={openRefundDialog} className="w-full" variant="outline">
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
                  <p className="font-medium">{payment.booking.customer.fullName}</p>
                  <p className="text-sm text-gray-500">{payment.booking.customer.email}</p>
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

      {/* Refund Information */}
      {payment.refundedAmount && payment.refundedAmount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Refund Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <Label className="text-sm text-gray-500">Refunded Amount</Label>
                <p className="text-lg font-semibold text-red-600 mt-1">£{payment.refundedAmount.toFixed(2)}</p>
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
        <DialogContent>
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundDialogOpen(false)} disabled={processingRefund}>
              Cancel
            </Button>
            <Button onClick={handleRefund} disabled={processingRefund}>
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


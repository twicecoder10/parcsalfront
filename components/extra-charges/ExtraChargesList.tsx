'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Clock, CheckCircle2, XCircle, PoundSterling, ExternalLink, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import type { ExtraCharge, ExtraChargeStatus } from '@/lib/api-types';
import { customerApi } from '@/lib/customer-api';
import { getErrorMessage } from '@/lib/api';
import { toast } from '@/lib/toast';

interface ExtraChargesListProps {
  bookingId: string;
  onRefresh?: () => void;
}

const statusColors: Record<ExtraChargeStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-green-100 text-green-800',
  DECLINED: 'bg-red-100 text-red-800',
  EXPIRED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
};

const reasonLabels: Record<string, string> = {
  EXCESS_WEIGHT: 'Excess Weight',
  EXTRA_ITEMS: 'Extra Items',
  OVERSIZE: 'Oversize',
  REPACKING: 'Repacking',
  LATE_DROP_OFF: 'Late Drop-off',
  OTHER: 'Other',
};

export function ExtraChargesList({ bookingId, onRefresh }: ExtraChargesListProps) {
  const [extraCharges, setExtraCharges] = useState<ExtraCharge[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchExtraCharges = async () => {
    setLoading(true);
    try {
      const charges = await customerApi.getExtraCharges(bookingId);
      setExtraCharges(charges);
    } catch (error) {
      console.error('Failed to fetch extra charges:', error);
      toast.error(getErrorMessage(error) || 'Failed to load extra charges');
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    fetchExtraCharges();
  }, [fetchExtraCharges]);

  const handlePay = async (charge: ExtraCharge) => {
    setProcessing(charge.id);
    try {
      const result = await customerApi.payExtraCharge(bookingId, charge.id);
      // Redirect to Stripe Checkout
      if (result.url) {
        window.location.href = result.url;
      }
    } catch (error: any) {
      console.error('Failed to initiate payment:', error);
      toast.error(getErrorMessage(error) || 'Failed to initiate payment');
      setProcessing(null);
    }
  };

  const handleDecline = async (charge: ExtraCharge) => {
    if (!confirm('Are you sure you want to decline this extra charge?')) {
      return;
    }

    setProcessing(charge.id);
    try {
      await customerApi.declineExtraCharge(bookingId, charge.id);
      toast.success('Extra charge declined');
      await fetchExtraCharges();
      onRefresh?.();
    } catch (error: any) {
      console.error('Failed to decline extra charge:', error);
      toast.error(getErrorMessage(error) || 'Failed to decline extra charge');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Additional Charges</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (extraCharges.length === 0) {
    return null;
  }

  const pendingCharges = extraCharges.filter((c) => c.status === 'PENDING');
  const otherCharges = extraCharges.filter((c) => c.status !== 'PENDING');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Additional Charges</CardTitle>
        <CardDescription>
          {pendingCharges.length > 0
            ? `${pendingCharges.length} pending charge${pendingCharges.length > 1 ? 's' : ''} require${pendingCharges.length > 1 ? '' : 's'} your attention`
            : 'View all additional charges for this booking'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pending Charges */}
        {pendingCharges.map((charge) => {
          const isExpired = new Date(charge.expiresAt) < new Date();
          const canPay = charge.status === 'PENDING' && !isExpired;
          const isProcessing = processing === charge.id;

          return (
            <div
              key={charge.id}
              className={`p-4 border rounded-lg ${
                isExpired ? 'border-gray-300 bg-gray-50' : 'border-orange-200 bg-orange-50'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={statusColors[charge.status]}>
                      {charge.status}
                    </Badge>
                    {isExpired && (
                      <Badge variant="outline" className="text-gray-600">
                        Expired
                      </Badge>
                    )}
                  </div>
                  <h4 className="font-semibold text-lg">{reasonLabels[charge.reason] || charge.reason}</h4>
                  {charge.description && (
                    <p className="text-sm text-gray-600 mt-1">{charge.description}</p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-orange-600">
                    £{(charge.totalAmount / 100).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Breakdown */}
              <div className="bg-white rounded p-3 mb-3 text-sm">
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Base Amount:</span>
                  <span className="font-medium">£{(charge.baseAmount / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Admin Fee:</span>
                  <span className="font-medium">£{(charge.adminFeeAmount / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Processing Fee:</span>
                  <span className="font-medium">£{(charge.processingFeeAmount / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t font-semibold">
                  <span>Total:</span>
                  <span>£{(charge.totalAmount / 100).toFixed(2)}</span>
                </div>
              </div>

              {/* Evidence URLs */}
              {charge.evidenceUrls && charge.evidenceUrls.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700 mb-1">Evidence:</p>
                  <div className="flex flex-wrap gap-2">
                    {charge.evidenceUrls.map((url, index) => (
                      <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-orange-600 hover:text-orange-700 flex items-center gap-1"
                      >
                        View Evidence {index + 1}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Expiration */}
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                <Clock className="h-4 w-4" />
                <span>
                  {isExpired ? (
                    <span className="text-red-600">Expired on {format(new Date(charge.expiresAt), 'MMM dd, yyyy HH:mm')}</span>
                  ) : (
                    <span>Expires on {format(new Date(charge.expiresAt), 'MMM dd, yyyy HH:mm')}</span>
                  )}
                </span>
              </div>

              {/* Actions */}
              {canPay && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => handlePay(charge)}
                    disabled={isProcessing}
                    className="flex-1"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <PoundSterling className="h-4 w-4 mr-2" />
                        Pay Now
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDecline(charge)}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 mr-2" />
                        Decline
                      </>
                    )}
                  </Button>
                </div>
              )}

              {isExpired && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>This charge has expired and can no longer be paid.</span>
                </div>
              )}
            </div>
          );
        })}

        {/* Other Charges (Paid, Declined, etc.) */}
        {otherCharges.length > 0 && (
          <div className="space-y-3 pt-4 border-t">
            <h4 className="font-medium text-gray-700">Previous Charges</h4>
            {otherCharges.map((charge) => (
              <div
                key={charge.id}
                className="p-3 border rounded-lg bg-gray-50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={statusColors[charge.status]}>
                        {charge.status}
                      </Badge>
                      <span className="font-medium">{reasonLabels[charge.reason] || charge.reason}</span>
                    </div>
                    {charge.description && (
                      <p className="text-sm text-gray-600">{charge.description}</p>
                    )}
                    {charge.paidAt && (
                      <p className="text-xs text-gray-500 mt-1">
                        Paid on {format(new Date(charge.paidAt), 'MMM dd, yyyy HH:mm')}
                      </p>
                    )}
                    {charge.declinedAt && (
                      <p className="text-xs text-gray-500 mt-1">
                        Declined on {format(new Date(charge.declinedAt), 'MMM dd, yyyy HH:mm')}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold">
                      £{(charge.totalAmount / 100).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


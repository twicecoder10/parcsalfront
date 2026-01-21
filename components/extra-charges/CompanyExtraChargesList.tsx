'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle2, XCircle, Loader2, Trash2, Eye, User, Info } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import type { ExtraCharge, ExtraChargeStatus } from '@/lib/api-types';
import { companyApi } from '@/lib/company-api';
import { getErrorMessage } from '@/lib/api';
import { toast } from '@/lib/toast';
import { CreateExtraChargeForm } from './CreateExtraChargeForm';

interface CompanyExtraChargesListProps {
  bookingId: string;
  onRefresh?: () => void;
  canCreate?: boolean;
  canCancel?: boolean;
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

export function CompanyExtraChargesList({
  bookingId,
  onRefresh,
  canCreate = false,
  canCancel = false,
}: CompanyExtraChargesListProps) {
  const [extraCharges, setExtraCharges] = useState<ExtraCharge[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const fetchExtraCharges = useCallback(async () => {
    setLoading(true);
    try {
      const charges = await companyApi.getExtraCharges(bookingId);
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

  const handleCancel = async (charge: ExtraCharge) => {
    if (!confirm('Are you sure you want to cancel this extra charge request?')) {
      return;
    }

    setCancelling(charge.id);
    try {
      await companyApi.cancelExtraCharge(bookingId, charge.id);
      toast.success('Extra charge cancelled successfully');
      await fetchExtraCharges();
      onRefresh?.();
    } catch (error: any) {
      console.error('Failed to cancel extra charge:', error);
      toast.error(getErrorMessage(error) || 'Failed to cancel extra charge');
    } finally {
      setCancelling(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Additional Charges</CardTitle>
              <CardDescription>Extra charges requested for this booking</CardDescription>
            </div>
            {canCreate && <CreateExtraChargeForm bookingId={bookingId} onSuccess={fetchExtraCharges} />}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Additional Charges</CardTitle>
            <CardDescription>
              {extraCharges.length === 0
                ? 'No additional charges requested yet'
                : `${extraCharges.length} charge${extraCharges.length > 1 ? 's' : ''} for this booking`}
            </CardDescription>
          </div>
          {canCreate && <CreateExtraChargeForm bookingId={bookingId} onSuccess={fetchExtraCharges} />}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {extraCharges.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No additional charges have been requested for this booking.</p>
            {canCreate && (
              <p className="text-sm mt-2">Click &quot;Request Additional Charge&quot; above to create one.</p>
            )}
          </div>
        ) : (
          extraCharges.map((charge) => {
            const isExpired = new Date(charge.expiresAt) < new Date();
            const canCancelThis = canCancel && charge.status === 'PENDING' && !charge.paidAt;

            return (
              <div
                key={charge.id}
                className={`p-4 border rounded-lg ${
                  charge.status === 'PAID'
                    ? 'border-green-200 bg-green-50'
                    : charge.status === 'DECLINED'
                    ? 'border-red-200 bg-red-50'
                    : charge.status === 'PENDING'
                    ? 'border-orange-200 bg-orange-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={statusColors[charge.status]}>
                        {charge.status}
                      </Badge>
                      {isExpired && charge.status === 'PENDING' && (
                        <Badge variant="outline" className="text-gray-600">
                          Expired
                        </Badge>
                      )}
                    </div>
                    <h4 className="font-semibold text-lg">
                      {reasonLabels[charge.reason] || charge.reason}
                    </h4>
                    {charge.description && (
                      <p className="text-sm text-gray-600 mt-1">{charge.description}</p>
                    )}
                    {charge.paidAt && (
                      <div className="flex items-center gap-2 text-sm text-green-600 mt-2">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Paid on {format(new Date(charge.paidAt), 'MMM dd, yyyy')}</span>
                      </div>
                    )}
                    {charge.status === 'PENDING' && !isExpired && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                        <Clock className="h-4 w-4" />
                        <span>Expires {format(new Date(charge.expiresAt), 'MMM dd, yyyy')}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-2xl font-bold text-orange-600">
                      £{(charge.totalAmount / 100).toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-4">
                  <Link href={`/company/payments/${charge.id}`}>
                    <Button variant="outline" size="sm">
                      <Info className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </Link>
                  {canCancelThis && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancel(charge)}
                      disabled={cancelling === charge.id}
                    >
                      {cancelling === charge.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Cancelling...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Cancel Request
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}


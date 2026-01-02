'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Eye, Search, Loader2, TrendingUp, AlertCircle, RefreshCw, PoundSterling, Copy, Check } from 'lucide-react';
import { companyApi, getCustomerName, getCustomerEmail } from '@/lib/company-api';
import type { Payment, PaymentStats } from '@/lib/company-api';
import { getErrorMessage } from '@/lib/api';
import { usePermissions, canPerformAction } from '@/lib/permissions';
import { toast } from '@/lib/toast';

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  SUCCEEDED: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-gray-100 text-gray-800',
  PARTIALLY_REFUNDED: 'bg-orange-100 text-orange-800',
  PAID: 'bg-green-100 text-green-800', // Keep for backward compatibility (deprecated)
};

export default function PaymentsPage() {
  const permissions = usePermissions();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false,
  });
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [paymentToRefund, setPaymentToRefund] = useState<Payment | null>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [processingRefund, setProcessingRefund] = useState(false);
  const [copiedPaymentId, setCopiedPaymentId] = useState<string | null>(null);

  const canViewPayments = canPerformAction(permissions, 'viewPayments');
  const canViewPaymentStats = canPerformAction(permissions, 'viewPaymentStats');

  const copyPaymentId = async (paymentId: string) => {
    try {
      await navigator.clipboard.writeText(paymentId);
      setCopiedPaymentId(paymentId);
      toast.success('Payment ID copied to clipboard');
      setTimeout(() => setCopiedPaymentId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy payment ID');
    }
  };

  useEffect(() => {
    if (permissions.loading) return;

    if (canViewPayments) {
      fetchPayments();
    }
    if (canViewPaymentStats) {
      fetchPaymentStats();
    }
  }, [
    currentPage,
    statusFilter,
    searchQuery,
    dateFrom,
    dateTo,
    canViewPayments,
    canViewPaymentStats,
    permissions.loading,
    fetchPayments,
    fetchPaymentStats,
  ]);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await companyApi.getPayments({
        limit: pagination.limit,
        offset: currentPage * pagination.limit,
        status: statusFilter !== 'all' ? (statusFilter as 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED') : undefined,
        search: searchQuery || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });

      // Ensure we have valid response structure
      if (response && response.data && Array.isArray(response.data)) {
        setPayments(response.data);
      } else {
        setPayments([]);
      }
      
      // Update pagination from API response
      if (response && response.pagination) {
        setPagination({
          total: response.pagination.total || 0,
          limit: response.pagination.limit || 20,
          offset: response.pagination.offset || 0,
          hasMore: response.pagination.hasMore || false,
        });
      } else {
        // Fallback pagination
        setPagination({
          total: response?.data?.length || 0,
          limit: 20,
          offset: currentPage * 20,
          hasMore: false,
        });
      }
    } catch (error) {
      console.error('Failed to fetch payments:', error);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, searchQuery, dateFrom, dateTo, pagination.limit]);

  const fetchPaymentStats = useCallback(async () => {
    if (!canPerformAction(permissions, 'viewPaymentStats')) {
      return;
    }
    setStatsLoading(true);
    try {
      const statsData = await companyApi.getPaymentStats({
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch payment stats:', error);
    } finally {
      setStatsLoading(false);
    }
  }, [dateFrom, dateTo]);

  const handleRefund = async () => {
    if (!paymentToRefund) return;
    setProcessingRefund(true);
    try {
      await companyApi.refundPayment(paymentToRefund.id, {
        amount: refundAmount ? Number(refundAmount) : undefined,
        reason: refundReason || undefined,
      });
      setRefundDialogOpen(false);
      setPaymentToRefund(null);
      setRefundAmount('');
      setRefundReason('');
      fetchPayments();
      fetchPaymentStats();
      toast.success('Refund processed successfully');
    } catch (error: any) {
      console.error('Failed to process refund:', error);
      toast.error(getErrorMessage(error) || 'Failed to process refund. Please try again.');
    } finally {
      setProcessingRefund(false);
    }
  };

  const openRefundDialog = (payment: Payment) => {
    if (!canPerformAction(permissions, 'processRefund')) {
      toast.error('You do not have permission to process refunds.');
      return;
    }
    if (payment.status !== 'SUCCEEDED' && payment.status !== 'PARTIALLY_REFUNDED') {
      toast.error('Only succeeded or partially refunded payments can be refunded.');
      return;
    }
    setPaymentToRefund(payment);
    setRefundAmount('');
    setRefundReason('');
    setRefundDialogOpen(true);
  };

  // Check if user has permission to view payments
  if (!permissions.loading && !canViewPayments) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="text-center py-8">
            <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
            <p className="text-gray-600">You do not have permission to view payments.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payments</h1>
        <p className="text-gray-600 mt-2">Manage and track all payment transactions</p>
      </div>

      {/* Stats Cards */}
      {canPerformAction(permissions, 'viewPaymentStats') && !statsLoading && stats && (
        <>
          {stats.period && (stats.period.dateFrom || stats.period.dateTo) && (
            <Card className="mb-4">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>Period:</span>
                  <span className="font-medium">
                    {stats.period.dateFrom 
                      ? new Date(stats.period.dateFrom).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                      : 'All time'}
                    {stats.period.dateFrom && stats.period.dateTo && ' - '}
                    {stats.period.dateTo 
                      ? new Date(stats.period.dateTo).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                      : stats.period.dateFrom ? ' onwards' : ''}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
          <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <PoundSterling className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">£{stats.totalAmount.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">All payments</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paid</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">£{stats.paidAmount.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">{stats.paidCount} payments</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">£{stats.pendingAmount.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">{stats.pendingCount} payments</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Refunded</CardTitle>
              <RefreshCw className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">£{stats.refundedAmount.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">{stats.refundedCount} payments</p>
            </CardContent>
          </Card>
        </div>
        </>
      )}

      {/* Breakdown */}
      {canPerformAction(permissions, 'viewPaymentStats') && !statsLoading && stats && stats.breakdown && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Booking Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Amount</span>
                  <span className="text-lg font-semibold">£{stats.breakdown.bookingPayments.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Paid Amount</span>
                  <span className="text-sm font-medium text-green-600">£{stats.breakdown.bookingPayments.paidAmount.toFixed(2)}</span>
                </div>
                {stats.breakdown.bookingPayments.refundedAmount > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Refunded Amount</span>
                    <span className="text-sm font-medium text-gray-600">£{stats.breakdown.bookingPayments.refundedAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm text-gray-600">Count</span>
                  <span className="text-sm font-medium">{stats.breakdown.bookingPayments.count} payments</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Extra Charges</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Amount</span>
                  <span className="text-lg font-semibold">£{stats.breakdown.extraCharges.totalAmount.toFixed(2)}</span>
                </div>
                {stats.breakdown.extraCharges.paidAmount !== undefined && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Paid Amount</span>
                    <span className="text-sm font-medium text-green-600">£{stats.breakdown.extraCharges.paidAmount.toFixed(2)}</span>
                  </div>
                )}
                {stats.breakdown.extraCharges.refundedAmount !== undefined && stats.breakdown.extraCharges.refundedAmount > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Refunded Amount</span>
                    <span className="text-sm font-medium text-gray-600">£{stats.breakdown.extraCharges.refundedAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm text-gray-600">Count</span>
                  <span className="text-sm font-medium">{stats.breakdown.extraCharges.count} charges</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by booking ID, customer..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(0);
                }}
              />
            </div>
            <Select value={statusFilter} onValueChange={(value) => {
              setStatusFilter(value);
              setCurrentPage(0);
            }}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="SUCCEEDED">Succeeded</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="REFUNDED">Refunded</SelectItem>
                <SelectItem value="PARTIALLY_REFUNDED">Partially Refunded</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2 items-center">
              <Input
                type="date"
                placeholder="From"
                value={dateFrom}
                onChange={(e) => {
                  const newDateFrom = e.target.value;
                  setDateFrom(newDateFrom);
                  // If dateTo is before the new dateFrom, clear dateTo
                  if (dateTo && newDateFrom && newDateFrom > dateTo) {
                    setDateTo('');
                  }
                  setCurrentPage(0);
                }}
                max={dateTo || new Date().toISOString().split('T')[0]}
                className="w-40"
              />
              <span className="text-gray-500">to</span>
              <Input
                type="date"
                placeholder="To"
                value={dateTo}
                onChange={(e) => {
                  const newDateTo = e.target.value;
                  setDateTo(newDateTo);
                  // If dateFrom is after the new dateTo, clear dateFrom
                  if (dateFrom && newDateTo && dateFrom > newDateTo) {
                    setDateFrom('');
                  }
                  setCurrentPage(0);
                }}
                min={dateFrom || undefined}
                max={new Date().toISOString().split('T')[0]}
                className="w-40"
              />
              {(dateFrom || dateTo) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDateFrom('');
                    setDateTo('');
                    setCurrentPage(0);
                  }}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Payments</CardTitle>
          <CardDescription>View and manage payment transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">Payment ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Booking</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (!payments || payments.length === 0) ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-orange-600" />
                  </TableCell>
                </TableRow>
              ) : !payments || payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                    No payments found
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="w-[140px]">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => copyPaymentId(payment.id)}
                              className="font-mono text-xs text-left hover:text-orange-600 transition-colors flex items-center gap-1.5 group max-w-full truncate"
                            >
                              <span className="truncate">{payment.id}...</span>
                              {copiedPaymentId === payment.id ? (
                                <Check className="h-3 w-3 text-green-600" />
                              ) : (
                                <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                              )}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Click to copy payment ID</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>
                      {payment.type ? (
                        <Badge className="bg-gray-50 text-gray-700 border-gray-200">
                          {payment.type === 'EXTRA_CHARGE' ? 'Extra Charge' : 'Booking Payment'}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                          Payment
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {payment.booking ? (
                        <Link href={`/company/bookings/${payment.bookingId}`} className="text-orange-600 hover:underline">
                          Booking #{payment.bookingId}
                        </Link>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {payment.booking?.customer ? (
                        <div>
                          <p className="font-medium">{getCustomerName(payment.booking.customer)}</p>
                          {getCustomerEmail(payment.booking.customer) && (
                            <p className="text-xs text-gray-500">{getCustomerEmail(payment.booking.customer)}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">£{payment.amount.toFixed(2)}</p>
                        {payment.refundedAmount != null && Number(payment.refundedAmount) > 0 && (
                          <p className="text-xs text-red-600">
                            Refunded: £{Number(payment.refundedAmount).toFixed(2)}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[payment.status] || ''}>
                        {payment.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {payment.paymentMethod ? (
                        <span className="capitalize">{payment.paymentMethod.toLowerCase()}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {payment.paidAt ? (
                        <div>
                          <p className="text-sm">{new Date(payment.paidAt).toLocaleDateString()}</p>
                          <p className="text-xs text-gray-500">{new Date(payment.paidAt).toLocaleTimeString()}</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm">{new Date(payment.createdAt).toLocaleDateString()}</p>
                          <p className="text-xs text-gray-500">{new Date(payment.createdAt).toLocaleTimeString()}</p>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <TooltipProvider>
                        <div className="flex justify-end gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link href={`/company/payments/${payment.id}`}>
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>View Payment Details</p>
                            </TooltipContent>
                          </Tooltip>
                        {(payment.status === 'SUCCEEDED' || payment.status === 'PARTIALLY_REFUNDED') && 
                         canPerformAction(permissions, 'processRefund') && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openRefundDialog(payment)}
                                >
                                  <RefreshCw className="h-4 w-4 text-orange-600" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Process Refund</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        {pagination && pagination.total > pagination.limit && (
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <div className="text-sm text-gray-600">
              Showing {currentPage * pagination.limit + 1} to{' '}
              {Math.min((currentPage + 1) * pagination.limit, pagination.total)} of{' '}
              {pagination.total} payments
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0 || loading}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => p + 1)}
                disabled={!pagination.hasMore || loading}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Refund Dialog */}
      <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
            <DialogDescription>
              {paymentToRefund && (
                <>
                  Refund payment for booking #{paymentToRefund.bookingId}.
                  {paymentToRefund.status === 'PARTIALLY_REFUNDED' && (
                    <span className="block mt-2 text-sm text-gray-600">
                      Already refunded: £{paymentToRefund.refundedAmount?.toFixed(2) || '0.00'}. 
                      Remaining: £{((paymentToRefund.amount || 0) - (paymentToRefund.refundedAmount || 0)).toFixed(2)}
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
                placeholder={paymentToRefund ? `Max: £${paymentToRefund.amount.toFixed(2)}` : ''}
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
              />
              {paymentToRefund && (
                <p className="text-xs text-gray-500">
                  Full refund amount: £{paymentToRefund.amount.toFixed(2)}
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


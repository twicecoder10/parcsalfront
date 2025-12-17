'use client';

import { useState, useEffect } from 'react';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Eye, Search, Loader2, DollarSign, TrendingUp, AlertCircle, RefreshCw, Calendar } from 'lucide-react';
import { companyApi } from '@/lib/company-api';
import type { Payment, PaymentStats } from '@/lib/company-api';
import { getErrorMessage } from '@/lib/api';
import { usePermissions, canPerformAction } from '@/lib/permissions';

const statusColors: Record<string, string> = {
  PAID: 'bg-green-100 text-green-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  FAILED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-gray-100 text-gray-800',
  PARTIALLY_REFUNDED: 'bg-orange-100 text-orange-800',
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

  useEffect(() => {
    if (canPerformAction(permissions, 'viewPayments')) {
      fetchPayments();
    }
    if (canPerformAction(permissions, 'viewPaymentStats')) {
      fetchPaymentStats();
    }
  }, [currentPage, statusFilter, searchQuery, dateFrom, dateTo, permissions]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const response = await companyApi.getPayments({
        limit: pagination.limit,
        offset: currentPage * pagination.limit,
        status: statusFilter !== 'all' ? statusFilter as 'PAID' | 'PENDING' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED' : undefined,
        search: searchQuery || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });

      setPayments(Array.isArray(response.data) ? response.data : []);
      setPagination(response.pagination || {
        total: 0,
        limit: pagination.limit,
        offset: currentPage * pagination.limit,
        hasMore: false,
      });
    } catch (error) {
      console.error('Failed to fetch payments:', error);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentStats = async () => {
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
  };

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
    } catch (error: any) {
      console.error('Failed to process refund:', error);
      alert(getErrorMessage(error) || 'Failed to process refund. Please try again.');
    } finally {
      setProcessingRefund(false);
    }
  };

  const openRefundDialog = (payment: Payment) => {
    if (!canPerformAction(permissions, 'processRefund')) {
      alert('You do not have permission to process refunds.');
      return;
    }
    if (payment.status !== 'PAID' && payment.status !== 'PARTIALLY_REFUNDED') {
      alert('Only paid or partially refunded payments can be refunded.');
      return;
    }
    setPaymentToRefund(payment);
    setRefundAmount('');
    setRefundReason('');
    setRefundDialogOpen(true);
  };

  // Check if user has permission to view payments
  if (!permissions.loading && !canPerformAction(permissions, 'viewPayments')) {
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
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
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
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
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
                  setDateFrom(e.target.value);
                  setCurrentPage(0);
                }}
                className="w-40"
              />
              <span className="text-gray-500">to</span>
              <Input
                type="date"
                placeholder="To"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setCurrentPage(0);
                }}
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
                <TableHead>Payment ID</TableHead>
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
                  <TableCell colSpan={8} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-orange-600" />
                  </TableCell>
                </TableRow>
              ) : !payments || payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    No payments found
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-mono text-xs">
                      {payment.id}...
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
                          <p className="font-medium">{payment.booking.customer.fullName}</p>
                          <p className="text-xs text-gray-500">{payment.booking.customer.email}</p>
                        </div>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">£{payment.amount.toFixed(2)}</p>
                        {payment.refundedAmount && payment.refundedAmount > 0 && (
                          <p className="text-xs text-red-600">
                            Refunded: £{payment.refundedAmount.toFixed(2)}
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
                      <div className="flex justify-end gap-2">
                        <Link href={`/company/bookings/${payment.bookingId}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        {(payment.status === 'PAID' || payment.status === 'PARTIALLY_REFUNDED') && 
                         canPerformAction(permissions, 'processRefund') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openRefundDialog(payment)}
                          >
                            <RefreshCw className="h-4 w-4 text-orange-600" />
                          </Button>
                        )}
                      </div>
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


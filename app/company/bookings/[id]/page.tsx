'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Package, DollarSign, User, Mail, Phone, CheckCircle2, XCircle, Loader2, ArrowLeft, CreditCard } from 'lucide-react';
import Link from 'next/link';
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
import { companyApi } from '@/lib/company-api';
import type { Booking } from '@/lib/company-api';

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  ACCEPTED: 'bg-blue-100 text-blue-800',
  IN_TRANSIT: 'bg-orange-100 text-orange-800',
  DELIVERED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
};

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  const fetchBooking = async () => {
    setLoading(true);
    try {
      const bookingData = await companyApi.getBookingById(bookingId);
      setBooking(bookingData);
    } catch (error: any) {
      console.error('Failed to fetch booking:', error);
      // Booking will remain null, which will show the "not found" message
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!booking) return;
    setProcessing(true);
    try {
      const updatedBooking = await companyApi.acceptBooking(bookingId);
      setBooking(updatedBooking);
    } catch (error: any) {
      console.error('Failed to accept booking:', error);
      alert(error.message || 'Failed to accept booking. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!booking || !rejectionReason.trim()) return;
    setProcessing(true);
    try {
      const updatedBooking = await companyApi.rejectBooking(bookingId, rejectionReason);
      setBooking(updatedBooking);
      setRejectDialogOpen(false);
      setRejectionReason('');
    } catch (error: any) {
      console.error('Failed to reject booking:', error);
      alert(error.message || 'Failed to reject booking. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateStatus = async (newStatus: 'ACCEPTED' | 'IN_TRANSIT' | 'DELIVERED') => {
    if (!booking) return;
    setProcessing(true);
    try {
      const updatedBooking = await companyApi.updateBookingStatus(bookingId, newStatus);
      setBooking(updatedBooking);
    } catch (error: any) {
      console.error('Failed to update booking status:', error);
      alert(error.message || 'Failed to update booking status. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">Booking not found</p>
            <Link href="/company/bookings">
              <Button variant="outline" className="mt-4">
                Back to Bookings
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canAccept = booking.status === 'PENDING';
  const canReject = booking.status === 'PENDING';
  const canMarkInTransit = booking.status === 'ACCEPTED';
  const canMarkDelivered = booking.status === 'IN_TRANSIT';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/company/bookings">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Booking Details</h1>
          <p className="text-gray-600 mt-2">Booking #{booking.id}</p>
        </div>
      </div>

      {/* Status & Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Status</CardTitle>
            <Badge className={statusColors[booking.status] || ''}>
              {booking.status.replace('_', ' ')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {canAccept && (
            <div className="flex gap-2">
              <Button onClick={handleAccept} disabled={processing}>
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Accept Booking
                  </>
                )}
              </Button>
              <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive" disabled={processing}>
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject Booking
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Reject Booking</DialogTitle>
                    <DialogDescription>
                      Please provide a reason for rejecting this booking.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="reason">Rejection Reason</Label>
                      <Textarea
                        id="reason"
                        placeholder="Enter reason for rejection..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        rows={4}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleReject}
                      disabled={!rejectionReason.trim() || processing}
                    >
                      {processing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        'Reject Booking'
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
          {canMarkInTransit && (
            <Button onClick={() => handleUpdateStatus('IN_TRANSIT')} disabled={processing}>
              Mark as In Transit
            </Button>
          )}
          {canMarkDelivered && (
            <Button onClick={() => handleUpdateStatus('DELIVERED')} disabled={processing}>
              Mark as Delivered
            </Button>
          )}
          {booking.status === 'REJECTED' && booking.notes && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-medium text-red-900 mb-1">Rejection Reason:</p>
              <p className="text-sm text-red-700">{booking.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customer Info */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-orange-100 p-2">
                <User className="h-5 w-5 text-orange-600" />
              </div>
                      <div>
                        <p className="font-medium">{booking.customer.fullName}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="h-4 w-4" />
                            <a href={`mailto:${booking.customer.email}`} className="hover:text-orange-600">
                              {booking.customer.email}
                            </a>
                          </div>
                        </div>
                      </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shipment Info */}
      <Card>
        <CardHeader>
          <CardTitle>Shipment Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {booking.shipmentSlot && (
            <>
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="font-medium">Route</p>
                  <p className="text-sm text-gray-600">
                    {booking.shipmentSlot.originCity}, {booking.shipmentSlot.originCountry} → {booking.shipmentSlot.destinationCity}, {booking.shipmentSlot.destinationCountry}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">Departure</p>
                  <p className="text-sm text-gray-600">
                    {new Date(booking.shipmentSlot.departureTime).toLocaleString()}
                  </p>
                </div>
              </div>
              {booking.shipmentSlot.arrivalTime && (
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">Arrival</p>
                    <p className="text-sm text-gray-600">
                      {new Date(booking.shipmentSlot.arrivalTime).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
              <div className="pt-4 border-t">
                <Link href={`/company/shipments/${booking.shipmentSlot.id}`}>
                  <Button variant="outline" size="sm">
                    View Shipment Details
                  </Button>
                </Link>
              </div>
            </>
          )}
          <div className="flex items-center gap-3">
            <Package className="h-5 w-5 text-purple-600" />
            <div>
              <p className="font-medium">Weight / Items</p>
              <p className="text-sm text-gray-600">
                {booking.requestedWeightKg ? `${booking.requestedWeightKg} kg` : booking.requestedItemsCount ? `${booking.requestedItemsCount} items` : 'N/A'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <DollarSign className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium">Price</p>
              <p className="text-sm text-gray-600">£{booking.calculatedPrice}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Payment Information</CardTitle>
            <Badge className={booking.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' : booking.paymentStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : booking.paymentStatus === 'FAILED' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}>
              {booking.paymentStatus || 'PENDING'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Total Amount</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">
                  £{parseFloat(String(booking.calculatedPrice || 0)).toFixed(2)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-gray-400" />
              </div>
            </div>
            
            {/* Payment Details */}
            {booking.payment && booking.paymentStatus === 'PAID' && (
              <div className="pt-4 border-t space-y-2">
                <p className="text-sm font-medium text-gray-700">Payment Details</p>
                <div className="text-sm text-gray-600 space-y-1">
                  {booking.payment.stripePaymentIntentId && (
                    <p>
                      Transaction ID: <span className="font-mono text-xs">{booking.payment.stripePaymentIntentId}</span>
                    </p>
                  )}
                  {booking.payment.id && !booking.payment.stripePaymentIntentId && (
                    <p>
                      Payment ID: <span className="font-mono text-xs">{booking.payment.id}</span>
                    </p>
                  )}
                  {booking.payment.amount && (
                    <p>Amount: £{parseFloat(String(booking.payment.amount)).toFixed(2)}</p>
                  )}
                  {booking.payment.currency && (
                    <p>Currency: {String(booking.payment.currency).toUpperCase()}</p>
                  )}
                  {booking.payment.status && (
                    <p>
                      Status: <span className="capitalize">{String(booking.payment.status).toLowerCase()}</span>
                    </p>
                  )}
                  {booking.payment.createdAt && (
                    <p>Paid on: {new Date(booking.payment.createdAt).toLocaleString()}</p>
                  )}
                  {booking.payment.paymentMethod && (
                    <p>
                      Payment Method: <span className="capitalize">{String(booking.payment.paymentMethod).toLowerCase()}</span>
                    </p>
                  )}
                </div>
              </div>
            )}
            {booking.paymentStatus === 'PENDING' && (
              <div className="pt-4 border-t">
                <p className="text-sm text-yellow-700">
                  Payment is pending. The customer will need to complete payment to confirm this booking.
                </p>
              </div>
            )}
            {booking.paymentStatus === 'FAILED' && (
              <div className="pt-4 border-t">
                <p className="text-sm text-red-700">
                  Payment failed. The customer will need to retry payment.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Status Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Status Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { status: 'PENDING', completed: true, date: booking.createdAt },
              { status: 'ACCEPTED', completed: ['ACCEPTED', 'IN_TRANSIT', 'DELIVERED'].includes(booking.status), date: booking.status !== 'PENDING' ? booking.createdAt : null },
              { status: 'IN_TRANSIT', completed: ['IN_TRANSIT', 'DELIVERED'].includes(booking.status), date: booking.status === 'IN_TRANSIT' || booking.status === 'DELIVERED' ? booking.updatedAt : null },
              { status: 'DELIVERED', completed: booking.status === 'DELIVERED', date: booking.status === 'DELIVERED' ? booking.updatedAt : null },
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                  item.completed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  {item.completed ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{item.status.replace('_', ' ')}</p>
                  {item.date && (
                    <p className="text-sm text-gray-600">
                      {new Date(item.date).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Booking Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Booking Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Created At</p>
              <p className="font-medium">
                {new Date(booking.createdAt).toLocaleString()}
              </p>
            </div>
            {booking.updatedAt && (
              <div>
                <p className="text-muted-foreground">Last Updated</p>
                <p className="font-medium">
                  {new Date(booking.updatedAt).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

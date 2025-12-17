'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Package, DollarSign, User, Mail, Phone, CheckCircle2, XCircle, Loader2, ArrowLeft, CreditCard, Truck, Printer, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
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
import { uploadProofImages, createImagePreview, MAX_PROOF_IMAGES } from '@/lib/upload-api';
import { X, Upload } from 'lucide-react';

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
  
  // Proof image upload state
  const [pickupProofFiles, setPickupProofFiles] = useState<File[]>([]);
  const [pickupProofPreviews, setPickupProofPreviews] = useState<string[]>([]);
  const [deliveryProofFiles, setDeliveryProofFiles] = useState<File[]>([]);
  const [deliveryProofPreviews, setDeliveryProofPreviews] = useState<string[]>([]);
  const [uploadingProofImages, setUploadingProofImages] = useState(false);
  const [proofImageError, setProofImageError] = useState<string | null>(null);
  const [proofImageSuccess, setProofImageSuccess] = useState<string | null>(null);
  
  // Label state
  const [labelLoading, setLabelLoading] = useState(false);
  const [labelError, setLabelError] = useState<string | null>(null);
  const [regeneratingLabel, setRegeneratingLabel] = useState(false);

  const fetchBooking = useCallback(async () => {
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
  }, [bookingId]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

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

  const handlePrintLabel = async () => {
    if (!booking) return;
    setLabelLoading(true);
    setLabelError(null);
    try {
      let labelUrl = booking.labelUrl;
      
      // If label URL is not available, fetch it
      if (!labelUrl) {
        const labelData = await companyApi.getBookingLabel(bookingId);
        labelUrl = labelData.labelUrl;
        // Update booking with label URL
        setBooking({ ...booking, labelUrl });
      }
      
      // Open label in new window and trigger print
      if (labelUrl) {
        const printWindow = window.open(labelUrl, '_blank');
        if (printWindow) {
          printWindow.addEventListener('load', () => {
            printWindow.print();
          });
        }
      }
    } catch (error: any) {
      console.error('Failed to get label:', error);
      // Extract error message from API response
      const errorMessage = error.response?.data?.message || error.message || 'Failed to get label. Please try again.';
      setLabelError(errorMessage);
      // Show error for a few seconds
      setTimeout(() => setLabelError(null), 5000);
    } finally {
      setLabelLoading(false);
    }
  };

  const handleRegenerateLabel = async () => {
    if (!booking) return;
    setRegeneratingLabel(true);
    setLabelError(null);
    try {
      const updatedBooking = await companyApi.regenerateBookingLabel(bookingId);
      setBooking(updatedBooking);
    } catch (error: any) {
      console.error('Failed to regenerate label:', error);
      // Extract error message from API response
      const errorMessage = error.response?.data?.message || error.message || 'Failed to regenerate label. Please try again.';
      setLabelError(errorMessage);
      // Show error for a few seconds
      setTimeout(() => setLabelError(null), 5000);
    } finally {
      setRegeneratingLabel(false);
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

      {/* Shipping Label Section */}
      {booking.status !== 'PENDING' && (
        <Card>
          <CardHeader>
            <CardTitle>Shipping Label</CardTitle>
            <CardDescription>Print or regenerate the shipping label for this booking</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {labelError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{labelError}</p>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Label Status</p>
                <p className="text-sm text-gray-600">
                  {booking.labelUrl ? (
                    <span className="text-green-600">Available</span>
                  ) : (
                    <span className="text-yellow-600">Not Generated</span>
                  )}
                </p>
              </div>
              <div className="flex gap-2">
                {booking.labelUrl ? (
                  <Button
                    onClick={handlePrintLabel}
                    disabled={labelLoading}
                    variant="default"
                  >
                    {labelLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <Printer className="h-4 w-4 mr-2" />
                        Print Label
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleRegenerateLabel}
                    disabled={regeneratingLabel}
                    variant="outline"
                  >
                    {regeneratingLabel ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Regenerating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Generate Label
                      </>
                    )}
                  </Button>
                )}
                {booking.labelUrl && (
                  <Button
                    onClick={handleRegenerateLabel}
                    disabled={regeneratingLabel}
                    variant="outline"
                  >
                    {regeneratingLabel ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Regenerating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Regenerate
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
            
            {booking.labelUrl && (
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600 mb-2">Label Preview</p>
                <div className="border rounded-lg overflow-hidden">
                  <iframe
                    src={booking.labelUrl}
                    className="w-full h-96"
                    title="Shipping Label Preview"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
              <p className="font-medium">Requested Weight / Items</p>
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

      {/* Parcel Information */}
      {(booking.parcelType || booking.weight || booking.value || booking.length || booking.width || booking.height || booking.description || booking.pickupMethod || booking.deliveryMethod) && (
        <Card>
          <CardHeader>
            <CardTitle>Parcel Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {booking.parcelType && (
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-medium">Parcel Type</p>
                  <p className="text-sm text-gray-600">{booking.parcelType}</p>
                </div>
              </div>
            )}
            {booking.weight && (
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-medium">Actual Weight</p>
                  <p className="text-sm text-gray-600">{booking.weight} kg</p>
                </div>
              </div>
            )}
            {booking.value && (
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">Parcel Value</p>
                  <p className="text-sm text-gray-600">£{parseFloat(String(booking.value)).toFixed(2)}</p>
                </div>
              </div>
            )}
            {(booking.length || booking.width || booking.height) && (
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">Dimensions</p>
                  <p className="text-sm text-gray-600">
                    {booking.length && booking.width && booking.height
                      ? `${booking.length} × ${booking.width} × ${booking.height} cm`
                      : booking.length
                      ? `Length: ${booking.length} cm`
                      : booking.width
                      ? `Width: ${booking.width} cm`
                      : booking.height
                      ? `Height: ${booking.height} cm`
                      : 'N/A'}
                  </p>
                </div>
              </div>
            )}
            {booking.description && (
              <div className="flex items-start gap-3">
                <Package className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <p className="font-medium">Description</p>
                  <p className="text-sm text-gray-600">{booking.description}</p>
                </div>
              </div>
            )}
            {booking.pickupMethod && (
              <div className="flex items-center gap-3">
                <Truck className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">Pickup Method</p>
                  <p className="text-sm text-gray-600">
                    {booking.pickupMethod === 'PICKUP_FROM_SENDER'
                      ? 'Company picks up from sender'
                      : 'Sender drops off at company'}
                  </p>
                </div>
              </div>
            )}
            {booking.deliveryMethod && (
              <div className="flex items-center gap-3">
                <Truck className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">Delivery Method</p>
                  <p className="text-sm text-gray-600">
                    {booking.deliveryMethod === 'RECEIVER_PICKS_UP'
                      ? 'Receiver picks up from company'
                      : 'Company delivers to receiver'}
                  </p>
                </div>
              </div>
            )}
            {booking.images && booking.images.length > 0 && (
              <div className="flex items-start gap-3">
                <Package className="h-5 w-5 text-purple-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium mb-2">Images</p>
                  <div className="grid grid-cols-2 gap-2">
                    {booking.images.map((image: string, index: number) => (
                      <div key={index} className="relative w-full h-32 rounded-lg border overflow-hidden">
                        <Image
                          src={image}
                          alt={`Parcel image ${index + 1}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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

      {/* Proof Images Section */}
      {booking.status !== 'CANCELLED' && booking.status !== 'REJECTED' && (
        <Card>
          <CardHeader>
            <CardTitle>Proof Images</CardTitle>
            <CardDescription>Upload proof of pickup and delivery</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {proofImageError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{proofImageError}</p>
              </div>
            )}
            {proofImageSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">{proofImageSuccess}</p>
              </div>
            )}

            {/* Existing Proof Images */}
            {(booking.pickupProofImages && booking.pickupProofImages.length > 0) || 
             (booking.deliveryProofImages && booking.deliveryProofImages.length > 0) ? (
              <div className="space-y-4">
                {booking.pickupProofImages && booking.pickupProofImages.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Pickup Proof Images</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {booking.pickupProofImages.map((image: string, index: number) => (
                        <div key={index} className="relative aspect-square rounded-lg border overflow-hidden">
                          <Image
                            src={image}
                            alt={`Pickup proof ${index + 1}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 33vw, 150px"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {booking.deliveryProofImages && booking.deliveryProofImages.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Delivery Proof Images</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {booking.deliveryProofImages.map((image: string, index: number) => (
                        <div key={index} className="relative aspect-square rounded-lg border overflow-hidden">
                          <Image
                            src={image}
                            alt={`Delivery proof ${index + 1}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 33vw, 150px"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {/* Upload New Proof Images */}
            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-3">
                <Label>Pickup Proof Images (Optional)</Label>
                {pickupProofPreviews.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {pickupProofPreviews.map((preview, index) => (
                      <div key={index} className="relative aspect-square rounded-lg border overflow-hidden group">
                        <Image
                          src={preview}
                          alt={`Pickup proof preview ${index + 1}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 33vw, 150px"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newFiles = pickupProofFiles.filter((_, i) => i !== index);
                            const newPreviews = pickupProofPreviews.filter((_, i) => i !== index);
                            setPickupProofFiles(newFiles);
                            setPickupProofPreviews(newPreviews);
                          }}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <label htmlFor="pickup-proof-upload" className="cursor-pointer">
                  <div className="flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-lg hover:bg-gray-50 transition-colors">
                    <Upload className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {pickupProofFiles.length === 0
                        ? 'Upload pickup proof images'
                        : `${pickupProofFiles.length} image${pickupProofFiles.length > 1 ? 's' : ''} selected`}
                    </span>
                  </div>
                </label>
                <input
                  id="pickup-proof-upload"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                  multiple
                  className="hidden"
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length === 0) return;

                    const totalFiles = pickupProofFiles.length + deliveryProofFiles.length + files.length;
                    if (totalFiles > MAX_PROOF_IMAGES) {
                      setProofImageError(`Maximum ${MAX_PROOF_IMAGES} proof images allowed total.`);
                      return;
                    }

                    // Validate files
                    for (const file of files) {
                      if (file.size > 10 * 1024 * 1024) {
                        setProofImageError(`File ${file.name} is too large. Maximum size is 10MB.`);
                        return;
                      }
                      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
                      if (!allowedTypes.includes(file.type)) {
                        setProofImageError(`File ${file.name} is not a supported image format.`);
                        return;
                      }
                    }

                    setProofImageError(null);
                    const newFiles = [...pickupProofFiles, ...files];
                    setPickupProofFiles(newFiles);

                    // Create previews
                    const newPreviews = await Promise.all(
                      files.map((file) => createImagePreview(file))
                    );
                    setPickupProofPreviews([...pickupProofPreviews, ...newPreviews]);
                  }}
                />
              </div>

              <div className="space-y-3">
                <Label>Delivery Proof Images (Optional)</Label>
                {deliveryProofPreviews.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {deliveryProofPreviews.map((preview, index) => (
                      <div key={index} className="relative aspect-square rounded-lg border overflow-hidden group">
                        <Image
                          src={preview}
                          alt={`Delivery proof preview ${index + 1}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 33vw, 150px"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newFiles = deliveryProofFiles.filter((_, i) => i !== index);
                            const newPreviews = deliveryProofPreviews.filter((_, i) => i !== index);
                            setDeliveryProofFiles(newFiles);
                            setDeliveryProofPreviews(newPreviews);
                          }}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <label htmlFor="delivery-proof-upload" className="cursor-pointer">
                  <div className="flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-lg hover:bg-gray-50 transition-colors">
                    <Upload className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {deliveryProofFiles.length === 0
                        ? 'Upload delivery proof images'
                        : `${deliveryProofFiles.length} image${deliveryProofFiles.length > 1 ? 's' : ''} selected`}
                    </span>
                  </div>
                </label>
                <input
                  id="delivery-proof-upload"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                  multiple
                  className="hidden"
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length === 0) return;

                    const totalFiles = pickupProofFiles.length + deliveryProofFiles.length + files.length;
                    if (totalFiles > MAX_PROOF_IMAGES) {
                      setProofImageError(`Maximum ${MAX_PROOF_IMAGES} proof images allowed total.`);
                      return;
                    }

                    // Validate files
                    for (const file of files) {
                      if (file.size > 10 * 1024 * 1024) {
                        setProofImageError(`File ${file.name} is too large. Maximum size is 10MB.`);
                        return;
                      }
                      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
                      if (!allowedTypes.includes(file.type)) {
                        setProofImageError(`File ${file.name} is not a supported image format.`);
                        return;
                      }
                    }

                    setProofImageError(null);
                    const newFiles = [...deliveryProofFiles, ...files];
                    setDeliveryProofFiles(newFiles);

                    // Create previews
                    const newPreviews = await Promise.all(
                      files.map((file) => createImagePreview(file))
                    );
                    setDeliveryProofPreviews([...deliveryProofPreviews, ...newPreviews]);
                  }}
                />
              </div>

              {(pickupProofFiles.length > 0 || deliveryProofFiles.length > 0) && (
                <Button
                  onClick={async () => {
                    if (pickupProofFiles.length === 0 && deliveryProofFiles.length === 0) {
                      setProofImageError('Please select at least one proof image');
                      return;
                    }

                    setUploadingProofImages(true);
                    setProofImageError(null);
                    setProofImageSuccess(null);

                    try {
                      // Upload all proof images
                      const allFiles = [...pickupProofFiles, ...deliveryProofFiles];
                      const allImageUrls = await uploadProofImages(allFiles);

                      // Separate into pickup and delivery
                      const pickupProofUrls = allImageUrls.slice(0, pickupProofFiles.length);
                      const deliveryProofUrls = allImageUrls.slice(pickupProofFiles.length);

                      // Add proof images to booking
                      const updatedBooking = await companyApi.addProofImagesToBooking(bookingId, {
                        pickupProofImages: pickupProofUrls.length > 0 ? pickupProofUrls : undefined,
                        deliveryProofImages: deliveryProofUrls.length > 0 ? deliveryProofUrls : undefined,
                      });

                      setBooking(updatedBooking);
                      setPickupProofFiles([]);
                      setPickupProofPreviews([]);
                      setDeliveryProofFiles([]);
                      setDeliveryProofPreviews([]);
                      setProofImageSuccess('Proof images uploaded successfully!');
                      setTimeout(() => setProofImageSuccess(null), 5000);
                    } catch (error: any) {
                      console.error('Failed to upload proof images:', error);
                      setProofImageError(error.message || 'Failed to upload proof images. Please try again.');
                    } finally {
                      setUploadingProofImages(false);
                    }
                  }}
                  disabled={uploadingProofImages || (pickupProofFiles.length === 0 && deliveryProofFiles.length === 0)}
                >
                  {uploadingProofImages ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    'Upload Proof Images'
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

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

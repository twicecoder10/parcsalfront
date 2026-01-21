'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Package, PoundSterling, User, Mail, CheckCircle2, XCircle, Loader2, ArrowLeft, CreditCard, Truck, Printer, RefreshCw, MessageSquare, Eye } from 'lucide-react';
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
import { companyApi, getCustomerName, getCustomerEmail, getBookingPrice } from '@/lib/company-api';
import type { Booking } from '@/lib/company-api';
import { getErrorMessage } from '@/lib/api';
import { uploadProofImages, createImagePreview, MAX_PROOF_IMAGES, MAX_FILE_SIZE, ALLOWED_IMAGE_TYPES, validateImageFile } from '@/lib/upload-api';
import { X, Upload } from 'lucide-react';
import { usePermissions, canPerformAction } from '@/lib/permissions';
import { toast } from '@/lib/toast';
import { CompanyExtraChargesList } from '@/components/extra-charges/CompanyExtraChargesList';
import { chatApi } from '@/lib/chat-api';

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
  const permissions = usePermissions();
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
      toast.success('Booking accepted successfully');
    } catch (error: any) {
      console.error('Failed to accept booking:', error);
      toast.error(getErrorMessage(error) || 'Failed to accept booking. Please try again.');
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
      toast.success('Booking rejected successfully');
    } catch (error: any) {
      console.error('Failed to reject booking:', error);
      toast.error(getErrorMessage(error) || 'Failed to reject booking. Please try again.');
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
      toast.success('Booking status updated successfully');
    } catch (error: any) {
      console.error('Failed to update booking status:', error);
      toast.error(getErrorMessage(error) || 'Failed to update booking status. Please try again.');
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
      const errorMessage = getErrorMessage(error) || 'Failed to get label. Please try again.';
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
      const errorMessage = getErrorMessage(error) || 'Failed to regenerate label. Please try again.';
      setLabelError(errorMessage);
      // Show error for a few seconds
      setTimeout(() => setLabelError(null), 5000);
    } finally {
      setRegeneratingLabel(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
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

  const canAccept = booking.status === 'PENDING' && canPerformAction(permissions, 'acceptBooking');
  const canReject = booking.status === 'PENDING' && canPerformAction(permissions, 'rejectBooking');
  const canMarkInTransit = booking.status === 'ACCEPTED' && canPerformAction(permissions, 'updateBookingStatus');
  const canMarkDelivered = booking.status === 'IN_TRANSIT' && canPerformAction(permissions, 'updateBookingStatus');
  const canAddProofImages = canPerformAction(permissions, 'addProofImages');
  const canRegenerateLabel = canPerformAction(permissions, 'regenerateLabel');
  const canCreateExtraCharge = canPerformAction(permissions, 'createExtraCharge');
  const canCancelExtraCharge = canPerformAction(permissions, 'cancelExtraCharge');

  // Handle message customer
  const handleMessageCustomer = async () => {
    if (!booking) return;
    
    try {
      // Try to find existing chat room for this booking
      const roomsResponse = await chatApi.getChatRooms({ limit: 100 });
      const existingRoom = roomsResponse.data.find((room) => room.bookingId === booking.id);
      
      if (existingRoom) {
        // Navigate to existing chat room
        router.push(`/company/chat?roomId=${existingRoom.id}`);
      } else {
        // Navigate to chat page with booking ID and customer ID - it will create a room when first message is sent
        router.push(`/company/chat?bookingId=${booking.id}&customerId=${booking.customer.id}`);
      }
    } catch (error) {
      console.error('Failed to get chat room:', error);
      // Navigate anyway - chat page will handle creation
      router.push(`/company/chat?bookingId=${booking.id}&customerId=${booking.customer.id}`);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <Link href="/company/bookings">
          <Button variant="ghost" size="sm" className="w-fit">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Booking Details</h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">Booking #{booking.id}</p>
        </div>
      </div>

      {/* Status & Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Status</CardTitle>
            <Badge className={statusColors[booking.status] || ''}>
              {booking.status.replace('_', ' ')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {canAccept && (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button onClick={handleAccept} disabled={processing} className="w-full sm:w-auto">
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
                  <Button variant="destructive" disabled={processing} className="w-full sm:w-auto">
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
            <Button onClick={() => handleUpdateStatus('IN_TRANSIT')} disabled={processing} className="w-full sm:w-auto">
              Mark as In Transit
            </Button>
          )}
          {canMarkDelivered && (
            <Button onClick={() => handleUpdateStatus('DELIVERED')} disabled={processing} className="w-full sm:w-auto">
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
      {['ACCEPTED', 'IN_TRANSIT', 'DELIVERED'].includes(booking.status) && booking.paymentStatus === 'PAID' && (
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
            
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                {booking.labelUrl && (
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
                )}
                {canRegenerateLabel && (
                  <>
                    {!booking.labelUrl ? (
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
                            Regenerate
                          </>
                        )}
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
            
            {booking.labelUrl && (
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600 mb-2">Label Preview</p>
                <div className="border rounded-lg overflow-hidden">
                  <iframe
                    src={booking.labelUrl}
                    className="w-full h-80 sm:h-96"
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
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="rounded-full bg-orange-100 p-2">
                <User className="h-5 w-5 text-orange-600" />
              </div>
                      <div className="flex-1">
                        <p className="font-medium">{getCustomerName(booking.customer)}</p>
                        {getCustomerEmail(booking.customer) && (
                          <div className="flex flex-col gap-2 mt-1 sm:flex-row sm:items-center sm:gap-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Mail className="h-4 w-4" />
                              <a href={`mailto:${getCustomerEmail(booking.customer)}`} className="hover:text-orange-600">
                                {getCustomerEmail(booking.customer)}
                              </a>
                            </div>
                          </div>
                        )}
                        <div className="mt-3">
                          <Button
                            onClick={handleMessageCustomer}
                            variant="outline"
                            size="sm"
                            className="w-full sm:w-auto"
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Message Customer
                          </Button>
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
                  <Button variant="outline" size="sm" className="w-full sm:w-auto">
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
            <PoundSterling className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium">Price</p>
              <p className="text-sm text-gray-600">£{getBookingPrice(booking)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warehouse Information */}
      {(booking.pickupWarehouse || booking.deliveryWarehouse) && (
        <Card>
          <CardHeader>
            <CardTitle>Warehouse Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {booking.pickupWarehouse && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-blue-600" />
                  <p className="font-medium">Pickup Warehouse</p>
                </div>
                <div className="pl-7 space-y-1">
                  <p className="font-semibold text-gray-900">{booking.pickupWarehouse.name}</p>
                  <p className="text-sm text-gray-600">
                    {booking.pickupWarehouse.address}
                  </p>
                  <p className="text-sm text-gray-600">
                    {booking.pickupWarehouse.city}, {booking.pickupWarehouse.state} {booking.pickupWarehouse.postalCode}
                  </p>
                  <p className="text-sm text-gray-600">
                    {booking.pickupWarehouse.country}
                  </p>
                  {booking.pickupMethod && (
                    <p className="text-sm text-gray-500 mt-2">
                      Method: {booking.pickupMethod === 'DROP_OFF_AT_COMPANY'
                        ? 'Customer drops off at warehouse'
                        : 'Company picks up from customer'}
                    </p>
                  )}
                </div>
              </div>
            )}
            {booking.deliveryWarehouse && (
              <div className="space-y-2 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-green-600" />
                  <p className="font-medium">Delivery Warehouse</p>
                </div>
                <div className="pl-7 space-y-1">
                  <p className="font-semibold text-gray-900">{booking.deliveryWarehouse.name}</p>
                  <p className="text-sm text-gray-600">
                    {booking.deliveryWarehouse.address}
                  </p>
                  <p className="text-sm text-gray-600">
                    {booking.deliveryWarehouse.city}, {booking.deliveryWarehouse.state} {booking.deliveryWarehouse.postalCode}
                  </p>
                  <p className="text-sm text-gray-600">
                    {booking.deliveryWarehouse.country}
                  </p>
                  {booking.deliveryMethod && (
                    <p className="text-sm text-gray-500 mt-2">
                      Method: {booking.deliveryMethod === 'RECEIVER_PICKS_UP'
                        ? 'Receiver picks up from warehouse'
                        : 'Company delivers to receiver'}
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
                <PoundSterling className="h-5 w-5 text-green-600" />
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
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
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

      {/* Extra Charges */}
      <CompanyExtraChargesList
        bookingId={bookingId}
        onRefresh={fetchBooking}
        canCreate={canCreateExtraCharge}
        canCancel={canCancelExtraCharge}
      />

      {/* Payment Information */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Payment Information</CardTitle>
            <Badge className={booking.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' : booking.paymentStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : booking.paymentStatus === 'FAILED' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}>
              {booking.paymentStatus || 'PENDING'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">Total Amount</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">
                  £{(() => {
                    // Use payment amount if payment exists and is paid
                    if (booking.payment?.amount && booking.paymentStatus === 'PAID') {
                      return parseFloat(String(booking.payment.amount)).toFixed(2);
                    }
                    // Use totalAmount (in cents) if available
                    if (booking.totalAmount) {
                      return (booking.totalAmount / 100).toFixed(2);
                    }
                    // Fallback to calculatedPrice or price
                    const price = getBookingPrice(booking);
                    if (price) {
                      return parseFloat(String(price)).toFixed(2);
                    }
                    // Last resort fallback
                    return '0.00';
                  })()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-gray-400" />
              </div>
            </div>
            
            {booking.paymentStatus === 'PENDING' && (
              <div className="pt-2 border-t">
                <p className="text-sm text-yellow-700">
                  Payment is pending. The customer will need to complete payment to confirm this booking.
                </p>
              </div>
            )}
            {booking.paymentStatus === 'FAILED' && (
              <div className="pt-2 border-t">
                <p className="text-sm text-red-700">
                  Payment failed. The customer will need to retry payment.
                </p>
              </div>
            )}
            
            {booking.payment?.id && (
              <div className="pt-4 border-t">
                <Link href={`/company/payments/${booking.payment.id}`}>
                  <Button variant="outline" className="w-full">
                    <Eye className="h-4 w-4 mr-2" />
                    View Full Payment Details
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Proof Images Section */}
      {booking.status !== 'CANCELLED' && booking.status !== 'REJECTED' && canAddProofImages && (
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
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
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
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
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
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
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
                  accept={ALLOWED_IMAGE_TYPES.join(',')}
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
                      const validation = validateImageFile(file);
                      if (!validation.valid) {
                        setProofImageError(validation.error || 'Invalid image file');
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
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
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
                  accept={ALLOWED_IMAGE_TYPES.join(',')}
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
                      const validation = validateImageFile(file);
                      if (!validation.valid) {
                        setProofImageError(validation.error || 'Invalid image file');
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
                <p className="text-xs text-gray-500">
                  Max {MAX_PROOF_IMAGES} images total, {MAX_FILE_SIZE / (1024 * 1024)}MB per file. Supported formats: JPEG, JPG, PNG, WebP, GIF
                </p>
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
                      setProofImageError(getErrorMessage(error) || 'Failed to upload proof images. Please try again.');
                    } finally {
                      setUploadingProofImages(false);
                    }
                  }}
                  disabled={uploadingProofImages || (pickupProofFiles.length === 0 && deliveryProofFiles.length === 0)}
                  className="w-full sm:w-auto"
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
              <div key={index} className="flex items-start gap-4">
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
          <div className="grid gap-4 text-sm md:grid-cols-2">
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

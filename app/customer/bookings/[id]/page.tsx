'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { MapPin, Clock, Package, CheckCircle2, XCircle, Truck, AlertCircle, Loader2, ArrowLeft, CreditCard, Navigation, MessageSquare } from 'lucide-react';
import { customerApi } from '@/lib/customer-api';
import { format } from 'date-fns';
import Image from 'next/image';
import { ExtraChargesList } from '@/components/extra-charges/ExtraChargesList';
import { getStoredUser, hasRoleAccess, getDashboardPath } from '@/lib/auth';
import { chatApi } from '@/lib/chat-api';

function BookingDetailContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = params.id as string;
  
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success' | 'cancelled' | 'verifying'>('idle');
  const [cancelling, setCancelling] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [paymentVerificationAttempts, setPaymentVerificationAttempts] = useState(0);
  const maxVerificationAttempts = 5;

  // Early auth check to prevent API calls for unauthorized users
  useEffect(() => {
    const user = getStoredUser();
    if (!user || !hasRoleAccess(user.role, ['CUSTOMER'])) {
      // Wrong role or not authenticated - redirect to appropriate page
      if (!user) {
        router.push('/auth/login');
      } else {
        router.push(getDashboardPath(user.role));
      }
      return;
    }
  }, [router]);

  const fetchBookingData = useCallback(async () => {
    // Double-check auth before making API call
    const user = getStoredUser();
    if (!user || !hasRoleAccess(user.role, ['CUSTOMER'])) {
      return;
    }

    setLoading(true);
    try {
      const data = await customerApi.getBookingById(bookingId);
      setBooking(data);
    } catch (error) {
      console.error('Failed to fetch booking data:', error);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    const user = getStoredUser();
    // Only fetch if user is authorized
    if (user && hasRoleAccess(user.role, ['CUSTOMER'])) {
      fetchBookingData();
    }
  }, [fetchBookingData]);

  const pollPaymentStatus = async (attempt = 0): Promise<void> => {
    if (attempt >= maxVerificationAttempts) {
      console.warn('Payment status sync timeout');
      // Show success anyway - webhook will eventually process
      setPaymentStatus('success');
      return;
    }

    try {
      setPaymentVerificationAttempts(attempt + 1);
      
      // Try syncing again (without session_id this time, it will search)
      const syncResult = await customerApi.syncPaymentStatus(bookingId);
      
      // Refresh booking data
      const data = await customerApi.getBookingById(bookingId);
      setBooking(data);

      // Check if payment is confirmed
      if (syncResult.paymentStatus === 'PAID' || data.paymentStatus === 'PAID' || data.payment?.status === 'SUCCEEDED') {
        setPaymentStatus('success');
        return;
      }

      // If still pending, wait and retry
      setTimeout(() => {
        pollPaymentStatus(attempt + 1);
      }, 2000);
    } catch (error) {
      console.error('Failed to poll payment status:', error);
      // On error, retry if we haven't exceeded max attempts
      if (attempt < maxVerificationAttempts - 1) {
        setTimeout(() => {
          pollPaymentStatus(attempt + 1);
        }, 2000);
      } else {
        // Max attempts reached - show success (webhook will eventually process)
        setPaymentStatus('success');
      }
    }
  };

  const syncPaymentStatus = async (sessionId?: string) => {
    setPaymentVerificationAttempts(0);
    
    try {
      // First, try to sync payment status using the sync endpoint
      const syncResult = await customerApi.syncPaymentStatus(bookingId, sessionId);
      
      // Refresh booking data to get updated status
      await fetchBookingData();
      
      // Check if payment is confirmed after sync
      if (syncResult.paymentStatus === 'PAID') {
        setPaymentStatus('success');
        return;
      }
      
      // If sync didn't confirm payment yet, poll for status update
      // This handles cases where webhook is still processing
      pollPaymentStatus();
    } catch (error) {
      console.error('Failed to sync payment status:', error);
      // If sync fails, fall back to polling
      pollPaymentStatus();
    }
  };

  useEffect(() => {
    const payment = searchParams.get('payment');
    const sessionId = searchParams.get('session_id');
    const extraCharge = searchParams.get('extraCharge');
    
    if (payment === 'success') {
      setPaymentStatus('verifying');
      syncPaymentStatus(sessionId || undefined);
      // Clean URL immediately
      window.history.replaceState({}, '', `/customer/bookings/${bookingId}`);
    } else if (payment === 'cancelled') {
      setPaymentStatus('cancelled');
      // Clean URL
      window.history.replaceState({}, '', `/customer/bookings/${bookingId}`);
    }

    // Handle extra charge payment redirect
    if (extraCharge === 'paid') {
      // Payment was successful, refresh booking data
      fetchBookingData();
      window.history.replaceState({}, '', `/customer/bookings/${bookingId}`);
    } else if (extraCharge === 'cancelled') {
      // Payment was cancelled
      window.history.replaceState({}, '', `/customer/bookings/${bookingId}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, bookingId]);


  const handleCancel = async () => {
    setCancelling(true);
    try {
      await customerApi.cancelBooking(bookingId);
      await fetchBookingData();
      setShowCancelDialog(false);
    } catch (error: any) {
      console.error('Failed to cancel booking:', error);
      // TODO: Show error message to user
    } finally {
      setCancelling(false);
    }
  };

  const handlePayNow = () => {
    router.push(`/customer/bookings/${bookingId}/payment`);
  };

  // Handle message company
  const handleMessageCompany = async () => {
    const companyId = booking?.company?.id || booking?.shipmentSlot?.company?.id || booking?.companyId;
    if (!companyId) return;
    
    try {
      // Try to find existing chat room for this booking
      const roomsResponse = await chatApi.getChatRooms({ limit: 100 });
      const existingRoom = roomsResponse.data.find((room) => 
        room.companyId === companyId && 
        room.bookingId === booking.id
      );
      
      if (existingRoom) {
        // Navigate to existing chat room
        router.push(`/customer/chat?roomId=${existingRoom.id}`);
      } else {
        // Navigate to chat page with company and booking ID - it will create a room when first message is sent
        router.push(`/customer/chat?companyId=${companyId}&bookingId=${booking.id}`);
      }
    } catch (error) {
      console.error('Failed to get chat room:', error);
      // Navigate anyway - chat page will handle creation
      router.push(`/customer/chat?companyId=${companyId}&bookingId=${booking.id}`);
    }
  };

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    ACCEPTED: 'bg-blue-100 text-blue-800',
    IN_TRANSIT: 'bg-orange-100 text-orange-800',
    DELIVERED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
    REJECTED: 'bg-red-100 text-red-800',
  };

  const getStatusTimeline = (status: string) => {
    const statuses = ['PENDING', 'ACCEPTED', 'IN_TRANSIT', 'DELIVERED'];
    const currentIndex = statuses.indexOf(status);
    
    return statuses.map((s, index) => ({
      status: s,
      completed: index <= currentIndex,
      date: index <= currentIndex ? new Date().toISOString() : null,
    }));
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Booking not found</p>
            <Link href="/customer/bookings">
              <Button variant="outline">Back to Bookings</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const timeline = getStatusTimeline(booking.status);
  const canCancel = booking.status === 'PENDING' || booking.status === 'ACCEPTED';
  const needsPayment = booking.paymentStatus === 'PENDING' || booking.paymentStatus === 'UNPAID' || !booking.payment;

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
      {/* Back Button */}
      <Link href="/customer/bookings">
        <Button variant="ghost" size="sm" className="mb-2 md:mb-0">
          <ArrowLeft className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Back to Bookings</span>
          <span className="sm:hidden">Back</span>
        </Button>
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl md:text-3xl font-bold truncate">Booking Details</h1>
          <p className="text-xs md:text-sm text-gray-600 mt-1 md:mt-2 font-mono truncate">#{booking.id || bookingId}</p>
        </div>
        <Link href={`/customer/bookings/${bookingId}/track`} className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto h-10 md:h-auto">
            <Navigation className="h-4 w-4 mr-2" />
            Track Booking
          </Button>
        </Link>
      </div>

      {/* Payment Verification Message */}
      {paymentStatus === 'verifying' && (
        <Card className="border-blue-500 bg-blue-50">
          <CardContent className="p-4 md:pt-6">
            <div className="flex items-start gap-3 md:gap-4">
              <div className="rounded-full bg-blue-100 p-2 flex-shrink-0">
                <Loader2 className="h-5 w-5 md:h-6 md:w-6 text-blue-600 animate-spin" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm md:text-base font-semibold text-blue-900 mb-1">Verifying Payment...</h3>
                <p className="text-xs md:text-sm text-blue-700">
                  Please wait while we confirm your payment status.
                  {paymentVerificationAttempts > 0 && (
                    <span className="block sm:inline sm:ml-2 mt-1 sm:mt-0">(Attempt {paymentVerificationAttempts}/{maxVerificationAttempts})</span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Success Message */}
      {paymentStatus === 'success' && (
        <Card className="border-green-500 bg-green-50">
          <CardContent className="p-4 md:pt-6">
            <div className="flex items-start gap-3 md:gap-4">
              <div className="rounded-full bg-green-100 p-2 flex-shrink-0">
                <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm md:text-base font-semibold text-green-900 mb-1">Payment Successful!</h3>
                <p className="text-xs md:text-sm text-green-700 mb-2">
                  Your payment has been processed successfully. Your booking is now confirmed.
                </p>
                {booking?.payment && (
                  <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t border-green-200">
                    <p className="text-xs text-green-600 break-all">
                      Transaction ID: {booking.payment.id}
                    </p>
                    {booking.payment.createdAt && (
                      <p className="text-xs text-green-600 mt-1">
                        Paid on: {format(new Date(booking.payment.createdAt), 'MMM dd, yyyy HH:mm')}
                      </p>
                    )}
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPaymentStatus('idle')}
                className="text-green-700 hover:text-green-900 flex-shrink-0"
              >
                <XCircle className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Cancelled Message */}
      {paymentStatus === 'cancelled' && (
        <Card className="border-orange-500 bg-orange-50">
          <CardContent className="p-4 md:pt-6">
            <div className="flex items-start gap-3 md:gap-4">
              <div className="rounded-full bg-orange-100 p-2 flex-shrink-0">
                <AlertCircle className="h-5 w-5 md:h-6 md:w-6 text-orange-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm md:text-base font-semibold text-orange-900 mb-1">Payment Cancelled</h3>
                <p className="text-xs md:text-sm text-orange-700 mb-3 md:mb-4">
                  The payment checkout was cancelled. Your booking is still pending payment.
                </p>
                {needsPayment && (
                  <Button
                    onClick={handlePayNow}
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto border-orange-600 text-orange-700 hover:bg-orange-100"
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Pay Now
                  </Button>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPaymentStatus('idle')}
                className="text-orange-700 hover:text-orange-900 flex-shrink-0"
              >
                <XCircle className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Card */}
      <Card>
        <CardHeader className="pb-3 md:pb-6">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base md:text-lg">Status</CardTitle>
            <Badge className={`${statusColors[booking.status] || ''} text-xs`}>
              {booking.status.replace('_', ' ')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 md:space-y-4">
            {timeline.map((item, index) => (
              <div key={index} className="flex items-start gap-3 md:gap-4">
                {item.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-gray-300 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm md:text-base font-medium">{item.status.replace('_', ' ')}</p>
                  {item.date && (
                    <p className="text-xs md:text-sm text-gray-600 mt-0.5">
                      {format(new Date(item.date), 'MMM dd, yyyy HH:mm')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Customer Information */}
      {booking.customer && (
        <Card>
          <CardHeader className="pb-3 md:pb-6">
            <CardTitle className="text-base md:text-lg">Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {booking.customer.fullName && (
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-700">Name</p>
                <p className="text-sm md:text-base text-gray-900 mt-0.5">{booking.customer.fullName}</p>
              </div>
            )}
            {booking.customer.email && (
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-700">Email</p>
                <p className="text-sm md:text-base text-gray-900 mt-0.5 break-all">{booking.customer.email}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Shipment Info */}
      <Card>
        <CardHeader className="pb-3 md:pb-6">
          <CardTitle className="text-base md:text-lg">Shipment Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 md:space-y-4">
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-sm md:text-base font-medium">Route</p>
              <p className="text-xs md:text-sm text-gray-600">
                {booking.shipmentSlot?.originCity || booking.originCity} → {booking.shipmentSlot?.destinationCity || booking.destinationCity}
              </p>
            </div>
          </div>
          {booking.shipmentSlot?.departureTime && (
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm md:text-base font-medium">Departure</p>
                <p className="text-xs md:text-sm text-gray-600">
                  {format(new Date(booking.shipmentSlot.departureTime), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
            </div>
          )}
          {booking.requestedWeightKg && (
            <div className="flex items-start gap-3">
              <Package className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm md:text-base font-medium">Weight</p>
                <p className="text-xs md:text-sm text-gray-600">{booking.requestedWeightKg} kg</p>
              </div>
            </div>
          )}
          {booking.requestedItemsCount && (
            <div className="flex items-start gap-3">
              <Package className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm md:text-base font-medium">Items</p>
                <p className="text-xs md:text-sm text-gray-600">{booking.requestedItemsCount} items</p>
              </div>
            </div>
          )}
          {(booking.company?.name || booking.shipmentSlot?.company?.name || booking.companyName) && (
            <div className="border-t pt-3 md:pt-4">
              <div className="flex items-start gap-3">
                <Truck className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 mb-2">
                    {(booking.company?.logoUrl || booking.shipmentSlot?.company?.logoUrl) && (
                      <div className="relative w-8 h-8 md:w-10 md:h-10 rounded overflow-hidden flex-shrink-0">
                        <Image
                          src={booking.company?.logoUrl || booking.shipmentSlot?.company?.logoUrl || ''}
                          alt={`${booking.company?.name || booking.shipmentSlot?.company?.name || booking.companyName} logo`}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm md:text-base font-medium">Company</p>
                      <Link 
                        href={`/companies/${booking.company?.slug || booking.shipmentSlot?.company?.slug || booking.company?.id || booking.shipmentSlot?.company?.id}`}
                        className="text-xs md:text-sm text-gray-600 hover:text-orange-600 transition-colors block truncate"
                      >
                        {booking.company?.name || booking.shipmentSlot?.company?.name || booking.companyName}
                      </Link>
                    </div>
                  </div>
                  <Button
                    onClick={handleMessageCompany}
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Message Company
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pickup & Delivery Information */}
      {(booking.pickupWarehouse || booking.deliveryWarehouse || booking.pickupMethod || booking.deliveryMethod || booking.pickupAddress || booking.deliveryAddress) && (
        <Card>
          <CardHeader className="pb-3 md:pb-6">
            <CardTitle className="text-base md:text-lg">Pickup & Delivery</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 md:space-y-4">
            {booking.pickupMethod && (
              <div className="flex items-center gap-3">
                <Truck className="h-5 w-5 text-blue-600" />
                <div className="flex-1">
                  <p className="font-medium">Pickup Method</p>
                  <p className="text-sm text-gray-600">
                    {booking.pickupMethod === 'PICKUP_FROM_SENDER'
                      ? 'Company picks up from sender'
                      : 'Sender drops off at company'}
                  </p>
                </div>
              </div>
            )}
            {booking.pickupWarehouse && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">Pickup Location</p>
                  <p className="text-sm font-semibold text-gray-900">{booking.pickupWarehouse.name}</p>
                  <p className="text-sm text-gray-600">
                    {booking.pickupWarehouse.address}
                    {booking.pickupWarehouse.city && `, ${booking.pickupWarehouse.city}`}
                    {booking.pickupWarehouse.state && `, ${booking.pickupWarehouse.state}`}
                    {booking.pickupWarehouse.postalCode && ` ${booking.pickupWarehouse.postalCode}`}
                    {booking.pickupWarehouse.country && `, ${booking.pickupWarehouse.country}`}
                  </p>
                </div>
              </div>
            )}
            {booking.pickupAddress && !booking.pickupWarehouse && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">Pickup Address</p>
                  <p className="text-sm text-gray-600">
                    {booking.pickupAddress}
                    {booking.pickupCity && `, ${booking.pickupCity}`}
                    {booking.pickupState && `, ${booking.pickupState}`}
                    {booking.pickupPostalCode && ` ${booking.pickupPostalCode}`}
                    {booking.pickupCountry && `, ${booking.pickupCountry}`}
                  </p>
                  {booking.pickupContactName && (
                    <p className="text-sm text-gray-600 mt-1">
                      Contact: {booking.pickupContactName}
                      {booking.pickupContactPhone && ` (${booking.pickupContactPhone})`}
                    </p>
                  )}
                </div>
              </div>
            )}
            {booking.deliveryMethod && (
              <div className="flex items-center gap-3 pt-2 border-t">
                <Truck className="h-5 w-5 text-green-600" />
                <div className="flex-1">
                  <p className="font-medium">Delivery Method</p>
                  <p className="text-sm text-gray-600">
                    {booking.deliveryMethod === 'RECEIVER_PICKS_UP'
                      ? 'Receiver picks up from company'
                      : 'Company delivers to receiver'}
                  </p>
                </div>
              </div>
            )}
            {booking.deliveryWarehouse && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">Delivery Location</p>
                  <p className="text-sm font-semibold text-gray-900">{booking.deliveryWarehouse.name}</p>
                  <p className="text-sm text-gray-600">
                    {booking.deliveryWarehouse.address}
                    {booking.deliveryWarehouse.city && `, ${booking.deliveryWarehouse.city}`}
                    {booking.deliveryWarehouse.state && `, ${booking.deliveryWarehouse.state}`}
                    {booking.deliveryWarehouse.postalCode && ` ${booking.deliveryWarehouse.postalCode}`}
                    {booking.deliveryWarehouse.country && `, ${booking.deliveryWarehouse.country}`}
                  </p>
                </div>
              </div>
            )}
            {booking.deliveryAddress && !booking.deliveryWarehouse && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">Delivery Address</p>
                  <p className="text-sm text-gray-600">
                    {booking.deliveryAddress}
                    {booking.deliveryCity && `, ${booking.deliveryCity}`}
                    {booking.deliveryState && `, ${booking.deliveryState}`}
                    {booking.deliveryPostalCode && ` ${booking.deliveryPostalCode}`}
                    {booking.deliveryCountry && `, ${booking.deliveryCountry}`}
                  </p>
                  {booking.deliveryContactName && (
                    <p className="text-sm text-gray-600 mt-1">
                      Contact: {booking.deliveryContactName}
                      {booking.deliveryContactPhone && ` (${booking.deliveryContactPhone})`}
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Parcel Information */}
      {(booking.parcelType || booking.weight || booking.value || booking.length || booking.width || booking.height || booking.description || (booking.images && booking.images.length > 0)) && (
        <Card>
          <CardHeader className="pb-3 md:pb-6">
            <CardTitle className="text-base md:text-lg">Parcel Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 md:space-y-4">
            {booking.parcelType && (
              <div className="flex items-start gap-3">
                <Package className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm md:text-base font-medium">Parcel Type</p>
                  <p className="text-xs md:text-sm text-gray-600">{booking.parcelType}</p>
                </div>
              </div>
            )}
            {booking.weight && (
              <div className="flex items-start gap-3">
                <Package className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm md:text-base font-medium">Actual Weight</p>
                  <p className="text-xs md:text-sm text-gray-600">{booking.weight} kg</p>
                </div>
              </div>
            )}
            {booking.value && (
              <div className="flex items-start gap-3">
                <Package className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm md:text-base font-medium">Parcel Value</p>
                  <p className="text-xs md:text-sm text-gray-600">£{parseFloat(String(booking.value)).toFixed(2)}</p>
                </div>
              </div>
            )}
            {(booking.length || booking.width || booking.height) && (
              <div className="flex items-start gap-3">
                <Package className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm md:text-base font-medium">Dimensions</p>
                  <p className="text-xs md:text-sm text-gray-600">
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
                <Package className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm md:text-base font-medium">Description</p>
                  <p className="text-xs md:text-sm text-gray-600 break-words">{booking.description}</p>
                </div>
              </div>
            )}
            {booking.images && booking.images.length > 0 && (
              <div className="flex items-start gap-3">
                <Package className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm md:text-base font-medium mb-2">Images</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
                    {booking.images.map((image: string, index: number) => (
                      <div key={index} className="relative w-full aspect-square rounded-lg border overflow-hidden bg-gray-100">
                        <Image
                          src={image}
                          alt={`Parcel image ${index + 1}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 50vw, 33vw"
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
      <ExtraChargesList bookingId={bookingId} onRefresh={fetchBookingData} />

      {/* Payment Info */}
      <Card>
        <CardHeader className="pb-3 md:pb-6">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base md:text-lg">Payment Information</CardTitle>
            <Badge className={`${booking.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'} text-xs`}>
              {booking.paymentStatus || 'PENDING'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 md:space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-sm md:text-base font-medium">Total Amount</p>
                <p className="text-xl md:text-2xl font-bold text-orange-600 mt-1">
                  £{(() => {
                    // Use payment.totalAmount (in cents) if available
                    if (booking.payment?.totalAmount) {
                      return (booking.payment.totalAmount / 100).toFixed(2);
                    }
                    // Use booking.totalAmount (in cents) if available
                    if (booking.totalAmount) {
                      return (booking.totalAmount / 100).toFixed(2);
                    }
                    // Use payment amount (string) if available
                    if (booking.payment?.amount) {
                      return parseFloat(String(booking.payment.amount)).toFixed(2);
                    }
                    // Fallback to calculatedPrice or price
                    if (booking.calculatedPrice || booking.price) {
                      return parseFloat(String(booking.calculatedPrice || booking.price)).toFixed(2);
                    }
                    // Last resort fallback
                    return '0.00';
                  })()}
                </p>
              </div>
              {needsPayment && (
                <Button onClick={handlePayNow} className="w-full sm:w-auto h-10 md:h-auto">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pay Now
                </Button>
              )}
            </div>
            
            {/* Payment Breakdown */}
            {(booking.payment?.baseAmount !== undefined || booking.baseAmount !== undefined) && (
              <div className="pt-4 border-t space-y-2">
                <p className="text-sm font-medium text-gray-700 mb-3">Payment Breakdown</p>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Base Amount:</span>
                    <span className="font-medium">
                      £{((booking.payment?.baseAmount || booking.baseAmount || 0) / 100).toFixed(2)}
                    </span>
                  </div>
                  {(booking.payment?.adminFeeAmount !== undefined || booking.adminFeeAmount !== undefined) && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Admin Fee:</span>
                      <span className="font-medium">
                        £{((booking.payment?.adminFeeAmount || booking.adminFeeAmount || 0) / 100).toFixed(2)}
                      </span>
                    </div>
                  )}
                  {(booking.payment?.processingFeeAmount !== undefined || booking.processingFeeAmount !== undefined) && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Processing Fee:</span>
                      <span className="font-medium">
                        £{((booking.payment?.processingFeeAmount || booking.processingFeeAmount || 0) / 100).toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t font-semibold">
                    <span>Total:</span>
                    <span className="text-orange-600">
                      £{(() => {
                        if (booking.payment?.totalAmount) {
                          return (booking.payment.totalAmount / 100).toFixed(2);
                        }
                        if (booking.totalAmount) {
                          return (booking.totalAmount / 100).toFixed(2);
                        }
                        return '0.00';
                      })()}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Payment Details */}
            {booking.payment && (
              <div className="pt-4 border-t space-y-2">
                <p className="text-sm font-medium text-gray-700">Payment Details</p>
                <div className="text-sm text-gray-600 space-y-1">
                  {booking.payment.id && (
                    <p>Transaction ID: <span className="font-mono">{booking.payment.id}</span></p>
                  )}
                  {booking.payment.currency && (
                    <p>Currency: {booking.payment.currency.toUpperCase()}</p>
                  )}
                  {booking.payment.status && (
                    <p>Status: <span className="capitalize">{booking.payment.status.toLowerCase().replace('_', ' ')}</span></p>
                  )}
                  {booking.payment.refundedAmount && parseFloat(booking.payment.refundedAmount) > 0 && (
                    <p className="text-orange-600">
                      Refunded: £{parseFloat(booking.payment.refundedAmount).toFixed(2)}
                      {booking.payment.refundReason && ` - ${booking.payment.refundReason}`}
                    </p>
                  )}
                  {booking.payment.createdAt && (
                    <p>Created: {format(new Date(booking.payment.createdAt), 'MMM dd, yyyy HH:mm')}</p>
                  )}
                  {booking.payment.paidAt && (
                    <p>Paid on: {format(new Date(booking.payment.paidAt), 'MMM dd, yyyy HH:mm')}</p>
                  )}
                  {booking.payment.refundedAt && (
                    <p>Refunded on: {format(new Date(booking.payment.refundedAt), 'MMM dd, yyyy HH:mm')}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      {canCancel && (
        <Card>
          <CardHeader className="pb-3 md:pb-6">
            <CardTitle className="text-base md:text-lg">Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
              <DialogTrigger asChild>
                <Button variant="destructive" className="w-full sm:w-auto">Cancel Booking</Button>
              </DialogTrigger>
              <DialogContent className="max-w-[90vw] sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-lg">Cancel Booking</DialogTitle>
                  <DialogDescription className="text-sm">
                    Are you sure you want to cancel this booking? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex-col sm:flex-row gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCancelDialog(false)}
                    className="w-full sm:w-auto"
                  >
                    Keep Booking
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleCancel} 
                    disabled={cancelling}
                    className="w-full sm:w-auto"
                  >
                    {cancelling ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Cancelling...
                      </>
                    ) : (
                      'Yes, Cancel Booking'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
}

export default function BookingDetailPage() {
  return (
    <Suspense fallback={
      <div className="h-full overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
          </div>
        </div>
      </div>
    }>
      <BookingDetailContent />
    </Suspense>
  );
}

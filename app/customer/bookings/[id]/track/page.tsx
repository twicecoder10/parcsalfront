'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Package, CheckCircle2, Truck, AlertCircle, Loader2, ArrowLeft, Navigation, Map, Phone, Mail, Plane, Ship, Train, Bus, Bike } from 'lucide-react';
import { customerApi } from '@/lib/customer-api';
import { getErrorMessage } from '@/lib/api';
import { format } from 'date-fns';
import Image from 'next/image';

function TrackContent() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;
  
  const [trackingData, setTrackingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrackingData = useCallback(async () => {
    try {
      setError(null);
      const data = await customerApi.getBookingTrack(bookingId);
      setTrackingData(data);
    } catch (err: any) {
      console.error('Failed to fetch tracking data:', err);
      setError(getErrorMessage(err) || 'Failed to load tracking information');
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    fetchTrackingData();
  }, [fetchTrackingData]);

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    ACCEPTED: 'bg-blue-100 text-blue-800',
    IN_TRANSIT: 'bg-orange-100 text-orange-800',
    DELIVERED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
    REJECTED: 'bg-red-100 text-red-800',
    DELAYED: 'bg-red-100 text-red-800',
    ARRIVED_AT_DESTINATION: 'bg-blue-100 text-blue-800',
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'ACCEPTED':
        return <CheckCircle2 className="h-5 w-5 text-blue-600" />;
      case 'IN_TRANSIT':
        return <Truck className="h-5 w-5 text-orange-600" />;
      case 'DELIVERED':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'DELAYED':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'ARRIVED_AT_DESTINATION':
        return <MapPin className="h-5 w-5 text-blue-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'AIR':
        return <Plane className="h-4 w-4" />;
      case 'SHIP':
        return <Ship className="h-4 w-4" />;
      case 'TRAIN':
        return <Train className="h-4 w-4" />;
      case 'BUS':
        return <Bus className="h-4 w-4" />;
      case 'VAN':
        return <Truck className="h-4 w-4" />;
      case 'RIDER':
        return <Bike className="h-4 w-4" />;
      default:
        return <Truck className="h-4 w-4" />;
    }
  };

  const getStatusTimeline = (bookingStatus: string, trackingStatus: string) => {
    // Booking status timeline
    const bookingStatuses = ['PENDING', 'ACCEPTED', 'IN_TRANSIT', 'DELIVERED'];
    const bookingIndex = bookingStatuses.indexOf(bookingStatus);
    
    // Tracking status timeline (more detailed)
    const trackingStatuses = ['PENDING', 'IN_TRANSIT', 'ARRIVED_AT_DESTINATION', 'DELIVERED'];
    const trackingIndex = trackingStatuses.indexOf(trackingStatus);
    
    // Combine both timelines, prioritizing tracking status when available
    const allStatuses = trackingStatus !== bookingStatus && trackingStatus !== 'PENDING' 
      ? [...bookingStatuses.slice(0, 2), ...trackingStatuses.slice(1)]
      : bookingStatuses;
    
    const currentStatus = trackingStatus !== 'PENDING' ? trackingStatus : bookingStatus;
    const currentIndex = allStatuses.indexOf(currentStatus);
    
    return allStatuses.map((s, index) => {
      const isCompleted = index <= currentIndex;
      return {
        status: s,
        completed: isCompleted,
        isDelayed: s === 'IN_TRANSIT' && trackingStatus === 'DELAYED',
      };
    });
  };

  if (loading && !trackingData) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
        </div>
      </div>
    );
  }

  if (error && !trackingData) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Link href={`/customer/bookings/${bookingId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Booking
          </Button>
        </Link>
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchTrackingData} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!trackingData) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Link href={`/customer/bookings/${bookingId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Booking
          </Button>
        </Link>
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No tracking information available</p>
            <Link href="/customer/bookings">
              <Button variant="outline">Back to Bookings</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Extract data from API response structure
  const booking = trackingData.booking || trackingData || {};
  const shipment = trackingData.shipment || {};
  const company = trackingData.company || {};
  
  // Use trackingStatus from shipment, fallback to booking status
  const trackingStatus = shipment.trackingStatus || booking.status || 'PENDING';
  const bookingStatus = booking.status || 'PENDING';
  
  const timeline = getStatusTimeline(bookingStatus, trackingStatus);
  const currentStatus = trackingStatus;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back Button */}
      <div className="flex items-center justify-between">
        <Link href={`/customer/bookings/${bookingId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Booking
          </Button>
        </Link>
        <Button variant="outline" size="sm" onClick={fetchTrackingData} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Refreshing...
            </>
          ) : (
            'Refresh'
          )}
        </Button>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Track Booking</h1>
          <p className="text-gray-600 mt-2">Booking #{booking.id || bookingId}</p>
        </div>
        {company.logoUrl && (
          <div className="flex items-center gap-3">
            {company.logoUrl && (
              <div className="relative w-12 h-12 rounded-lg overflow-hidden border">
                <Image
                  src={company.logoUrl}
                  alt={`${company.name} logo`}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-700">{company.name}</p>
              {company.slug && (
                <Link 
                  href={`/companies/${company.slug}`}
                  className="text-xs text-orange-600 hover:text-orange-700"
                >
                  View Company
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Current Status Card */}
      <Card className={`border-2 ${
        currentStatus === 'DELIVERED' ? 'border-green-200 bg-green-50/30' :
        currentStatus === 'IN_TRANSIT' ? 'border-orange-200 bg-orange-50/30' :
        currentStatus === 'ACCEPTED' ? 'border-blue-200 bg-blue-50/30' :
        'border-yellow-200 bg-yellow-50/30'
      }`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              <div className={`rounded-full p-2 ${
                currentStatus === 'DELIVERED' ? 'bg-green-100 text-green-600' :
                currentStatus === 'IN_TRANSIT' ? 'bg-orange-100 text-orange-600' :
                currentStatus === 'ACCEPTED' ? 'bg-blue-100 text-blue-600' :
                'bg-yellow-100 text-yellow-600'
              }`}>
                {getStatusIcon(currentStatus)}
              </div>
              <div>
                <p className="text-sm text-gray-600">Current Status</p>
                <p className="text-2xl font-bold">{currentStatus?.replace(/_/g, ' ') || 'Unknown'}</p>
              </div>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge className={statusColors[currentStatus] || ''} variant="outline">
                {currentStatus?.replace(/_/g, ' ') || 'Unknown'}
              </Badge>
              {booking.paymentStatus && (
                <Badge className={
                  booking.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' :
                  booking.paymentStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }>
                  Payment: {booking.paymentStatus}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {trackingStatus === 'DELAYED' && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <p className="font-medium text-red-900">Shipment Delayed</p>
              </div>
              <p className="text-sm text-red-700 mt-1">
                Your shipment is experiencing delays. We&apos;ll keep you updated.
              </p>
            </div>
          )}
          {trackingStatus === 'ARRIVED_AT_DESTINATION' && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                <p className="font-medium text-blue-900">Arrived at Destination</p>
              </div>
              <p className="text-sm text-blue-700 mt-1">
                Your shipment has arrived and is being prepared for delivery.
              </p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {booking.updatedAt && (
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                <Clock className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-xs font-medium text-gray-500">Last Update</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {format(new Date(booking.updatedAt), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
              </div>
            )}
            {booking.createdAt && (
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                <Clock className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-xs font-medium text-gray-500">Booking Created</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {format(new Date(booking.createdAt), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tracking Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5 text-orange-600" />
            Tracking Timeline
          </CardTitle>
          <CardDescription>Track the progress of your shipment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Vertical Timeline Line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200">
              <div 
                className="absolute top-0 w-full bg-gradient-to-b from-orange-500 to-orange-300 transition-all duration-500"
                style={{
                  height: `${(timeline.findIndex(item => !item.completed) === -1 ? timeline.length : timeline.findIndex(item => !item.completed)) * (100 / timeline.length)}%`
                }}
              />
            </div>

            {/* Timeline Items */}
            <div className="space-y-8 relative">
              {timeline.map((item, index) => {
                const isActive = item.completed;
                const isCurrent = index === timeline.findIndex(i => !i.completed) - 1 && isActive;
                
                return (
                  <div key={index} className="flex items-start gap-6 relative">
                    {/* Timeline Icon */}
                    <div className="relative z-10">
                      <div
                        className={`relative rounded-full p-3 transition-all duration-300 ${
                          isActive
                            ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/50 scale-110'
                            : 'bg-white border-2 border-gray-300 text-gray-400'
                        }`}
                      >
                        {getStatusIcon(item.status)}
                        {isActive && (
                          <div className="absolute inset-0 rounded-full bg-orange-500 animate-ping opacity-20" />
                        )}
                      </div>
                      {isCurrent && (
                        <div className="absolute -inset-1 rounded-full bg-orange-200 animate-pulse" />
                      )}
                    </div>

                    {/* Timeline Content */}
                    <div className="flex-1 pt-1 pb-8">
                      <div className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                        isActive
                          ? 'bg-orange-50 border-orange-200 shadow-sm'
                          : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className={`font-bold text-lg ${
                            isActive ? 'text-gray-900' : 'text-gray-500'
                          }`}>
                            {item.status.replace(/_/g, ' ')}
                          </h3>
                          {isActive && (
                            <Badge className="bg-orange-100 text-orange-800 border-orange-300">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Completed
                            </Badge>
                          )}
                          {!isActive && (
                            <Badge variant="outline" className="text-gray-400">
                              Pending
                            </Badge>
                          )}
                        </div>
                        
                        {item.isDelayed && (
                          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded mb-2">
                            <AlertCircle className="h-4 w-4" />
                            <span className="font-medium">Delayed</span>
                          </div>
                        )}
                        
                        {isActive && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                            <Clock className="h-4 w-4" />
                            <span>
                              {item.status === 'DELIVERED' && booking.updatedAt
                                ? `Delivered on ${format(new Date(booking.updatedAt), 'MMM dd, yyyy HH:mm')}`
                                : item.status === 'IN_TRANSIT'
                                ? 'In transit'
                                : item.status === 'ACCEPTED'
                                ? 'Accepted and confirmed'
                                : 'Completed'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Route Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5 text-orange-600" />
            Route & Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Origin */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-green-100 p-2 mt-0.5">
                  <MapPin className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Origin</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">
                    {shipment.originCity || 'N/A'}
                  </p>
                  {shipment.originCountry && (
                    <p className="text-sm text-gray-600">{shipment.originCountry}</p>
                  )}
                </div>
              </div>
              {shipment.departureTime && (
                <div className="flex items-center gap-3 pl-11">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-500">Departure</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {format(new Date(shipment.departureTime), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Destination */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-red-100 p-2 mt-0.5">
                  <MapPin className="h-5 w-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Destination</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">
                    {shipment.destinationCity || 'N/A'}
                  </p>
                  {shipment.destinationCountry && (
                    <p className="text-sm text-gray-600">{shipment.destinationCountry}</p>
                  )}
                </div>
              </div>
              {shipment.arrivalTime && (
                <div className="flex items-center gap-3 pl-11">
                  <Clock className="h-4 w-4 text-purple-600" />
                  <div>
                    <p className="text-xs text-gray-500">
                      {trackingStatus === 'DELIVERED' ? 'Arrival' : 'Estimated Arrival'}
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {format(new Date(shipment.arrivalTime), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Transport Mode & Cutoff */}
          <div className="mt-6 pt-6 border-t grid grid-cols-1 md:grid-cols-2 gap-4">
            {shipment.mode && (
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-purple-100 p-2">
                  {getModeIcon(shipment.mode)}
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">Transport Mode</p>
                  <p className="text-sm font-semibold text-gray-900">{shipment.mode}</p>
                </div>
              </div>
            )}
            {shipment.cutoffTimeForReceivingItems && (
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-xs font-medium text-gray-500">Cutoff Time</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {format(new Date(shipment.cutoffTimeForReceivingItems), 'MMM dd, yyyy HH:mm')}
                  </p>
                  {new Date(shipment.cutoffTimeForReceivingItems) < new Date() && (
                    <p className="text-xs text-red-600 mt-0.5">Past cutoff time</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Company Information */}
      {company.name && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-orange-600" />
              Shipping Company
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {company.logoUrl && (
                <div className="relative w-16 h-16 rounded-lg overflow-hidden border flex-shrink-0">
                  <Image
                    src={company.logoUrl}
                    alt={`${company.name} logo`}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
              )}
              <div className="flex-1">
                <Link 
                  href={`/companies/${company.slug || company.id || 'unknown'}`}
                  className="text-xl font-bold hover:text-orange-600 transition-colors"
                >
                  {company.name}
                </Link>
                {company.slug && (
                  <p className="text-sm text-gray-500 mt-1">@{company.slug}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Booking Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-orange-600" />
            Booking Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {booking.requestedWeightKg && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Package className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-xs font-medium text-gray-500">Requested Weight</p>
                  <p className="text-sm font-semibold text-gray-900">{booking.requestedWeightKg} kg</p>
                </div>
              </div>
            )}
            {booking.requestedItemsCount && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Package className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-xs font-medium text-gray-500">Requested Items</p>
                  <p className="text-sm font-semibold text-gray-900">{booking.requestedItemsCount} items</p>
                </div>
              </div>
            )}
            {booking.parcelType && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Package className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-xs font-medium text-gray-500">Parcel Type</p>
                  <p className="text-sm font-semibold text-gray-900">{booking.parcelType}</p>
                </div>
              </div>
            )}
            {booking.calculatedPrice && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Package className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-xs font-medium text-gray-500">Price</p>
                  <p className="text-sm font-semibold text-gray-900">
                    £{parseFloat(String(booking.calculatedPrice)).toFixed(2)}
                  </p>
                </div>
              </div>
            )}
          </div>
          {(booking.pickupMethod || booking.deliveryMethod) && (
            <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4">
              {booking.pickupMethod && (
                <div className="flex items-center gap-3">
                  <Truck className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-xs font-medium text-gray-500">Pickup Method</p>
                    <p className="text-sm font-semibold text-gray-900">
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
                    <p className="text-xs font-medium text-gray-500">Delivery Method</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {booking.deliveryMethod === 'RECEIVER_PICKS_UP'
                        ? 'Receiver picks up from company'
                        : 'Company delivers to receiver'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Parcel Information */}
      {(booking.weight || booking.value || booking.length || booking.width || booking.height || booking.description || (booking.images && booking.images.length > 0)) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-orange-600" />
              Parcel Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {booking.weight && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Package className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-xs font-medium text-gray-500">Actual Weight</p>
                    <p className="text-sm font-semibold text-gray-900">{booking.weight} kg</p>
                  </div>
                </div>
              )}
              {booking.value && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Package className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-xs font-medium text-gray-500">Parcel Value</p>
                    <p className="text-sm font-semibold text-gray-900">£{parseFloat(String(booking.value)).toFixed(2)}</p>
                  </div>
                </div>
              )}
              {(booking.length || booking.width || booking.height) && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg md:col-span-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-xs font-medium text-gray-500">Dimensions</p>
                    <p className="text-sm font-semibold text-gray-900">
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
            </div>
            {booking.description && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs font-medium text-gray-500 mb-2">Description</p>
                <p className="text-sm text-gray-700">{booking.description}</p>
              </div>
            )}
            {booking.images && booking.images.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs font-medium text-gray-500 mb-3">Parcel Images</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {booking.images.map((image: string, index: number) => (
                    <div key={index} className="relative w-full h-32 rounded-lg border overflow-hidden">
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
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
        </div>
      </div>
    }>
      <TrackContent />
    </Suspense>
  );
}


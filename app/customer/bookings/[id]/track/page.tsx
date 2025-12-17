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
  const booking = trackingData.booking || {};
  const shipment = trackingData.shipment || {};
  const company = trackingData.company || {};
  
  // Use trackingStatus from shipment, fallback to booking status
  const trackingStatus = shipment.trackingStatus || booking.status || 'PENDING';
  const bookingStatus = booking.status || 'PENDING';
  
  const timeline = getStatusTimeline(bookingStatus, trackingStatus);
  const currentStatus = trackingStatus;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <div className="flex items-center justify-between">
        <Link href={`/customer/bookings/${bookingId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Booking
          </Button>
        </Link>
        <Button variant="outline" size="sm" onClick={fetchTrackingData}>
          Refresh
        </Button>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Track Booking</h1>
        <p className="text-gray-600 mt-2">Booking #{booking.id || bookingId}</p>
      </div>

      {/* Current Status Card */}
      <Card className="border-2 border-orange-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(currentStatus)}
              Current Status
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge className={statusColors[currentStatus] || ''}>
                {currentStatus?.replace(/_/g, ' ') || 'Unknown'}
              </Badge>
              {trackingStatus === 'DELAYED' && (
                <Badge className="bg-red-100 text-red-800">
                  DELAYED
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {trackingStatus === 'DELAYED' && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
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
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                <p className="font-medium text-blue-900">Arrived at Destination</p>
              </div>
              <p className="text-sm text-blue-700 mt-1">
                Your shipment has arrived and is being prepared for delivery.
              </p>
            </div>
          )}
          {booking.updatedAt && (
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium">Last Update</p>
                <p className="text-sm text-gray-600">
                  {format(new Date(booking.updatedAt), 'MMM dd, yyyy HH:mm:ss')}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tracking Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Tracking Timeline</CardTitle>
          <CardDescription>Track the progress of your shipment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {timeline.map((item, index) => (
              <div key={index} className="flex items-start gap-4">
                {/* Timeline Line */}
                <div className="flex flex-col items-center">
                  <div
                    className={`rounded-full p-2 ${
                      item.completed
                        ? 'bg-orange-100 text-orange-600'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {getStatusIcon(item.status)}
                  </div>
                  {index < timeline.length - 1 && (
                    <div
                      className={`w-0.5 h-full min-h-[60px] ${
                        item.completed ? 'bg-orange-200' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>

                {/* Timeline Content */}
                <div className="flex-1 pb-6">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-lg">
                      {item.status.replace(/_/g, ' ')}
                    </h3>
                  </div>
                  {item.isDelayed && (
                    <div className="flex items-center gap-2 text-sm text-red-600 mb-1">
                      <AlertCircle className="h-4 w-4" />
                      <span>Delayed</span>
                    </div>
                  )}
                  {!item.completed && (
                    <p className="text-sm text-gray-400 italic">Pending</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Route Information */}
      <Card>
        <CardHeader>
          <CardTitle>Route Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium">Origin</p>
              <p className="text-sm text-gray-600">
                {shipment.originCity || 'N/A'}
                {shipment.originCountry && `, ${shipment.originCountry}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-red-600" />
            <div>
              <p className="font-medium">Destination</p>
              <p className="text-sm text-gray-600">
                {shipment.destinationCity || 'N/A'}
                {shipment.destinationCountry && `, ${shipment.destinationCountry}`}
              </p>
            </div>
          </div>
          {shipment.mode && (
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 text-purple-600">
                {getModeIcon(shipment.mode)}
              </div>
              <div>
                <p className="font-medium">Transport Mode</p>
                <p className="text-sm text-gray-600">{shipment.mode}</p>
              </div>
            </div>
          )}
          {shipment.departureTime && (
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium">Departure Time</p>
                <p className="text-sm text-gray-600">
                  {format(new Date(shipment.departureTime), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
            </div>
          )}
          {shipment.arrivalTime && (
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-purple-600" />
              <div>
                <p className="font-medium">
                  {trackingStatus === 'DELIVERED' ? 'Arrival Time' : 'Estimated Arrival'}
                </p>
                <p className="text-sm text-gray-600">
                  {format(new Date(shipment.arrivalTime), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
            </div>
          )}
          {shipment.cutoffTimeForReceivingItems && (
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-medium">Cutoff Time</p>
                <p className="text-sm text-gray-600">
                  {format(new Date(shipment.cutoffTimeForReceivingItems), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Company Information */}
      {company.name && (
        <Card>
          <CardHeader>
            <CardTitle>Shipping Company</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Truck className="h-5 w-5 text-green-600" />
              <div className="flex items-center gap-2 flex-1">
                {company.logoUrl && (
                  <div className="relative w-8 h-8 rounded overflow-hidden flex-shrink-0">
                    <Image
                      src={company.logoUrl}
                      alt={`${company.name} logo`}
                      fill
                      className="object-cover"
                      sizes="32px"
                    />
                  </div>
                )}
                <div>
                  <Link 
                    href={`/companies/${company.slug || company.id || 'unknown'}`}
                    className="font-medium hover:text-orange-600 transition-colors"
                  >
                    {company.name}
                  </Link>
                  {company.slug && (
                    <p className="text-sm text-gray-500">{company.slug}</p>
                  )}
                </div>
              </div>
            </div>
            {company.contactPhone && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">Phone</p>
                  <a href={`tel:${company.contactPhone}`} className="text-sm text-gray-600 hover:text-orange-600">
                    {company.contactPhone}
                  </a>
                </div>
              </div>
            )}
            {company.contactEmail && (
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">Email</p>
                  <a href={`mailto:${company.contactEmail}`} className="text-sm text-gray-600 hover:text-orange-600">
                    {company.contactEmail}
                  </a>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Booking Details */}
      <Card>
        <CardHeader>
          <CardTitle>Booking Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {booking.requestedWeightKg && (
            <div className="flex items-center gap-3">
              <Package className="h-5 w-5 text-purple-600" />
              <div>
                <p className="font-medium">Requested Weight</p>
                <p className="text-sm text-gray-600">{booking.requestedWeightKg} kg</p>
              </div>
            </div>
          )}
          {booking.requestedItemsCount && (
            <div className="flex items-center gap-3">
              <Package className="h-5 w-5 text-purple-600" />
              <div>
                <p className="font-medium">Requested Items</p>
                <p className="text-sm text-gray-600">{booking.requestedItemsCount} items</p>
              </div>
            </div>
          )}
          {booking.createdAt && (
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-gray-600" />
              <div>
                <p className="font-medium">Booking Created</p>
                <p className="text-sm text-gray-600">
                  {format(new Date(booking.createdAt), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
            </div>
          )}
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
                <Package className="h-5 w-5 text-green-600" />
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


'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Package, CheckCircle2, Truck, AlertCircle, Loader2, Search, Plane, Ship, Train, Bus, Bike } from 'lucide-react';
import { publicApi } from '@/lib/api';
import { format } from 'date-fns';
import { Navbar } from '@/components/navbar';

function TrackContent() {
  const searchParams = useSearchParams();
  const bookingIdFromUrl = searchParams.get('id') || '';
  
  const [bookingId, setBookingId] = useState(bookingIdFromUrl);
  const [trackingData, setTrackingData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!bookingId.trim()) {
      setError('Please enter a booking ID');
      return;
    }

    setLoading(true);
    setError(null);
    setSearched(true);
    
    try {
      const data = await publicApi.getBookingTrack(bookingId.trim());
      setTrackingData(data);
    } catch (err: any) {
      console.error('Failed to fetch tracking data:', err);
      setError(err.message || 'Failed to load tracking information. Please check the booking ID and try again.');
      setTrackingData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

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
    const bookingStatuses = ['PENDING', 'ACCEPTED', 'IN_TRANSIT', 'DELIVERED'];
    const bookingIndex = bookingStatuses.indexOf(bookingStatus);
    
    const trackingStatuses = ['PENDING', 'IN_TRANSIT', 'ARRIVED_AT_DESTINATION', 'DELIVERED'];
    const trackingIndex = trackingStatuses.indexOf(trackingStatus);
    
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

  // Auto-search if booking ID is in URL
  useEffect(() => {
    if (bookingIdFromUrl && !searched && !trackingData) {
      handleSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold">Track Your Shipment</h1>
            <p className="text-gray-600 mt-2">Enter your booking ID to track your shipment status</p>
          </div>

          {/* Search Form */}
          <Card>
            <CardHeader>
              <CardTitle>Enter Booking ID</CardTitle>
              <CardDescription>Find your booking ID in your confirmation email</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter booking ID (e.g., abc123def456)"
                  value={bookingId}
                  onChange={(e) => setBookingId(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                />
                <Button onClick={handleSearch} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Track
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Loading State */}
          {loading && !trackingData && (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
              </CardContent>
            </Card>
          )}

          {/* Error State */}
          {error && !trackingData && searched && (
            <Card>
              <CardContent className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">{error}</p>
                <Button onClick={handleSearch} variant="outline">
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Tracking Results */}
          {trackingData && (
            <>
              {/* Current Status Card */}
              <Card className="border-2 border-orange-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {getStatusIcon(trackingData.shipment?.trackingStatus || trackingData.booking?.status || 'PENDING')}
                      Current Status
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className={statusColors[trackingData.shipment?.trackingStatus || trackingData.booking?.status || 'PENDING'] || ''}>
                        {(trackingData.shipment?.trackingStatus || trackingData.booking?.status || 'PENDING')?.replace(/_/g, ' ')}
                      </Badge>
                      {trackingData.shipment?.trackingStatus === 'DELAYED' && (
                        <Badge className="bg-red-100 text-red-800">
                          DELAYED
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {trackingData.shipment?.trackingStatus === 'DELAYED' && (
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
                  {trackingData.shipment?.trackingStatus === 'ARRIVED_AT_DESTINATION' && (
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
                  {trackingData.booking?.updatedAt && (
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium">Last Update</p>
                        <p className="text-sm text-gray-600">
                          {format(new Date(trackingData.booking.updatedAt), 'MMM dd, yyyy HH:mm:ss')}
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
                    {getStatusTimeline(
                      trackingData.booking?.status || 'PENDING',
                      trackingData.shipment?.trackingStatus || trackingData.booking?.status || 'PENDING'
                    ).map((item, index, timeline) => (
                      <div key={index} className="flex items-start gap-4">
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
                        {trackingData.shipment?.originCity || 'N/A'}
                        {trackingData.shipment?.originCountry && `, ${trackingData.shipment.originCountry}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="font-medium">Destination</p>
                      <p className="text-sm text-gray-600">
                        {trackingData.shipment?.destinationCity || 'N/A'}
                        {trackingData.shipment?.destinationCountry && `, ${trackingData.shipment.destinationCountry}`}
                      </p>
                    </div>
                  </div>
                  {trackingData.shipment?.mode && (
                    <div className="flex items-center gap-3">
                      <div className="h-5 w-5 text-purple-600">
                        {getModeIcon(trackingData.shipment.mode)}
                      </div>
                      <div>
                        <p className="font-medium">Transport Mode</p>
                        <p className="text-sm text-gray-600">{trackingData.shipment.mode}</p>
                      </div>
                    </div>
                  )}
                  {trackingData.shipment?.departureTime && (
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium">Departure Time</p>
                        <p className="text-sm text-gray-600">
                          {format(new Date(trackingData.shipment.departureTime), 'MMM dd, yyyy HH:mm')}
                        </p>
                      </div>
                    </div>
                  )}
                  {trackingData.shipment?.arrivalTime && (
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-purple-600" />
                      <div>
                        <p className="font-medium">
                          {trackingData.shipment?.trackingStatus === 'DELIVERED' ? 'Arrival Time' : 'Estimated Arrival'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {format(new Date(trackingData.shipment.arrivalTime), 'MMM dd, yyyy HH:mm')}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Company Information */}
              {trackingData.company?.name && (
                <Card>
                  <CardHeader>
                    <CardTitle>Shipping Company</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <Truck className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium">{trackingData.company.name}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Booking Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Booking Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="font-medium">Booking ID</p>
                      <p className="text-sm text-gray-600 font-mono">{trackingData.booking?.id || bookingId}</p>
                    </div>
                  </div>
                  {trackingData.booking?.requestedWeightKg && (
                    <div className="flex items-center gap-3">
                      <Package className="h-5 w-5 text-purple-600" />
                      <div>
                        <p className="font-medium">Weight</p>
                        <p className="text-sm text-gray-600">{trackingData.booking.requestedWeightKg} kg</p>
                      </div>
                    </div>
                  )}
                  {trackingData.booking?.requestedItemsCount && (
                    <div className="flex items-center gap-3">
                      <Package className="h-5 w-5 text-purple-600" />
                      <div>
                        <p className="font-medium">Items</p>
                        <p className="text-sm text-gray-600">{trackingData.booking.requestedItemsCount} items</p>
                      </div>
                    </div>
                  )}
                  {trackingData.booking?.createdAt && (
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-gray-600" />
                      <div>
                        <p className="font-medium">Booking Created</p>
                        <p className="text-sm text-gray-600">
                          {format(new Date(trackingData.booking.createdAt), 'MMM dd, yyyy HH:mm')}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center min-h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
            </div>
          </div>
        </main>
      </div>
    }>
      <TrackContent />
    </Suspense>
  );
}


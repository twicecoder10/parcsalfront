'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
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
      <main className="flex-1 container mx-auto px-4 py-6 md:py-8 pt-16 md:pt-20">
        <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Track Your Shipment</h1>
            <p className="text-sm md:text-base text-gray-600 mt-1 md:mt-2">Enter your booking ID to track your shipment status</p>
          </div>

          {/* Search Form */}
          <Card>
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-base md:text-lg">Enter Booking ID</CardTitle>
              <CardDescription className="text-xs md:text-sm">Find your booking ID in your confirmation email</CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0">
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  placeholder="Enter booking ID (e.g., BKG-...)"
                  value={bookingId}
                  onChange={(e) => setBookingId(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 text-sm md:text-base"
                />
                <Button onClick={handleSearch} disabled={loading} className="w-full sm:w-auto">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin sm:mr-2" />
                      <span className="hidden sm:inline">Searching...</span>
                      <span className="sm:hidden">Searching...</span>
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Track</span>
                      <span className="sm:hidden">Track Shipment</span>
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Loading State */}
          {loading && !trackingData && (
            <Card>
              <CardContent className="flex items-center justify-center py-10 md:py-12">
                <Loader2 className="h-6 w-6 md:h-8 md:w-8 animate-spin text-orange-600" />
              </CardContent>
            </Card>
          )}

          {/* Error State */}
          {error && !trackingData && searched && (
            <Card>
              <CardContent className="text-center py-10 md:py-12 px-4">
                <AlertCircle className="h-10 w-10 md:h-12 md:w-12 text-red-400 mx-auto mb-3 md:mb-4" />
                <p className="text-sm md:text-base text-gray-600 mb-4 break-words">{error}</p>
                <Button onClick={handleSearch} variant="outline" className="w-full sm:w-auto">
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
                <CardHeader className="p-4 md:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                      {getStatusIcon(trackingData.shipment?.trackingStatus || trackingData.booking?.status || 'PENDING')}
                      Current Status
                    </CardTitle>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={`text-xs ${statusColors[trackingData.shipment?.trackingStatus || trackingData.booking?.status || 'PENDING'] || ''}`}>
                        {(trackingData.shipment?.trackingStatus || trackingData.booking?.status || 'PENDING')?.replace(/_/g, ' ')}
                      </Badge>
                      {trackingData.shipment?.trackingStatus === 'DELAYED' && (
                        <Badge className="bg-red-100 text-red-800 text-xs">
                          DELAYED
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 md:p-6 pt-0">
                  {trackingData.shipment?.trackingStatus === 'DELAYED' && (
                    <div className="mb-3 md:mb-4 p-2.5 md:p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-red-600 flex-shrink-0" />
                        <p className="font-medium text-sm md:text-base text-red-900">Shipment Delayed</p>
                      </div>
                      <p className="text-xs md:text-sm text-red-700 mt-1">
                        Your shipment is experiencing delays. We&apos;ll keep you updated.
                      </p>
                    </div>
                  )}
                  {trackingData.shipment?.trackingStatus === 'ARRIVED_AT_DESTINATION' && (
                    <div className="mb-3 md:mb-4 p-2.5 md:p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 md:h-5 md:w-5 text-blue-600 flex-shrink-0" />
                        <p className="font-medium text-sm md:text-base text-blue-900">Arrived at Destination</p>
                      </div>
                      <p className="text-xs md:text-sm text-blue-700 mt-1">
                        Your shipment has arrived and is being prepared for delivery.
                      </p>
                    </div>
                  )}
                  {trackingData.booking?.updatedAt && (
                    <div className="flex items-center gap-2 md:gap-3">
                      <Clock className="h-4 w-4 md:h-5 md:w-5 text-blue-600 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-sm md:text-base">Last Update</p>
                        <p className="text-xs md:text-sm text-gray-600 truncate">
                          {format(new Date(trackingData.booking.updatedAt), 'MMM dd, yyyy HH:mm:ss')}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tracking Timeline */}
              <Card>
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="text-base md:text-lg">Tracking Timeline</CardTitle>
                  <CardDescription className="text-xs md:text-sm">Track the progress of your shipment</CardDescription>
                </CardHeader>
                <CardContent className="p-4 md:p-6 pt-0">
                  <div className="space-y-4 md:space-y-6">
                    {getStatusTimeline(
                      trackingData.booking?.status || 'PENDING',
                      trackingData.shipment?.trackingStatus || trackingData.booking?.status || 'PENDING'
                    ).map((item, index, timeline) => (
                      <div key={index} className="flex items-start gap-3 md:gap-4">
                        <div className="flex flex-col items-center flex-shrink-0">
                          <div
                            className={`rounded-full p-1.5 md:p-2 ${
                              item.completed
                                ? 'bg-orange-100 text-orange-600'
                                : 'bg-gray-100 text-gray-400'
                            }`}
                          >
                            {getStatusIcon(item.status)}
                          </div>
                          {index < timeline.length - 1 && (
                            <div
                              className={`w-0.5 h-full min-h-[50px] md:min-h-[60px] ${
                                item.completed ? 'bg-orange-200' : 'bg-gray-200'
                              }`}
                            />
                          )}
                        </div>
                        <div className="flex-1 pb-4 md:pb-6 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold text-sm md:text-base lg:text-lg break-words">
                              {item.status.replace(/_/g, ' ')}
                            </h3>
                          </div>
                          {item.isDelayed && (
                            <div className="flex items-center gap-2 text-xs md:text-sm text-red-600 mb-1">
                              <AlertCircle className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                              <span>Delayed</span>
                            </div>
                          )}
                          {!item.completed && (
                            <p className="text-xs md:text-sm text-gray-400 italic">Pending</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Route Information */}
              <Card>
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="text-base md:text-lg">Route Information</CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-6 pt-0 space-y-3 md:space-y-4">
                  <div className="flex items-start gap-2 md:gap-3">
                    <MapPin className="h-4 w-4 md:h-5 md:w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm md:text-base">Origin</p>
                      <p className="text-xs md:text-sm text-gray-600 break-words">
                        {trackingData.shipment?.originCity || 'N/A'}
                        {trackingData.shipment?.originCountry && `, ${trackingData.shipment.originCountry}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 md:gap-3">
                    <MapPin className="h-4 w-4 md:h-5 md:w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm md:text-base">Destination</p>
                      <p className="text-xs md:text-sm text-gray-600 break-words">
                        {trackingData.shipment?.destinationCity || 'N/A'}
                        {trackingData.shipment?.destinationCountry && `, ${trackingData.shipment.destinationCountry}`}
                      </p>
                    </div>
                  </div>
                  {trackingData.shipment?.mode && (
                    <div className="flex items-start gap-2 md:gap-3">
                      <div className="h-4 w-4 md:h-5 md:w-5 text-purple-600 flex-shrink-0 mt-0.5">
                        {getModeIcon(trackingData.shipment.mode)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm md:text-base">Transport Mode</p>
                        <p className="text-xs md:text-sm text-gray-600">{trackingData.shipment.mode}</p>
                      </div>
                    </div>
                  )}
                  {trackingData.shipment?.departureTime && (
                    <div className="flex items-start gap-2 md:gap-3">
                      <Clock className="h-4 w-4 md:h-5 md:w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="font-medium text-sm md:text-base">Departure Time</p>
                        <p className="text-xs md:text-sm text-gray-600 break-words">
                          {format(new Date(trackingData.shipment.departureTime), 'MMM dd, yyyy HH:mm')}
                        </p>
                      </div>
                    </div>
                  )}
                  {trackingData.shipment?.arrivalTime && (
                    <div className="flex items-start gap-2 md:gap-3">
                      <Clock className="h-4 w-4 md:h-5 md:w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="font-medium text-sm md:text-base">
                          {trackingData.shipment?.trackingStatus === 'DELIVERED' ? 'Arrival Time' : 'Estimated Arrival'}
                        </p>
                        <p className="text-xs md:text-sm text-gray-600 break-words">
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
                  <CardHeader className="p-4 md:p-6">
                    <CardTitle className="text-base md:text-lg">Shipping Company</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 md:p-6 pt-0">
                    <div className="flex items-start gap-2 md:gap-3">
                      <Truck className="h-4 w-4 md:h-5 md:w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <Link 
                          href={`/companies/${trackingData.company.slug || trackingData.company.id || 'unknown'}`}
                          className="font-medium text-sm md:text-base hover:text-orange-600 transition-colors break-words"
                        >
                          {trackingData.company.name}
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Booking Details */}
              <Card>
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="text-base md:text-lg">Booking Details</CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-6 pt-0 space-y-3 md:space-y-4">
                  <div className="flex items-start gap-2 md:gap-3">
                    <Package className="h-4 w-4 md:h-5 md:w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm md:text-base">Booking ID</p>
                      <p className="text-xs md:text-sm text-gray-600 font-mono break-all">{trackingData.booking?.id || bookingId}</p>
                    </div>
                  </div>
                  {trackingData.booking?.requestedWeightKg && (
                    <div className="flex items-start gap-2 md:gap-3">
                      <Package className="h-4 w-4 md:h-5 md:w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="font-medium text-sm md:text-base">Weight</p>
                        <p className="text-xs md:text-sm text-gray-600">{trackingData.booking.requestedWeightKg} kg</p>
                      </div>
                    </div>
                  )}
                  {trackingData.booking?.requestedItemsCount && (
                    <div className="flex items-start gap-2 md:gap-3">
                      <Package className="h-4 w-4 md:h-5 md:w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="font-medium text-sm md:text-base">Items</p>
                        <p className="text-xs md:text-sm text-gray-600">{trackingData.booking.requestedItemsCount} items</p>
                      </div>
                    </div>
                  )}
                  {trackingData.booking?.createdAt && (
                    <div className="flex items-start gap-2 md:gap-3">
                      <Clock className="h-4 w-4 md:h-5 md:w-5 text-gray-600 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="font-medium text-sm md:text-base">Booking Created</p>
                        <p className="text-xs md:text-sm text-gray-600 break-words">
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
        <main className="flex-1 container mx-auto px-4 py-6 md:py-8 pt-16 md:pt-20">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center min-h-[300px] md:min-h-[400px]">
              <Loader2 className="h-6 w-6 md:h-8 md:w-8 animate-spin text-orange-600" />
            </div>
          </div>
        </main>
      </div>
    }>
      <TrackContent />
    </Suspense>
  );
}


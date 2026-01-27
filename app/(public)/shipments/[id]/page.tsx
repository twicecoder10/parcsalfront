'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Truck, Package, AlertCircle, Loader2, Lock, Share2, Check, ArrowLeft, Building2, Plane, Bus, Ship, Train, Bike, DollarSign, Calendar, CheckCircle2 } from 'lucide-react';
import { shipmentApi } from '@/lib/api';
import { getStoredUser, hasRoleAccess } from '@/lib/auth';
import { format } from 'date-fns';
import type { Shipment } from '@/lib/api-types';
import { Navbar } from '@/components/navbar';
import { CustomerHeader } from '@/components/customer-header';
import { Footer } from '@/components/footer';
import Image from 'next/image';

export default function PublicShipmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const shipmentId = params.id as string;
  
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCustomer, setIsCustomer] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  useEffect(() => {
    // Check authentication status
    const user = getStoredUser();
    const authenticated = !!user;
    const customer = authenticated && hasRoleAccess(user.role, ['CUSTOMER']);
    setIsAuthenticated(authenticated);
    setIsCustomer(customer);
    
    fetchShipment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shipmentId]);

  const fetchShipment = async () => {
    setLoading(true);
    try {
      const data = await shipmentApi.getById(shipmentId);
      setShipment(data);
    } catch (error) {
      console.error('Failed to fetch shipment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = () => {
    if (!isAuthenticated) {
      // Redirect to login with return URL
      router.push(`/auth/login?redirect=/shipments/${shipmentId}`);
      return;
    }
    
    if (!isCustomer) {
      // User is logged in but not a customer, redirect to appropriate dashboard
      router.push('/customer/dashboard');
      return;
    }
    
    // User is authenticated customer, redirect to customer detail page for booking
    router.push(`/customer/shipments/${shipmentId}`);
  };

  const handleShareShipment = async () => {
    const url = window.location.href;
    const shareData = {
      title: `Shipment: ${shipment?.originCity} → ${shipment?.destinationCity}`,
      text: `Check out this shipment slot from ${shipment?.originCity} to ${shipment?.destinationCity} on Parcsal`,
      url: url,
    };

    try {
      // Try Web Share API first (mobile-friendly)
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(url);
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
      }
    } catch (err) {
      // If share is cancelled or fails, fallback to clipboard
      if (err instanceof Error && err.name !== 'AbortError') {
        try {
          await navigator.clipboard.writeText(url);
          setCopiedUrl(true);
          setTimeout(() => setCopiedUrl(false), 2000);
        } catch (clipboardErr) {
          console.error('Failed to copy URL:', clipboardErr);
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        {isCustomer ? <CustomerHeader /> : <Navbar />}
        <main className="flex-1 container mx-auto px-4 pt-20 md:pt-24 pb-4 md:pb-8">
          <div className="max-w-6xl mx-auto flex items-center justify-center min-h-[300px] md:min-h-[400px]">
            <Loader2 className="h-6 w-6 md:h-8 md:w-8 animate-spin text-orange-600" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="min-h-screen flex flex-col">
        {isCustomer ? <CustomerHeader /> : <Navbar />}
        <main className="flex-1 container mx-auto px-4 pt-20 md:pt-24 pb-4 md:pb-8">
          <div className="max-w-6xl mx-auto">
            <Card>
              <CardContent className="text-center py-8 md:py-12">
                <AlertCircle className="h-10 w-10 md:h-12 md:w-12 text-gray-400 mx-auto mb-3 md:mb-4" />
                <p className="text-sm md:text-base text-gray-600">Slot not found</p>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const departureDate = new Date(shipment.departureTime);
  const arrivalDate = new Date(shipment.arrivalTime);
  const cutoffDate = new Date(shipment.cutoffTimeForReceivingItems);
  const isPastCutoff = cutoffDate < new Date();

  return (
    <div className="min-h-screen flex flex-col">
      {isCustomer ? <CustomerHeader /> : <Navbar />}
      <main className="flex-1 container mx-auto px-4 pt-20 md:pt-24 pb-4 md:pb-8">
        <div className="max-w-6xl mx-auto space-y-4 md:space-y-6">
          {/* Back Button */}
          <Link href="/">
            <Button variant="ghost" className="mb-2 md:mb-4 -ml-2">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 md:gap-4">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold leading-tight">
                {shipment.originCity} → {shipment.destinationCity}
              </h1>
              <p className="text-sm md:text-base text-gray-600 mt-1 md:mt-2">
                Departure: {format(departureDate, 'MMM dd, yyyy')} at {format(departureDate, 'HH:mm')}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShareShipment}
              className="flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              {copiedUrl ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4" />
                  Share
                </>
              )}
            </Button>
          </div>

          <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-4 md:space-y-6">
              {/* Route Info */}
              <Card>
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="text-lg md:text-xl">Route Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 md:space-y-4 p-4 md:p-6 pt-0">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 md:h-5 md:w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm md:text-base">Origin</p>
                      <p className="text-xs md:text-sm text-gray-600 truncate">
                        {shipment.originCity}, {shipment.originCountry}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 md:h-5 md:w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm md:text-base">Destination</p>
                      <p className="text-xs md:text-sm text-gray-600 truncate">
                        {shipment.destinationCity}, {shipment.destinationCountry}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 md:h-5 md:w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm md:text-base">Estimated Arrival</p>
                      <p className="text-xs md:text-sm text-gray-600">
                        {format(arrivalDate, 'MMM dd, yyyy')} at {format(arrivalDate, 'HH:mm')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    {shipment.mode === 'AIR' && <Plane className="h-4 w-4 md:h-5 md:w-5 text-purple-600 mt-0.5 flex-shrink-0" />}
                    {shipment.mode === 'BUS' && <Bus className="h-4 w-4 md:h-5 md:w-5 text-purple-600 mt-0.5 flex-shrink-0" />}
                    {shipment.mode === 'VAN' && <Truck className="h-4 w-4 md:h-5 md:w-5 text-purple-600 mt-0.5 flex-shrink-0" />}
                    {shipment.mode === 'TRAIN' && <Train className="h-4 w-4 md:h-5 md:w-5 text-purple-600 mt-0.5 flex-shrink-0" />}
                    {shipment.mode === 'SHIP' && <Ship className="h-4 w-4 md:h-5 md:w-5 text-purple-600 mt-0.5 flex-shrink-0" />}
                    {shipment.mode === 'RIDER' && <Bike className="h-4 w-4 md:h-5 md:w-5 text-purple-600 mt-0.5 flex-shrink-0" />}
                    {!['AIR', 'BUS', 'VAN', 'TRAIN', 'SHIP', 'RIDER'].includes(shipment.mode) && <Truck className="h-4 w-4 md:h-5 md:w-5 text-purple-600 mt-0.5 flex-shrink-0" />}
                    <div className="flex-1">
                      <p className="font-medium text-sm md:text-base">Transport Mode</p>
                      <Badge className="mt-1 text-xs">{shipment.mode}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Company Info */}
              <Card>
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="text-lg md:text-xl">Company Information</CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-6 pt-0">
                  <Link 
                    href={`/companies/${shipment.company.slug || shipment.company.id}`}
                    className="flex items-center gap-3 md:gap-4 hover:opacity-80 transition-opacity"
                  >
                    {shipment.company.logoUrl && (
                      <div className="relative w-12 h-12 md:w-16 md:h-16 rounded-lg overflow-hidden border flex-shrink-0">
                        <Image
                          src={shipment.company.logoUrl}
                          alt={`${shipment.company.name} logo`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 48px, 64px"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Building2 className="h-3.5 w-3.5 md:h-4 md:w-4 text-gray-500 flex-shrink-0" />
                        <span className="font-medium text-base md:text-lg hover:text-orange-600 transition-colors truncate">
                          {shipment.company.name}
                        </span>
                        {shipment.company.isVerified && (
                          <Badge variant="outline" className="text-xs flex-shrink-0">Verified</Badge>
                        )}
                      </div>
                      <p className="text-xs md:text-sm text-gray-500 mt-1">View company profile</p>
                    </div>
                  </Link>
                </CardContent>
              </Card>

              {/* Capacity & Status */}
              <Card>
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <Package className="h-4 w-4 md:h-5 md:w-5" />
                    Capacity & Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-6 pt-0">
                  <div className="space-y-3 md:space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2 gap-2">
                        <span className="text-xs md:text-sm text-gray-600 flex items-center gap-1.5 md:gap-2">
                          <Package className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0" />
                          <span className="truncate">Remaining capacity (kg)</span>
                        </span>
                        <span className="font-medium text-xs md:text-sm whitespace-nowrap">
                          {shipment.remainingCapacityKg} / {shipment.totalCapacityKg} kg
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-orange-600 h-2 rounded-full transition-all"
                          style={{
                            width: `${(shipment.remainingCapacityKg / shipment.totalCapacityKg) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                    {shipment.totalCapacityItems !== null && (
                      <div>
                        <div className="flex justify-between items-center mb-2 gap-2">
                          <span className="text-xs md:text-sm text-gray-600 flex items-center gap-1.5 md:gap-2">
                            <Package className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0" />
                            <span className="truncate">Remaining items</span>
                          </span>
                          <span className="font-medium text-xs md:text-sm whitespace-nowrap">
                            {shipment.remainingCapacityItems ?? 0} / {shipment.totalCapacityItems}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-orange-600 h-2 rounded-full transition-all"
                            style={{
                              width: `${((shipment.remainingCapacityItems ?? 0) / shipment.totalCapacityItems) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                    <div className="pt-2 md:pt-3 border-t">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs md:text-sm text-gray-600 flex items-center gap-1.5 md:gap-2">
                          {shipment.status === 'PUBLISHED' ? (
                            <CheckCircle2 className="h-3.5 w-3.5 md:h-4 md:w-4 text-green-600 flex-shrink-0" />
                          ) : (
                            <AlertCircle className="h-3.5 w-3.5 md:h-4 md:w-4 text-gray-500 flex-shrink-0" />
                          )}
                          <span>Status</span>
                        </span>
                        <Badge className={`text-xs ${shipment.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {shipment.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pricing */}
              <Card>
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <DollarSign className="h-4 w-4 md:h-5 md:w-5" />
                    Pricing Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-6 pt-0">
                  <div className="space-y-3 md:space-y-4">
                    <div>
                      <p className="text-xs md:text-sm text-gray-600 mb-2 flex items-center gap-2">
                        <DollarSign className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        Pricing Model
                      </p>
                      <Badge variant="outline" className="text-xs md:text-base px-2 md:px-3 py-1">
                        {shipment.pricingModel.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="pt-2 border-t">
                      {shipment.pricingModel === 'PER_KG' && shipment.pricePerKg && (
                        <div>
                          <p className="text-xs md:text-sm text-gray-600 mb-1">Price per kilogram</p>
                          <p className="text-2xl md:text-3xl font-bold text-orange-600">
                            £{parseFloat(String(shipment.pricePerKg)).toFixed(2)}
                            <span className="text-base md:text-lg text-gray-600 font-normal"> / kg</span>
                          </p>
                        </div>
                      )}
                      {shipment.pricingModel === 'PER_ITEM' && shipment.pricePerItem && (
                        <div>
                          <p className="text-xs md:text-sm text-gray-600 mb-1">Price per item</p>
                          <p className="text-2xl md:text-3xl font-bold text-orange-600">
                            £{parseFloat(String(shipment.pricePerItem)).toFixed(2)}
                            <span className="text-base md:text-lg text-gray-600 font-normal"> / item</span>
                          </p>
                        </div>
                      )}
                      {shipment.pricingModel === 'FLAT' && shipment.flatPrice && (
                        <div>
                          <p className="text-xs md:text-sm text-gray-600 mb-1">Flat rate</p>
                          <p className="text-2xl md:text-3xl font-bold text-orange-600">
                            £{parseFloat(String(shipment.flatPrice)).toFixed(2)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cutoff Time & Important Info */}
              <Card className={isPastCutoff ? "border-orange-500 bg-orange-50" : "border-blue-200 bg-blue-50"}>
                <CardContent className="pt-4 md:pt-6 p-4 md:p-6">
                  <div className="space-y-3 md:space-y-4">
                    {isPastCutoff ? (
                      <div className="flex items-start gap-2 md:gap-3">
                        <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm md:text-base text-orange-900">Booking cutoff passed</p>
                          <p className="text-xs md:text-sm text-orange-700 mt-1">
                            The cutoff time for this shipment was {format(cutoffDate, 'MMM dd, yyyy HH:mm')}. 
                            Bookings may no longer be accepted.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2 md:gap-3">
                        <Clock className="h-4 w-4 md:h-5 md:w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm md:text-base text-blue-900">Booking Deadline</p>
                          <p className="text-xs md:text-sm text-blue-700 mt-1">
                            Items must be received by {format(cutoffDate, 'MMM dd, yyyy')} at {format(cutoffDate, 'HH:mm')}
                          </p>
                        </div>
                      </div>
                    )}
                    {shipment.trackingStatus && (
                      <div className="pt-2 md:pt-3 border-t border-orange-200">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs md:text-sm text-gray-700">Tracking Status</span>
                          <Badge className={`text-xs ${
                            shipment.trackingStatus === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                            shipment.trackingStatus === 'IN_TRANSIT' ? 'bg-blue-100 text-blue-800' :
                            shipment.trackingStatus === 'DELAYED' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {shipment.trackingStatus.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Action Panel */}
            <div className="lg:col-span-1">
              <Card className="lg:sticky lg:top-6">
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="text-lg md:text-xl">Book This Slot</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 md:space-y-4 p-4 md:p-6 pt-0">
                  {!isAuthenticated ? (
                    <>
                      <div className="p-3 md:p-4 bg-orange-50 rounded-lg border border-orange-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Lock className="h-4 w-4 md:h-5 md:w-5 text-orange-600 flex-shrink-0" />
                          <p className="font-medium text-sm md:text-base text-orange-900">Sign in required</p>
                        </div>
                        <p className="text-xs md:text-sm text-orange-700 mb-3 md:mb-4">
                          Please sign in to view detailed booking options and proceed with your reservation.
                        </p>
                        <Link href={`/auth/login?redirect=/shipments/${shipmentId}`}>
                          <Button className="w-full bg-orange-600 hover:bg-orange-700 h-10 md:h-11 text-sm md:text-base">
                            Sign In to Book
                          </Button>
                        </Link>
                        <p className="text-xs text-orange-600 text-center mt-2 md:mt-3">
                          Don&apos;t have an account?{' '}
                          <Link href="/auth/register-customer" className="underline font-medium">
                            Sign up
                          </Link>
                        </p>
                      </div>
                    </>
                  ) : !isCustomer ? (
                    <>
                      <div className="p-3 md:p-4 bg-orange-50 rounded-lg border border-orange-200">
                        <p className="text-xs md:text-sm text-orange-700 mb-3 md:mb-4">
                          You need a customer account to book slots. Please switch to a customer account or create one.
                        </p>
                        <Link href="/auth/register-customer">
                          <Button variant="outline" className="w-full h-10 md:h-11 text-sm md:text-base">
                            Create Customer Account
                          </Button>
                        </Link>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-xs md:text-sm text-gray-600 mb-3 md:mb-4">
                        Ready to book this slot? Click below to proceed with detailed booking options.
                      </p>
                      <Button
                        className="w-full bg-orange-600 hover:bg-orange-700 h-10 md:h-11 text-sm md:text-base"
                        onClick={handleViewDetails}
                      >
                        View Details & Book
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}


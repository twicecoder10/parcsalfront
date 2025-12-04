'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Truck, Package, Star, AlertCircle, Loader2 } from 'lucide-react';
import { shipmentApi } from '@/lib/api';
import { customerApi } from '@/lib/customer-api';
import { format } from 'date-fns';
import type { Shipment } from '@/lib/api-types';

export default function ShipmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const shipmentId = params.id as string;
  
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [weight, setWeight] = useState('');
  const [itemCount, setItemCount] = useState('');
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchShipment();
  }, [shipmentId]);

  useEffect(() => {
    calculatePrice();
  }, [weight, itemCount, shipment]);

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

  const calculatePrice = () => {
    if (!shipment) {
      setEstimatedPrice(null);
      return;
    }

    if (shipment.pricingModel === 'PER_KG' && shipment.pricePerKg && weight) {
      const kgValue = parseFloat(weight);
      const pricePerKg = typeof shipment.pricePerKg === 'string' 
        ? parseFloat(shipment.pricePerKg) 
        : shipment.pricePerKg;
      if (!isNaN(kgValue) && kgValue > 0 && !isNaN(pricePerKg)) {
        const price = kgValue * pricePerKg;
        setEstimatedPrice(price);
        return;
      }
    }

    if (shipment.pricingModel === 'PER_ITEM' && shipment.pricePerItem && itemCount) {
      const items = parseFloat(itemCount);
      const pricePerItem = typeof shipment.pricePerItem === 'string' 
        ? parseFloat(shipment.pricePerItem) 
        : shipment.pricePerItem;
      if (!isNaN(items) && items > 0 && !isNaN(pricePerItem)) {
        const price = items * pricePerItem;
        setEstimatedPrice(price);
        return;
      }
    }

    if (shipment.pricingModel === 'FLAT' && shipment.flatPrice) {
      const flatPrice = typeof shipment.flatPrice === 'string' 
        ? parseFloat(shipment.flatPrice) 
        : shipment.flatPrice;
      if (!isNaN(flatPrice)) {
        setEstimatedPrice(flatPrice);
        return;
      }
    }

    setEstimatedPrice(null);
  };

  const handleBook = async () => {
    if (!shipment || !estimatedPrice) return;

    setBooking(true);
    setError(null);
    try {
      const booking = await customerApi.createBooking({
        shipmentSlotId: shipment.id,
        requestedWeightKg: weight ? parseFloat(weight) : undefined,
        requestedItemsCount: itemCount ? parseFloat(itemCount) : undefined,
      });
      
      // Redirect to payment page
      router.push(`/customer/bookings/${booking.id}/payment`);
    } catch (error: any) {
      console.error('Failed to create booking:', error);
      // Extract error message from API response
      // Check axios error response first, then check the error message from extractData
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          'Failed to create booking. Please try again.';
      setError(errorMessage);
    } finally {
      setBooking(false);
    }
  };

  const isValidBooking = () => {
    if (!shipment) return false;
    
    if (shipment.pricingModel === 'PER_KG') {
      // Check if weight-based booking is supported
      if (shipment.remainingCapacityKg === null || shipment.remainingCapacityKg <= 0) {
        return false;
      }
      const kgValue = parseFloat(weight);
      return weight && !isNaN(kgValue) && kgValue > 0 && kgValue <= shipment.remainingCapacityKg;
    }
    
    if (shipment.pricingModel === 'PER_ITEM') {
      // Check if item-based booking is supported
      if (shipment.remainingCapacityItems === null || shipment.remainingCapacityItems <= 0) {
        return false;
      }
      const items = parseFloat(itemCount);
      return itemCount && !isNaN(items) && items > 0 && items <= shipment.remainingCapacityItems;
    }
    
    if (shipment.pricingModel === 'FLAT') {
      return true;
    }
    
    return false;
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="max-w-6xl mx-auto">
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Shipment not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const departureDate = new Date(shipment.departureTime);
  const arrivalDate = new Date(shipment.arrivalTime);
  const cutoffDate = new Date(shipment.cutoffTimeForReceivingItems);
  const isPastCutoff = cutoffDate < new Date();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">
          {shipment.originCity} → {shipment.destinationCity}
        </h1>
        <p className="text-gray-600 mt-2">
          Departure: {format(departureDate, 'MMM dd, yyyy')} at {format(departureDate, 'HH:mm')}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Route Info */}
          <Card>
            <CardHeader>
              <CardTitle>Route Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="font-medium">Origin</p>
                  <p className="text-sm text-gray-600">
                    {shipment.originCity}, {shipment.originCountry}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">Destination</p>
                  <p className="text-sm text-gray-600">
                    {shipment.destinationCity}, {shipment.destinationCountry}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">Estimated Arrival</p>
                  <p className="text-sm text-gray-600">
                    {format(arrivalDate, 'MMM dd, yyyy')} at {format(arrivalDate, 'HH:mm')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Truck className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-medium">Transport Mode</p>
                  <Badge className="mt-1">{shipment.mode}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Company Info */}
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-lg">{shipment.company.name}</p>
                  {shipment.company.isVerified && (
                    <Badge variant="outline" className="mt-1">Verified</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Capacity */}
          <Card>
            <CardHeader>
              <CardTitle>Available Capacity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Remaining capacity (kg)</span>
                  <span className="font-medium">
                    {shipment.remainingCapacityKg} / {shipment.totalCapacityKg} kg
                  </span>
                </div>
                {shipment.totalCapacityItems !== null && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Remaining items</span>
                    <span className="font-medium">
                      {shipment.remainingCapacityItems} / {shipment.totalCapacityItems}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Pricing model: <span className="font-medium">{shipment.pricingModel.replace('_', ' ')}</span>
                </p>
                {shipment.pricingModel === 'PER_KG' && shipment.pricePerKg && (
                  <p className="text-2xl font-bold text-orange-600">
                    £{parseFloat(String(shipment.pricePerKg)).toFixed(2)} per kg
                  </p>
                )}
                {shipment.pricingModel === 'PER_ITEM' && shipment.pricePerItem && (
                  <p className="text-2xl font-bold text-orange-600">
                    £{parseFloat(String(shipment.pricePerItem)).toFixed(2)} per item
                  </p>
                )}
                {shipment.pricingModel === 'FLAT' && shipment.flatPrice && (
                  <p className="text-2xl font-bold text-orange-600">
                    £{parseFloat(String(shipment.flatPrice)).toFixed(2)} flat rate
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Cutoff Time Warning */}
          {isPastCutoff && (
            <Card className="border-orange-500 bg-orange-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-orange-900">Booking cutoff passed</p>
                    <p className="text-sm text-orange-700 mt-1">
                      The cutoff time for this shipment was {format(cutoffDate, 'MMM dd, yyyy HH:mm')}. 
                      Bookings may no longer be accepted.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Booking Panel */}
        <div className="md:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Book This Slot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {shipment.pricingModel === 'PER_KG' && (
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    placeholder="Enter weight"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    min="0"
                    max={shipment.remainingCapacityKg}
                    step="0.1"
                  />
                  {weight && parseFloat(weight) > shipment.remainingCapacityKg && (
                    <p className="text-xs text-red-600">
                      Weight exceeds remaining capacity ({shipment.remainingCapacityKg} kg)
                    </p>
                  )}
                </div>
              )}

              {shipment.pricingModel === 'PER_ITEM' && (
                <div className="space-y-2">
                  {shipment.remainingCapacityItems === null ? (
                    <Card className="border-orange-200 bg-orange-50">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-orange-900">Item-based booking not available</p>
                            <p className="text-xs text-orange-700 mt-1">
                              This shipment does not support item-based bookings. Please contact the company for alternative arrangements.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      <Label htmlFor="items">Number of Items</Label>
                      <Input
                        id="items"
                        type="number"
                        placeholder="Enter item count"
                        value={itemCount}
                        onChange={(e) => setItemCount(e.target.value)}
                        min="1"
                        max={shipment.remainingCapacityItems}
                      />
                      {itemCount && parseFloat(itemCount) > shipment.remainingCapacityItems && (
                        <p className="text-xs text-red-600">
                          Item count exceeds remaining capacity ({shipment.remainingCapacityItems} items)
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}

              {estimatedPrice !== null && (
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-sm text-gray-600 mb-1">Estimated Price</p>
                  <p className="text-2xl font-bold text-orange-600">£{estimatedPrice.toFixed(2)}</p>
                </div>
              )}

              {error && (
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-red-900">Booking Failed</p>
                        <p className="text-sm text-red-700 mt-1">{error}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button
                className="w-full"
                disabled={!isValidBooking() || booking || isPastCutoff}
                onClick={handleBook}
              >
                {booking ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Continue to Payment'
                )}
              </Button>

              {isPastCutoff && (
                <p className="text-xs text-gray-500 text-center">
                  Booking cutoff has passed
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


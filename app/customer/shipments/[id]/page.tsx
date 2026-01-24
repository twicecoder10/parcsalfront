'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Truck, Package, Star, AlertCircle, Loader2 } from 'lucide-react';
import { shipmentApi, publicApi, getErrorMessage } from '@/lib/api';
import { customerApi } from '@/lib/customer-api';
import { format } from 'date-fns';
import type { Shipment, ParcelType, PickupMethod, DeliveryMethod, WarehouseAddress } from '@/lib/api-types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AddressAutocomplete } from '@/components/address-autocomplete';
import { CitySelect } from '@/components/city-select';
import { GoogleMapsLoader } from '@/components/google-maps-loader';
import { uploadParcelImages, createImagePreview, MAX_PARCEL_IMAGES, MAX_FILE_SIZE, ALLOWED_IMAGE_TYPES, validateImageFile } from '@/lib/upload-api';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import countries from 'i18n-iso-countries';
import enLocale from 'i18n-iso-countries/langs/en.json';
import { getStoredUser, hasRoleAccess, getDashboardPath } from '@/lib/auth';
import { capture } from '@/lib/posthog';

// Register the locale
countries.registerLocale(enLocale);

export default function ShipmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const shipmentId = params.id as string;
  
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
  
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [weight, setWeight] = useState('');
  const [itemCount, setItemCount] = useState('');
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // New parcel information fields
  const [parcelType, setParcelType] = useState<ParcelType | ''>('');
  const [parcelWeight, setParcelWeight] = useState('');
  const [parcelValue, setParcelValue] = useState('');
  const [parcelLength, setParcelLength] = useState('');
  const [parcelWidth, setParcelWidth] = useState('');
  const [parcelHeight, setParcelHeight] = useState('');
  const [description, setDescription] = useState('');
  const [pickupMethod, setPickupMethod] = useState<PickupMethod | ''>('');
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod | ''>('');
  
  // Image upload state
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  
  // Warehouse addresses
  const [warehouses, setWarehouses] = useState<WarehouseAddress[]>([]);
  const [loadingWarehouses, setLoadingWarehouses] = useState(false);
  
  // Pickup address fields
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupCity, setPickupCity] = useState('');
  const [pickupState, setPickupState] = useState('');
  const [pickupCountry, setPickupCountry] = useState('');
  const [pickupPostalCode, setPickupPostalCode] = useState('');
  const [pickupContactName, setPickupContactName] = useState('');
  const [pickupContactPhone, setPickupContactPhone] = useState('');
  const [pickupWarehouseId, setPickupWarehouseId] = useState('');
  
  // Delivery address fields
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryCity, setDeliveryCity] = useState('');
  const [deliveryState, setDeliveryState] = useState('');
  const [deliveryCountry, setDeliveryCountry] = useState('');
  const [deliveryPostalCode, setDeliveryPostalCode] = useState('');
  const [deliveryContactName, setDeliveryContactName] = useState('');
  const [deliveryContactPhone, setDeliveryContactPhone] = useState('');
  const [deliveryWarehouseId, setDeliveryWarehouseId] = useState('');

  const fetchShipment = useCallback(async () => {
    // Double-check auth before making API call
    const user = getStoredUser();
    if (!user || !hasRoleAccess(user.role, ['CUSTOMER'])) {
      return;
    }

    setLoading(true);
    try {
      const data = await shipmentApi.getById(shipmentId);
      setShipment(data);
    } catch (error) {
      console.error('Failed to fetch shipment:', error);
    } finally {
      setLoading(false);
    }
  }, [shipmentId]);

  useEffect(() => {
    const user = getStoredUser();
    // Only fetch if user is authorized
    if (user && hasRoleAccess(user.role, ['CUSTOMER'])) {
      fetchShipment();
    }
  }, [fetchShipment]);

  // Set pickup and delivery countries from shipment when it loads
  useEffect(() => {
    if (shipment) {
      setPickupCountry(shipment.originCountry);
      setDeliveryCountry(shipment.destinationCountry);
    }
  }, [shipment]);

  // Filter warehouses for pickup (origin area)
  const getPickupWarehouses = useCallback((): { warehouses: WarehouseAddress[]; filterType: 'city' | 'country' | 'none' } => {
    if (!shipment || warehouses.length === 0) return { warehouses: [], filterType: 'none' };
    
    // First, try to find warehouses in the origin city
    const cityWarehouses = warehouses.filter(
      (w) => w.city.toLowerCase() === shipment.originCity.toLowerCase()
    );
    
    if (cityWarehouses.length > 0) {
      return { warehouses: cityWarehouses, filterType: 'city' };
    }
    
    // If no warehouses in city, fall back to origin country
    const countryWarehouses = warehouses.filter(
      (w) => w.country.toLowerCase() === shipment.originCountry.toLowerCase()
    );
    
    return { warehouses: countryWarehouses, filterType: 'country' };
  }, [shipment, warehouses]);

  // Filter warehouses for delivery (destination area)
  const getDeliveryWarehouses = useCallback((): { warehouses: WarehouseAddress[]; filterType: 'city' | 'country' | 'none' } => {
    if (!shipment || warehouses.length === 0) return { warehouses: [], filterType: 'none' };
    
    // First, try to find warehouses in the destination city
    const cityWarehouses = warehouses.filter(
      (w) => w.city.toLowerCase() === shipment.destinationCity.toLowerCase()
    );
    
    if (cityWarehouses.length > 0) {
      return { warehouses: cityWarehouses, filterType: 'city' };
    }
    
    // If no warehouses in city, fall back to destination country
    const countryWarehouses = warehouses.filter(
      (w) => w.country.toLowerCase() === shipment.destinationCountry.toLowerCase()
    );
    
    return { warehouses: countryWarehouses, filterType: 'country' };
  }, [shipment, warehouses]);

  // Fetch warehouse addresses when shipment is loaded
  useEffect(() => {
    const fetchWarehouses = async () => {
      if (!shipment?.company) return;
      
      setLoadingWarehouses(true);
      try {
        // Try using company slug first, fallback to ID
        const companyIdOrSlug = shipment.company.slug || shipment.company.id;
        const warehouseData = await publicApi.getWarehouseAddresses(companyIdOrSlug);
        setWarehouses(warehouseData);
      } catch (error) {
        console.error('Failed to fetch warehouse addresses:', error);
        // Don't show error to user - warehouses might not be available for all companies
        setWarehouses([]);
      } finally {
        setLoadingWarehouses(false);
      }
    };

    if (shipment?.company?.isVerified) {
      fetchWarehouses();
    }
  }, [shipment]);

  // Clear warehouse selections when method changes
  useEffect(() => {
    if (pickupMethod !== 'DROP_OFF_AT_COMPANY') {
      setPickupWarehouseId('');
    }
  }, [pickupMethod]);

  useEffect(() => {
    if (deliveryMethod !== 'RECEIVER_PICKS_UP') {
      setDeliveryWarehouseId('');
    }
  }, [deliveryMethod]);

  // Clear warehouse selections if they're no longer in the filtered list
  useEffect(() => {
    if (pickupMethod === 'DROP_OFF_AT_COMPANY' && pickupWarehouseId) {
      const { warehouses: pickupWarehouses } = getPickupWarehouses();
      const isValid = pickupWarehouses.some(w => w.id === pickupWarehouseId);
      if (!isValid) {
        setPickupWarehouseId('');
      }
    }
  }, [pickupMethod, pickupWarehouseId, getPickupWarehouses]);

  useEffect(() => {
    if (deliveryMethod === 'RECEIVER_PICKS_UP' && deliveryWarehouseId) {
      const { warehouses: deliveryWarehouses } = getDeliveryWarehouses();
      const isValid = deliveryWarehouses.some(w => w.id === deliveryWarehouseId);
      if (!isValid) {
        setDeliveryWarehouseId('');
      }
    }
  }, [deliveryMethod, deliveryWarehouseId, getDeliveryWarehouses]);

  const calculatePrice = useCallback(() => {
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
  }, [weight, itemCount, shipment]);

  useEffect(() => {
    calculatePrice();
  }, [calculatePrice]);

  // Auto-sync parcel weight from pricing weight when PER_KG pricing model
  useEffect(() => {
    if (shipment?.pricingModel === 'PER_KG' && weight) {
      setParcelWeight(weight);
    }
  }, [weight, shipment?.pricingModel]);

  // Helper function to extract address components from Google Places result
  const extractAddressComponents = (place: google.maps.places.PlaceResult) => {
    const components: {
      country?: string;
      city?: string;
      state?: string;
      postalCode?: string;
    } = {};

    if (place.address_components) {
      place.address_components.forEach((component) => {
        const types = component.types;
        
        if (types.includes('country')) {
          // Get country name from the library using country code
          const countryCode = component.short_name?.toUpperCase();
          if (countryCode) {
            const countryName = countries.getName(countryCode, 'en', { select: 'official' });
            if (countryName) {
              components.country = countryName;
            }
          }
        }
        
        // City can be in different types, prioritize locality
        if (types.includes('locality') && !components.city) {
          components.city = component.long_name;
        } else if (types.includes('administrative_area_level_2') && !components.city) {
          // Sometimes city is in level_2
          components.city = component.long_name;
        } else if (types.includes('sublocality') && !components.city) {
          // Sometimes city is in sublocality
          components.city = component.long_name;
        }
        
        if (types.includes('administrative_area_level_1')) {
          components.state = component.long_name;
        }
        
        if (types.includes('postal_code')) {
          components.postalCode = component.long_name;
        }
      });
    }

    return components;
  };

  // Handler for pickup address selection
  const handlePickupAddressSelect = (place: google.maps.places.PlaceResult) => {
    const components = extractAddressComponents(place);
    // Don't set country - it's fixed to origin country
    if (components.city) {
      setPickupCity(components.city);
    }
    if (components.state) {
      setPickupState(components.state);
    }
    if (components.postalCode) {
      setPickupPostalCode(components.postalCode);
    }
  };

  // Handler for delivery address selection
  const handleDeliveryAddressSelect = (place: google.maps.places.PlaceResult) => {
    const components = extractAddressComponents(place);
    // Don't set country - it's fixed to destination country
    if (components.city) {
      setDeliveryCity(components.city);
    }
    if (components.state) {
      setDeliveryState(components.state);
    }
    if (components.postalCode) {
      setDeliveryPostalCode(components.postalCode);
    }
  };

  const validateBookingForm = (): string[] => {
    const errors: string[] = [];
    
    if (!pickupMethod || !deliveryMethod) {
      errors.push('Please select both pickup and delivery methods');
    }
    
    // Validate pickup
    if (pickupMethod === 'PICKUP_FROM_SENDER') {
      if (!pickupAddress || !pickupCity || !pickupCountry) {
        errors.push('Pickup address, city, and country are required');
      }
      if (!pickupContactName || !pickupContactPhone) {
        errors.push('Pickup contact name and phone are required');
      }
    } else if (pickupMethod === 'DROP_OFF_AT_COMPANY') {
      if (!pickupWarehouseId) {
        errors.push('Please select a warehouse for drop-off');
      }
    }
    
    // Validate delivery
    if (deliveryMethod === 'DELIVERED_TO_RECEIVER') {
      if (!deliveryAddress || !deliveryCity || !deliveryCountry) {
        errors.push('Delivery address, city, and country are required');
      }
      if (!deliveryContactName || !deliveryContactPhone) {
        errors.push('Delivery contact name and phone are required');
      }
    } else if (deliveryMethod === 'RECEIVER_PICKS_UP') {
      if (!deliveryWarehouseId) {
        errors.push('Please select a warehouse for pickup');
      }
    }
    
    return errors;
  };

  const handleBook = async () => {
    if (!shipment || !estimatedPrice) return;
    
    // Validate required fields
    const validationErrors = validateBookingForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join('. '));
      return;
    }

    setBooking(true);
    setError(null);
    try {
      // Step 1: Upload images if any
      let imageUrls: string[] = [];
      if (selectedImages.length > 0) {
        setUploadingImages(true);
        try {
          imageUrls = await uploadParcelImages(selectedImages);
          setUploadedImageUrls(imageUrls);
        } catch (uploadError: any) {
          setError(getErrorMessage(uploadError) || 'Failed to upload images. Please try again.');
          setBooking(false);
          setUploadingImages(false);
          return;
        } finally {
          setUploadingImages(false);
        }
      }

      // Step 2: Build request body with conditional address fields
      const bookingData: any = {
        shipmentSlotId: shipment.id,
        requestedWeightKg: weight ? parseFloat(weight) : undefined,
        requestedItemsCount: itemCount ? parseFloat(itemCount) : undefined,
        parcelType: parcelType || undefined,
        // Use weight from pricing field for PER_KG, otherwise use parcelWeight
        weight: shipment.pricingModel === 'PER_KG' && weight 
          ? parseFloat(weight) 
          : parcelWeight 
          ? parseFloat(parcelWeight) 
          : undefined,
        value: parcelValue ? parseFloat(parcelValue) : undefined,
        length: parcelLength ? parseFloat(parcelLength) : undefined,
        width: parcelWidth ? parseFloat(parcelWidth) : undefined,
        height: parcelHeight ? parseFloat(parcelHeight) : undefined,
        description: description || undefined,
        images: imageUrls,
        pickupMethod: pickupMethod as PickupMethod,
        deliveryMethod: deliveryMethod as DeliveryMethod,
      };

      // Add pickup address fields conditionally
      if (pickupMethod === 'PICKUP_FROM_SENDER') {
        bookingData.pickupAddress = pickupAddress || null;
        bookingData.pickupCity = pickupCity || null;
        bookingData.pickupState = pickupState || null;
        bookingData.pickupCountry = pickupCountry || null;
        bookingData.pickupPostalCode = pickupPostalCode || null;
        bookingData.pickupContactName = pickupContactName || null;
        bookingData.pickupContactPhone = pickupContactPhone || null;
      } else if (pickupMethod === 'DROP_OFF_AT_COMPANY') {
        bookingData.pickupWarehouseId = pickupWarehouseId || null;
      }

      // Add delivery address fields conditionally
      if (deliveryMethod === 'DELIVERED_TO_RECEIVER') {
        bookingData.deliveryAddress = deliveryAddress || null;
        bookingData.deliveryCity = deliveryCity || null;
        bookingData.deliveryState = deliveryState || null;
        bookingData.deliveryCountry = deliveryCountry || null;
        bookingData.deliveryPostalCode = deliveryPostalCode || null;
        bookingData.deliveryContactName = deliveryContactName || null;
        bookingData.deliveryContactPhone = deliveryContactPhone || null;
      } else if (deliveryMethod === 'RECEIVER_PICKS_UP') {
        bookingData.deliveryWarehouseId = deliveryWarehouseId || null;
      }

      const booking = await customerApi.createBooking(bookingData);
      
      // Track booking creation event
      capture('customer_booking_created', {
        bookingId: booking.id,
        shipmentId: shipmentId,
      });
      
      // Redirect to payment page
      router.push(`/customer/bookings/${booking.id}/payment`);
    } catch (error: any) {
      console.error('Failed to create booking:', error);
      // Extract error message from API response
      const errorMessage = getErrorMessage(error) || 'Failed to create booking. Please try again.';
      setError(errorMessage);
    } finally {
      setBooking(false);
    }
  };

  const isValidBooking = () => {
    if (!shipment) return false;
    
    // Check required fields
    if (!pickupMethod || !deliveryMethod) {
      return false;
    }
    
    // Validate pickup method requirements
    if (pickupMethod === 'PICKUP_FROM_SENDER') {
      if (!pickupAddress || !pickupCity || !pickupCountry) {
        return false;
      }
      if (!pickupContactName || !pickupContactPhone) {
        return false;
      }
    } else if (pickupMethod === 'DROP_OFF_AT_COMPANY') {
      if (!pickupWarehouseId) {
        return false;
      }
    }
    
    // Validate delivery method requirements
    if (deliveryMethod === 'DELIVERED_TO_RECEIVER') {
      if (!deliveryAddress || !deliveryCity || !deliveryCountry) {
        return false;
      }
      if (!deliveryContactName || !deliveryContactPhone) {
        return false;
      }
    } else if (deliveryMethod === 'RECEIVER_PICKS_UP') {
      if (!deliveryWarehouseId) {
        return false;
      }
    }
    
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
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6">
      {/* Simple Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold">
          {shipment.originCity} → {shipment.destinationCity}
        </h1>
        <p className="text-gray-600 mt-1 text-sm">
          Departure: {format(departureDate, 'MMM dd, yyyy')} at {format(departureDate, 'HH:mm')}
        </p>
      </div>

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

      {/* Booking Form - Full Width */}
      <div>
        <GoogleMapsLoader>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Book This Slot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
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

              {/* Parcel Information Section */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold text-sm">Parcel Information</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="parcelType">Parcel Type (Optional)</Label>
                  <Select value={parcelType} onValueChange={(value) => setParcelType(value as ParcelType)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select parcel type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DOCUMENT">Document</SelectItem>
                      <SelectItem value="PACKAGE">Package</SelectItem>
                      <SelectItem value="FRAGILE">Fragile</SelectItem>
                      <SelectItem value="ELECTRONICS">Electronics</SelectItem>
                      <SelectItem value="CLOTHING">Clothing</SelectItem>
                      <SelectItem value="FOOD">Food</SelectItem>
                      <SelectItem value="MEDICINE">Medicine</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {shipment.pricingModel !== 'PER_KG' && (
                    <div className="space-y-2">
                      <Label htmlFor="parcelWeight">Weight (kg)</Label>
                      <Input
                        id="parcelWeight"
                        type="number"
                        placeholder="0.0"
                        value={parcelWeight}
                        onChange={(e) => setParcelWeight(e.target.value)}
                        min="0"
                        step="0.1"
                      />
                    </div>
                  )}
                  <div className={`space-y-2 ${shipment.pricingModel === 'PER_KG' ? 'col-span-2' : ''}`}>
                    <Label htmlFor="parcelValue">Value (£)</Label>
                    <Input
                      id="parcelValue"
                      type="number"
                      placeholder="0.00"
                      value={parcelValue}
                      onChange={(e) => setParcelValue(e.target.value)}
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Dimensions (cm) - Optional</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      type="number"
                      placeholder="Length (cm)"
                      value={parcelLength}
                      onChange={(e) => setParcelLength(e.target.value)}
                      min="0"
                      step="0.1"
                    />
                    <Input
                      type="number"
                      placeholder="Width (cm)"
                      value={parcelWidth}
                      onChange={(e) => setParcelWidth(e.target.value)}
                      min="0"
                      step="0.1"
                    />
                    <Input
                      type="number"
                      placeholder="Height (cm)"
                      value={parcelHeight}
                      onChange={(e) => setParcelHeight(e.target.value)}
                      min="0"
                      step="0.1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the parcel contents..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Image Upload Section */}
                <div className="space-y-2">
                  <Label htmlFor="images">Parcel Images (Optional)</Label>
                  <div className="space-y-3">
                    {imagePreviews.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {imagePreviews.map((preview, index) => (
                          <div key={index} className="relative aspect-square rounded-lg border overflow-hidden group">
                            <Image
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 33vw, 150px"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newFiles = selectedImages.filter((_, i) => i !== index);
                                const newPreviews = imagePreviews.filter((_, i) => i !== index);
                                setSelectedImages(newFiles);
                                setImagePreviews(newPreviews);
                              }}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <label
                        htmlFor="image-upload"
                        className="flex-1 cursor-pointer"
                      >
                        <div className="flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-lg hover:bg-gray-50 transition-colors">
                          <Upload className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            {selectedImages.length === 0
                              ? `Upload images (max ${MAX_PARCEL_IMAGES})`
                              : `${selectedImages.length} / ${MAX_PARCEL_IMAGES} images`}
                          </span>
                        </div>
                      </label>
                      <input
                        id="image-upload"
                        type="file"
                        accept={ALLOWED_IMAGE_TYPES.join(',')}
                        multiple
                        className="hidden"
                        onChange={async (e) => {
                          const files = Array.from(e.target.files || []);
                          if (files.length === 0) return;

                          const totalFiles = selectedImages.length + files.length;
                          if (totalFiles > MAX_PARCEL_IMAGES) {
                            setError(`Maximum ${MAX_PARCEL_IMAGES} images allowed. You can upload ${MAX_PARCEL_IMAGES - selectedImages.length} more.`);
                            return;
                          }

                          // Validate files
                          for (const file of files) {
                            const validation = validateImageFile(file);
                            if (!validation.valid) {
                              setError(validation.error || 'Invalid image file');
                              return;
                            }
                          }

                          setError(null);
                          const newFiles = [...selectedImages, ...files];
                          setSelectedImages(newFiles);

                          // Create previews
                          const newPreviews = await Promise.all(
                            files.map((file) => createImagePreview(file))
                          );
                          setImagePreviews([...imagePreviews, ...newPreviews]);
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      {selectedImages.length > 0 
                        ? `${selectedImages.length} / ${MAX_PARCEL_IMAGES} images selected. Images will be uploaded when you create the booking.`
                        : `Max ${MAX_PARCEL_IMAGES} images, ${MAX_FILE_SIZE / (1024 * 1024)}MB per file. Supported formats: JPEG, JPG, PNG, WebP, GIF`}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pickupMethod">Pickup Method <span className="text-red-500">*</span></Label>
                  <Select value={pickupMethod} onValueChange={(value) => setPickupMethod(value as PickupMethod)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select pickup method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PICKUP_FROM_SENDER">Company picks up from sender</SelectItem>
                      <SelectItem value="DROP_OFF_AT_COMPANY">Sender drops off at company</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deliveryMethod">Delivery Method <span className="text-red-500">*</span></Label>
                  <Select value={deliveryMethod} onValueChange={(value) => setDeliveryMethod(value as DeliveryMethod)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select delivery method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RECEIVER_PICKS_UP">Receiver picks up from company</SelectItem>
                      <SelectItem value="DELIVERED_TO_RECEIVER">Company delivers to receiver</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Pickup Address Section */}
              {pickupMethod && (
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-semibold text-sm">Pickup Details</h3>
                  
                  {pickupMethod === 'PICKUP_FROM_SENDER' ? (
                    <div className="space-y-4">
                      <AddressAutocomplete
                        value={pickupAddress}
                        onChange={setPickupAddress}
                        onPlaceSelect={handlePickupAddressSelect}
                        label="Pickup Address"
                        required
                        placeholder="Enter pickup address"
                        country={pickupCountry || shipment?.originCountry}
                      />
                      
                      <div className="grid grid-cols-2 gap-2">
                        <CitySelect
                          value={pickupCity}
                          onChange={setPickupCity}
                          country={pickupCountry}
                          label="City"
                          required
                          placeholder="Select city"
                        />
                        <div className="space-y-2">
                          <Label htmlFor="pickupCountry">Country</Label>
                          <Input
                            id="pickupCountry"
                            type="text"
                            value={pickupCountry}
                            disabled
                            className="bg-gray-50"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-2">
                          <Label htmlFor="pickupState">State/Province</Label>
                          <Input
                            id="pickupState"
                            type="text"
                            placeholder="Optional"
                            value={pickupState}
                            onChange={(e) => setPickupState(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="pickupPostalCode">Postal Code</Label>
                          <Input
                            id="pickupPostalCode"
                            type="text"
                            placeholder="Optional"
                            value={pickupPostalCode}
                            onChange={(e) => setPickupPostalCode(e.target.value)}
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-2">
                          <Label htmlFor="pickupContactName">Contact Name <span className="text-red-500">*</span></Label>
                          <Input
                            id="pickupContactName"
                            type="text"
                            placeholder="Enter contact name"
                            value={pickupContactName}
                            onChange={(e) => setPickupContactName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="pickupContactPhone">Contact Phone <span className="text-red-500">*</span></Label>
                          <Input
                            id="pickupContactPhone"
                            type="tel"
                            placeholder="Enter contact phone"
                            value={pickupContactPhone}
                            onChange={(e) => setPickupContactPhone(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="pickupWarehouse">Select Warehouse <span className="text-red-500">*</span></Label>
                      {loadingWarehouses ? (
                        <div className="flex items-center gap-2 p-4 border rounded-md">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm text-gray-600">Loading warehouses...</span>
                        </div>
                      ) : (() => {
                        const { warehouses: pickupWarehouses, filterType } = getPickupWarehouses();
                        return pickupWarehouses.length === 0 ? (
                          <Card className="border-orange-200 bg-orange-50">
                            <CardContent className="pt-6">
                              <div className="flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-sm font-medium text-orange-900">No warehouses available</p>
                                  <p className="text-xs text-orange-700 mt-1">
                                    No warehouses found in {shipment?.originCity}, {shipment?.originCountry}. Please contact the company for drop-off locations.
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ) : (
                          <>
                            <Select value={pickupWarehouseId} onValueChange={setPickupWarehouseId} required>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a warehouse" />
                              </SelectTrigger>
                              <SelectContent>
                                {pickupWarehouses.map((warehouse) => (
                                  <SelectItem key={warehouse.id} value={warehouse.id}>
                                    {warehouse.name} {warehouse.isDefault && '(Default)'} - {warehouse.address}, {warehouse.city}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {pickupWarehouses.length < warehouses.length && (
                              <p className="text-xs text-gray-500 mt-1">
                                {filterType === 'city' 
                                  ? `Showing warehouses in ${shipment?.originCity} (${pickupWarehouses.length} available)`
                                  : `Showing warehouses in ${shipment?.originCountry} (${pickupWarehouses.length} available)`
                                }
                              </p>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}

              {/* Delivery Address Section */}
              {deliveryMethod && (
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-semibold text-sm">Delivery Details</h3>
                  
                  {deliveryMethod === 'DELIVERED_TO_RECEIVER' ? (
                    <div className="space-y-4">
                      <AddressAutocomplete
                        value={deliveryAddress}
                        onChange={setDeliveryAddress}
                        onPlaceSelect={handleDeliveryAddressSelect}
                        label="Delivery Address"
                        required
                        placeholder="Enter delivery address"
                        country={deliveryCountry || shipment?.destinationCountry}
                      />
                      
                      <div className="grid grid-cols-2 gap-2">
                        <CitySelect
                          value={deliveryCity}
                          onChange={setDeliveryCity}
                          country={deliveryCountry}
                          label="City"
                          required
                          placeholder="Select city"
                        />
                        <div className="space-y-2">
                          <Label htmlFor="deliveryCountry">Country</Label>
                          <Input
                            id="deliveryCountry"
                            type="text"
                            value={deliveryCountry}
                            disabled
                            className="bg-gray-50"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-2">
                          <Label htmlFor="deliveryState">State/Province</Label>
                          <Input
                            id="deliveryState"
                            type="text"
                            placeholder="Optional"
                            value={deliveryState}
                            onChange={(e) => setDeliveryState(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="deliveryPostalCode">Postal Code</Label>
                          <Input
                            id="deliveryPostalCode"
                            type="text"
                            placeholder="Optional"
                            value={deliveryPostalCode}
                            onChange={(e) => setDeliveryPostalCode(e.target.value)}
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-2">
                          <Label htmlFor="deliveryContactName">Contact Name <span className="text-red-500">*</span></Label>
                          <Input
                            id="deliveryContactName"
                            type="text"
                            placeholder="Enter contact name"
                            value={deliveryContactName}
                            onChange={(e) => setDeliveryContactName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="deliveryContactPhone">Contact Phone <span className="text-red-500">*</span></Label>
                          <Input
                            id="deliveryContactPhone"
                            type="tel"
                            placeholder="Enter contact phone"
                            value={deliveryContactPhone}
                            onChange={(e) => setDeliveryContactPhone(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="deliveryWarehouse">Select Warehouse <span className="text-red-500">*</span></Label>
                      {loadingWarehouses ? (
                        <div className="flex items-center gap-2 p-4 border rounded-md">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm text-gray-600">Loading warehouses...</span>
                        </div>
                      ) : (() => {
                        const { warehouses: deliveryWarehouses, filterType } = getDeliveryWarehouses();
                        return deliveryWarehouses.length === 0 ? (
                          <Card className="border-orange-200 bg-orange-50">
                            <CardContent className="pt-6">
                              <div className="flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-sm font-medium text-orange-900">No warehouses available</p>
                                  <p className="text-xs text-orange-700 mt-1">
                                    No warehouses found in {shipment?.destinationCity}, {shipment?.destinationCountry}. Please contact the company for pickup locations.
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ) : (
                          <>
                            <Select value={deliveryWarehouseId} onValueChange={setDeliveryWarehouseId} required>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a warehouse" />
                              </SelectTrigger>
                              <SelectContent>
                                {deliveryWarehouses.map((warehouse) => (
                                  <SelectItem key={warehouse.id} value={warehouse.id}>
                                    {warehouse.name} {warehouse.isDefault && '(Default)'} - {warehouse.address}, {warehouse.city}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {deliveryWarehouses.length < warehouses.length && (
                              <p className="text-xs text-gray-500 mt-1">
                                {filterType === 'city' 
                                  ? `Showing warehouses in ${shipment?.destinationCity} (${deliveryWarehouses.length} available)`
                                  : `Showing warehouses in ${shipment?.destinationCountry} (${deliveryWarehouses.length} available)`
                                }
                              </p>
                            )}
                          </>
                        );
                      })()}
                    </div>
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
                disabled={!isValidBooking() || booking || isPastCutoff || uploadingImages}
                onClick={handleBook}
              >
                {uploadingImages ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading images...
                  </>
                ) : booking ? (
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
        </GoogleMapsLoader>
      </div>
      </div>
    </div>
  );
}


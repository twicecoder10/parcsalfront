'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, AlertCircle } from 'lucide-react';
import { companyApi } from '@/lib/company-api';
import { getErrorMessage } from '@/lib/api';
import { GoogleMapsLoader } from '@/components/google-maps-loader';
import { CountrySelect } from '@/components/country-select';
import { CitySelect } from '@/components/city-select';

export default function NewShipmentPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Allowed countries for the dropdown
  const allowedCountries = [
    'UK',
    'Ireland',
    'France',
    'Spain',
    'Italy',
    'Germany',
    'Netherlands',
    'Belgium',
    'Switzerland',
    'USA',
    'Senegal',
    'Mali',
    'Guinea',
    'Togo',
    'Burkina Faso',
    'Congo',
    'DRC',
    'South Africa',
    'Zimbabwe',
    'Tanzania',
    'Morocco',
    'Algeria',
    'Benin',
    'Cameroon',
    'Ghana',
    'Ivory Coast',
    'Nigeria',
  ];
  const [formData, setFormData] = useState({
    originCountry: '',
    originCity: '',
    destinationCountry: '',
    destinationCity: '',
    departureDate: '',
    departureTime: '',
    arrivalDate: '',
    arrivalTime: '',
    mode: '',
    totalCapacityKg: '',
    totalCapacityItems: '',
    pricingModel: '',
    pricePerKg: '',
    pricePerItem: '',
    flatPrice: '',
    cutoffTime: '',
  });

  const handleSubmit = async (e: React.FormEvent, status: 'DRAFT' | 'PUBLISHED' = 'DRAFT') => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setFieldErrors({});

    // Client-side validation
    const validationError = validateShipmentForm();
    if (validationError) {
      setError(validationError);
      setSaving(false);
      return;
    }

    try {
      // Combine date and time into ISO 8601 format
      const departureTime = formData.departureDate && formData.departureTime
        ? new Date(`${formData.departureDate}T${formData.departureTime}`).toISOString()
        : '';
      
      const arrivalTime = formData.arrivalDate && formData.arrivalTime
        ? new Date(`${formData.arrivalDate}T${formData.arrivalTime}`).toISOString()
        : '';

      const cutoffTimeForReceivingItems = formData.cutoffTime
        ? new Date(formData.cutoffTime).toISOString()
        : undefined;

      const shipmentData = {
        originCountry: formData.originCountry,
        originCity: formData.originCity,
        destinationCountry: formData.destinationCountry,
        destinationCity: formData.destinationCity,
        departureTime,
        arrivalTime: arrivalTime || undefined,
        mode: formData.mode,
        totalCapacityKg: Number(formData.totalCapacityKg),
        totalCapacityItems: formData.totalCapacityItems ? Number(formData.totalCapacityItems) : null,
        pricingModel: formData.pricingModel as 'PER_KG' | 'PER_ITEM' | 'FLAT',
        pricePerKg: formData.pricingModel === 'PER_KG' && formData.pricePerKg ? Number(formData.pricePerKg) : null,
        pricePerItem: formData.pricingModel === 'PER_ITEM' && formData.pricePerItem ? Number(formData.pricePerItem) : null,
        flatPrice: formData.pricingModel === 'FLAT' && formData.flatPrice ? Number(formData.flatPrice) : null,
        cutoffTimeForReceivingItems,
        status,
      };

      await companyApi.createShipment(shipmentData);
      router.push('/company/shipments');
    } catch (error: any) {
      console.error('Failed to create shipment:', error);
      // Extract error message from API response
      const errorMessage = getErrorMessage(error) || 'Failed to create shipment. Please check all fields and try again.';
      setError(errorMessage);
      setSaving(false);
    }
  };

  const validateShipmentForm = (): string | null => {
    const errors: Record<string, string> = {};

    // Validate dates and times
    const now = new Date();
    const departureDateTime = formData.departureDate && formData.departureTime
      ? new Date(`${formData.departureDate}T${formData.departureTime}`)
      : null;
    
    const arrivalDateTime = formData.arrivalDate && formData.arrivalTime
      ? new Date(`${formData.arrivalDate}T${formData.arrivalTime}`)
      : null;

    const cutoffDateTime = formData.cutoffTime
      ? new Date(formData.cutoffTime)
      : null;

    // Validate departure is in the future
    if (departureDateTime && departureDateTime <= now) {
      errors.departureDate = 'Departure time must be in the future';
    }

    // Validate arrival is after departure
    if (departureDateTime && arrivalDateTime && arrivalDateTime <= departureDateTime) {
      errors.arrivalDate = 'Arrival time must be after departure time';
    }

    // Validate cutoff time is in the future (at least 1 hour from now for realistic processing)
    if (cutoffDateTime) {
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
      if (cutoffDateTime < oneHourFromNow) {
        errors.cutoffTime = 'Cutoff time must be at least 1 hour in the future';
      }
    }

    // Validate cutoff time is before departure (with buffer for processing)
    if (cutoffDateTime && departureDateTime) {
      // Check if cutoff is after or equal to departure
      if (cutoffDateTime >= departureDateTime) {
        const isSameDay = cutoffDateTime.toDateString() === departureDateTime.toDateString();
        if (isSameDay) {
          errors.cutoffTime = 'Cutoff time must be before departure time on the same day';
        } else {
          errors.cutoffTime = 'Cutoff time must be before departure time';
        }
      }
      // Recommended: at least 2 hours buffer for processing
      const twoHoursBeforeDeparture = new Date(departureDateTime.getTime() - 2 * 60 * 60 * 1000);
      if (cutoffDateTime > twoHoursBeforeDeparture && cutoffDateTime < departureDateTime) {
        // This is just a warning, not an error, but we can show it in the UI
        // For now, we'll just allow it but the UI hint will suggest 12-24 hours
      }
    }

    if (formData.pricingModel === 'PER_KG') {
      if (!formData.totalCapacityKg || parseFloat(formData.totalCapacityKg) <= 0) {
        errors.totalCapacityKg = 'Weight capacity is required for per-kg pricing';
      }
    }

    if (formData.pricingModel === 'PER_ITEM') {
      if (!formData.totalCapacityItems || parseFloat(formData.totalCapacityItems) <= 0) {
        errors.totalCapacityItems = 'Item capacity is required for per-item pricing';
      }
    }

    if (formData.pricingModel === 'FLAT') {
      const hasKg = formData.totalCapacityKg && parseFloat(formData.totalCapacityKg) > 0;
      const hasItems = formData.totalCapacityItems && parseFloat(formData.totalCapacityItems) > 0;
      if (!hasKg && !hasItems) {
        errors.capacity = 'At least one capacity field (weight or items) is required for flat pricing';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length > 0 ? Object.values(errors)[0] : null;
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    // Clear general capacity error if user fills in a capacity field
    if ((field === 'totalCapacityKg' || field === 'totalCapacityItems') && fieldErrors.capacity) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.capacity;
        return newErrors;
      });
    }
    // Clear related date/time errors when they change
    if (field === 'departureDate' || field === 'departureTime') {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.departureDate;
        delete newErrors.arrivalDate; // Might affect arrival validation
        delete newErrors.cutoffTime; // Might affect cutoff validation
        return newErrors;
      });
    }
    if (field === 'arrivalDate' || field === 'arrivalTime') {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.arrivalDate;
        return newErrors;
      });
    }
    if (field === 'cutoffTime') {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.cutoffTime;
        return newErrors;
      });
    }
  };

  return (
    <GoogleMapsLoader>
      <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create New Shipment Slot</h1>
        <p className="text-gray-600 mt-2">Add a new shipment slot to your listings</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Route Information */}
          <Card>
            <CardHeader>
              <CardTitle>Route Information</CardTitle>
              <CardDescription>Origin and destination details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <CountrySelect
                  value={formData.originCountry}
                  onChange={(value) => {
                    handleChange('originCountry', value);
                    handleChange('originCity', '');
                  }}
                  label="Origin Country"
                  placeholder="Select origin country"
                  allowedCountries={allowedCountries}
                  required
                />
                <CitySelect
                  value={formData.originCity}
                  onChange={(value) => handleChange('originCity', value)}
                  country={formData.originCountry}
                  label="Origin City"
                  placeholder="Select origin city"
                  required
                  disabled={!formData.originCountry}
                />
                <CountrySelect
                  value={formData.destinationCountry}
                  onChange={(value) => {
                    handleChange('destinationCountry', value);
                    handleChange('destinationCity', '');
                  }}
                  label="Destination Country"
                  placeholder="Select destination country"
                  allowedCountries={allowedCountries}
                  required
                />
                <CitySelect
                  value={formData.destinationCity}
                  onChange={(value) => handleChange('destinationCity', value)}
                  country={formData.destinationCountry}
                  label="Destination City"
                  placeholder="Select destination city"
                  required
                  disabled={!formData.destinationCountry}
                />
              </div>
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card>
            <CardHeader>
              <CardTitle>Schedule</CardTitle>
              <CardDescription>Departure and arrival times</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="departureDate">Departure Date</Label>
                  <Input
                    id="departureDate"
                    type="date"
                    value={formData.departureDate}
                    onChange={(e) => handleChange('departureDate', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                    className={fieldErrors.departureDate ? 'border-red-500' : ''}
                  />
                  {fieldErrors.departureDate && (
                    <p className="text-xs text-red-600">{fieldErrors.departureDate}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="departureTime">Departure Time</Label>
                  <Input
                    id="departureTime"
                    type="time"
                    value={formData.departureTime}
                    onChange={(e) => handleChange('departureTime', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="arrivalDate">Arrival Date</Label>
                  <Input
                    id="arrivalDate"
                    type="date"
                    value={formData.arrivalDate}
                    onChange={(e) => handleChange('arrivalDate', e.target.value)}
                    min={formData.departureDate || new Date().toISOString().split('T')[0]}
                    required
                    className={fieldErrors.arrivalDate ? 'border-red-500' : ''}
                  />
                  {fieldErrors.arrivalDate && (
                    <p className="text-xs text-red-600">{fieldErrors.arrivalDate}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="arrivalTime">Arrival Time</Label>
                  <Input
                    id="arrivalTime"
                    type="time"
                    value={formData.arrivalTime}
                    onChange={(e) => handleChange('arrivalTime', e.target.value)}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Capacity & Mode */}
          <Card>
            <CardHeader>
              <CardTitle>Capacity & Mode</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mode">Mode</Label>
                  <Select value={formData.mode} onValueChange={(value) => handleChange('mode', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AIR">Air</SelectItem>
                      <SelectItem value="BUS">Bus</SelectItem>
                      <SelectItem value="VAN">Van</SelectItem>
                      <SelectItem value="TRAIN">Train</SelectItem>
                      <SelectItem value="SHIP">Ship</SelectItem>
                      <SelectItem value="RIDER">Rider</SelectItem>
                      <SelectItem value="TRUCK">Truck</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* Weight capacity - shown for PER_KG and FLAT, or when no pricing model selected yet */}
                <div className="space-y-2">
                  <Label htmlFor="totalCapacityKg">
                    Total Capacity (kg)
                    {formData.pricingModel === 'PER_KG' && <span className="text-red-500 ml-1">*</span>}
                    {formData.pricingModel === 'PER_ITEM' && <span className="text-gray-500 ml-1">(Not used)</span>}
                  </Label>
                  <Input
                    id="totalCapacityKg"
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.totalCapacityKg}
                    onChange={(e) => handleChange('totalCapacityKg', e.target.value)}
                    required={formData.pricingModel === 'PER_KG'}
                    disabled={formData.pricingModel === 'PER_ITEM'}
                    className={fieldErrors.totalCapacityKg || fieldErrors.capacity ? 'border-red-500' : ''}
                  />
                  {fieldErrors.totalCapacityKg && (
                    <p className="text-xs text-red-600">{fieldErrors.totalCapacityKg}</p>
                  )}
                  {formData.pricingModel === 'PER_KG' && (
                    <p className="text-xs text-gray-500">Required for per-kg pricing</p>
                  )}
                  {formData.pricingModel === 'FLAT' && (
                    <p className="text-xs text-gray-500">At least one capacity field is required</p>
                  )}
                </div>
                {/* Item capacity - shown for PER_ITEM and FLAT, or when no pricing model selected yet */}
                <div className="space-y-2">
                  <Label htmlFor="totalCapacityItems">
                    Total Items
                    {formData.pricingModel === 'PER_ITEM' && <span className="text-red-500 ml-1">*</span>}
                    {formData.pricingModel === 'PER_KG' && <span className="text-gray-500 ml-1">(Not used)</span>}
                    {formData.pricingModel === 'FLAT' && <span className="text-gray-500 ml-1">(Optional)</span>}
                  </Label>
                  <Input
                    id="totalCapacityItems"
                    type="number"
                    min="0"
                    value={formData.totalCapacityItems}
                    onChange={(e) => handleChange('totalCapacityItems', e.target.value)}
                    required={formData.pricingModel === 'PER_ITEM'}
                    disabled={formData.pricingModel === 'PER_KG'}
                    className={fieldErrors.totalCapacityItems || fieldErrors.capacity ? 'border-red-500' : ''}
                  />
                  {fieldErrors.totalCapacityItems && (
                    <p className="text-xs text-red-600">{fieldErrors.totalCapacityItems}</p>
                  )}
                  {formData.pricingModel === 'PER_ITEM' && (
                    <p className="text-xs text-gray-500">Required for per-item pricing</p>
                  )}
                  {formData.pricingModel === 'FLAT' && (
                    <p className="text-xs text-gray-500">At least one capacity field is required</p>
                  )}
                </div>
              </div>
              {fieldErrors.capacity && (
                <div className="mt-2">
                  <p className="text-sm text-red-600">{fieldErrors.capacity}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pricingModel">Pricing Model</Label>
                <Select value={formData.pricingModel} onValueChange={(value) => handleChange('pricingModel', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select pricing model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PER_KG">Per kg</SelectItem>
                    <SelectItem value="PER_ITEM">Per item</SelectItem>
                    <SelectItem value="FLAT">Flat rate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.pricingModel === 'PER_KG' && (
                <div className="space-y-2">
                  <Label htmlFor="pricePerKg">Price per kg (£)</Label>
                  <Input
                    id="pricePerKg"
                    type="number"
                    step="0.01"
                    value={formData.pricePerKg}
                    onChange={(e) => handleChange('pricePerKg', e.target.value)}
                  />
                </div>
              )}
              {formData.pricingModel === 'PER_ITEM' && (
                <div className="space-y-2">
                  <Label htmlFor="pricePerItem">Price per item (£)</Label>
                  <Input
                    id="pricePerItem"
                    type="number"
                    step="0.01"
                    value={formData.pricePerItem}
                    onChange={(e) => handleChange('pricePerItem', e.target.value)}
                  />
                </div>
              )}
              {formData.pricingModel === 'FLAT' && (
                <div className="space-y-2">
                  <Label htmlFor="flatPrice">Flat Price (£)</Label>
                  <Input
                    id="flatPrice"
                    type="number"
                    step="0.01"
                    value={formData.flatPrice}
                    onChange={(e) => handleChange('flatPrice', e.target.value)}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="cutoffTime">Cutoff Time for Receiving Items</Label>
                <Input
                  id="cutoffTime"
                  type="datetime-local"
                  value={formData.cutoffTime}
                  onChange={(e) => handleChange('cutoffTime', e.target.value)}
                  min={(() => {
                    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
                    return oneHourFromNow.toISOString().slice(0, 16);
                  })()}
                  max={(() => {
                    if (formData.departureDate && formData.departureTime) {
                      const departure = new Date(`${formData.departureDate}T${formData.departureTime}`);
                      // Cutoff must be strictly before departure (1 minute before to be safe)
                      const maxCutoff = new Date(departure.getTime() - 60 * 1000);
                      return maxCutoff.toISOString().slice(0, 16);
                    }
                    return undefined;
                  })()}
                  className={fieldErrors.cutoffTime ? 'border-red-500' : ''}
                />
                {fieldErrors.cutoffTime && (
                  <p className="text-xs text-red-600">{fieldErrors.cutoffTime}</p>
                )}
                <p className="text-xs text-gray-500">
                  Last time to receive items. Must be at least 1 hour in the future and strictly before departure time
                  {formData.departureDate && formData.departureTime && ' (even on the same day)'}.
                </p>
                {formData.departureDate && formData.departureTime && !formData.cutoffTime && (
                  <p className="text-xs text-blue-600">
                    💡 Tip: Consider setting cutoff 12-24 hours before departure for processing time
                  </p>
                )}
                {formData.cutoffTime && formData.departureDate && formData.departureTime && (() => {
                  const cutoff = new Date(formData.cutoffTime);
                  const departure = new Date(`${formData.departureDate}T${formData.departureTime}`);
                  const isSameDay = cutoff.toDateString() === departure.toDateString();
                  const hoursDiff = (departure.getTime() - cutoff.getTime()) / (1000 * 60 * 60);
                  
                  if (isSameDay && hoursDiff < 4) {
                    return (
                      <p className="text-xs text-amber-600">
                        ⚠️ Same-day cutoff with less than 4 hours before departure. Ensure you have enough processing time.
                      </p>
                    );
                  }
                  return null;
                })()}
              </div>
            </CardContent>
          </Card>

          {/* Error Message */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={saving}>
              Cancel
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={(e) => handleSubmit(e, 'DRAFT')}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save as Draft'
              )}
            </Button>
            <Button 
              type="button"
              onClick={(e) => handleSubmit(e, 'PUBLISHED')}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Publishing...
                </>
              ) : (
                'Publish'
              )}
            </Button>
          </div>
        </div>
      </form>
      </div>
    </GoogleMapsLoader>
  );
}



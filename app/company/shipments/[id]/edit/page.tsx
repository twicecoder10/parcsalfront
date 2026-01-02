'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { companyApi } from '@/lib/company-api';
import type { Shipment } from '@/lib/company-api';
import { getErrorMessage } from '@/lib/api';
import { GoogleMapsLoader } from '@/components/google-maps-loader';
import { CountrySelect } from '@/components/country-select';
import { CitySelect } from '@/components/city-select';

export default function EditShipmentPage() {
  const params = useParams();
  const router = useRouter();
  const shipmentId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
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

  const fetchShipment = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const shipment = await companyApi.getShipmentById(shipmentId);
      
      if (!shipment) {
        setError('Shipment not found');
        return;
      }
      
      // Parse dates from ISO strings
      if (!shipment.departureTime) {
        setError('Invalid shipment data: missing departure time');
        return;
      }
      
      const departureDate = new Date(shipment.departureTime);
      if (isNaN(departureDate.getTime())) {
        setError('Invalid departure time format');
        return;
      }
      
      const departureDateStr = departureDate.toISOString().split('T')[0];
      const departureTimeStr = departureDate.toTimeString().slice(0, 5);

      let arrivalDateStr = '';
      let arrivalTimeStr = '';
      if (shipment.arrivalTime) {
        const arrivalDate = new Date(shipment.arrivalTime);
        arrivalDateStr = arrivalDate.toISOString().split('T')[0];
        arrivalTimeStr = arrivalDate.toTimeString().slice(0, 5);
      }

      let cutoffTimeStr = '';
      if (shipment.cutoffTimeForReceivingItems) {
        const cutoffDate = new Date(shipment.cutoffTimeForReceivingItems);
        // Convert to local datetime-local format (YYYY-MM-DDTHH:mm)
        const year = cutoffDate.getFullYear();
        const month = String(cutoffDate.getMonth() + 1).padStart(2, '0');
        const day = String(cutoffDate.getDate()).padStart(2, '0');
        const hours = String(cutoffDate.getHours()).padStart(2, '0');
        const minutes = String(cutoffDate.getMinutes()).padStart(2, '0');
        cutoffTimeStr = `${year}-${month}-${day}T${hours}:${minutes}`;
      }

      setFormData({
        originCountry: shipment.originCountry || '',
        originCity: shipment.originCity || '',
        destinationCountry: shipment.destinationCountry || '',
        destinationCity: shipment.destinationCity || '',
        departureDate: departureDateStr,
        departureTime: departureTimeStr,
        arrivalDate: arrivalDateStr,
        arrivalTime: arrivalTimeStr,
        mode: shipment.mode || '',
        totalCapacityKg: String(shipment.totalCapacityKg || ''),
        totalCapacityItems: shipment.totalCapacityItems ? String(shipment.totalCapacityItems) : '',
        pricingModel: shipment.pricingModel || '',
        pricePerKg: shipment.pricePerKg ? String(shipment.pricePerKg) : '',
        pricePerItem: shipment.pricePerItem ? String(shipment.pricePerItem) : '',
        flatPrice: shipment.flatPrice ? String(shipment.flatPrice) : '',
        cutoffTime: cutoffTimeStr,
      });
    } catch (error: any) {
      console.error('Failed to fetch shipment:', error);
      // Extract error message from API response
      const errorMessage = getErrorMessage(error) || 'Failed to load shipment data. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [shipmentId]);

  useEffect(() => {
    fetchShipment();
  }, [fetchShipment]);

  const handleSubmit = async (e: React.FormEvent) => {
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
        : undefined;

      const cutoffTimeForReceivingItems = formData.cutoffTime
        ? new Date(formData.cutoffTime).toISOString()
        : undefined;

      const shipmentData = {
        originCountry: formData.originCountry,
        originCity: formData.originCity,
        destinationCountry: formData.destinationCountry,
        destinationCity: formData.destinationCity,
        departureTime,
        arrivalTime,
        mode: formData.mode,
        totalCapacityKg: Number(formData.totalCapacityKg),
        pricingModel: formData.pricingModel as 'PER_KG' | 'PER_ITEM' | 'FLAT',
        ...(formData.pricingModel === 'PER_KG' && formData.pricePerKg ? { pricePerKg: Number(formData.pricePerKg) } : {}),
        ...(formData.pricingModel === 'PER_ITEM' && formData.pricePerItem ? { pricePerItem: Number(formData.pricePerItem) } : {}),
        ...(formData.pricingModel === 'FLAT' && formData.flatPrice ? { flatPrice: Number(formData.flatPrice) } : {}),
      };

      await companyApi.updateShipment(shipmentId, shipmentData);
      router.push(`/company/shipments/${shipmentId}`);
    } catch (error: any) {
      console.error('Failed to update shipment:', error);
      // Extract error message from API response
      const errorMessage = getErrorMessage(error) || 'Failed to update shipment. Please check all fields and try again.';
      setError(errorMessage);
      setSaving(false);
    }
  };

  const validateShipmentForm = (): string | null => {
    const errors: Record<string, string> = {};

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
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
        </div>
      </div>
    );
  }

  return (
    <GoogleMapsLoader>
      <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/company/shipments/${shipmentId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Edit Shipment Slot</h1>
          <p className="text-gray-600 mt-2">Update shipment slot details</p>
        </div>
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
                    required
                  />
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
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="arrivalTime">Arrival Time</Label>
                  <Input
                    id="arrivalTime"
                    type="time"
                    value={formData.arrivalTime}
                    onChange={(e) => handleChange('arrivalTime', e.target.value)}
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
                {/* Weight capacity */}
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
                {/* Item capacity */}
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
                <Label htmlFor="cutoffTime">Cutoff Time (Optional)</Label>
                <Input
                  id="cutoffTime"
                  type="datetime-local"
                  value={formData.cutoffTime}
                  onChange={(e) => handleChange('cutoffTime', e.target.value)}
                />
                <p className="text-xs text-gray-500">Last time to receive items for this shipment</p>
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
              type="submit"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </div>
      </form>
      </div>
    </GoogleMapsLoader>
  );
}



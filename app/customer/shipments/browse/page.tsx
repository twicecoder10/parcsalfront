'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ShipmentCard, ShipmentCardData } from '@/components/shipment-card';
import { Search, Loader2, X, ChevronDown, ChevronUp, MapPin, Calendar, Filter, Truck, DollarSign } from 'lucide-react';
import { shipmentApi } from '@/lib/api';
import { GoogleMapsLoader } from '@/components/google-maps-loader';
import { CountrySelect } from '@/components/country-select';
import { CitySelect } from '@/components/city-select';
import { isShipmentAvailable } from '@/lib/utils';

export default function BrowseShipmentsPage() {
  const [originCountry, setOriginCountry] = useState('');
  const [originCity, setOriginCity] = useState('');
  const [destinationCountry, setDestinationCountry] = useState('');
  const [destinationCity, setDestinationCity] = useState('');
  const [departureDateFrom, setDepartureDateFrom] = useState('');
  const [departureDateTo, setDepartureDateTo] = useState('');
  const [arrivalDateFrom, setArrivalDateFrom] = useState('');
  const [arrivalDateTo, setArrivalDateTo] = useState('');
  const [mode, setMode] = useState<string>('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false);
  const [shipments, setShipments] = useState<ShipmentCardData[]>([]);
  const [pagination, setPagination] = useState({
    limit: 10,
    offset: 0,
    total: 0,
    hasMore: false,
  });

  // Helper to convert date string to ISO 8601 datetime
  const dateToISO = (dateString: string, isEndDate = false): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isEndDate) {
      // Set to end of day (23:59:59)
      date.setHours(23, 59, 59, 999);
    } else {
      // Set to start of day (00:00:00)
      date.setHours(0, 0, 0, 0);
    }
    return date.toISOString();
  };

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async (resetOffset = true, overrideFilters?: {
    originCountry?: string;
    originCity?: string;
    destinationCountry?: string;
    destinationCity?: string;
    departureDateFrom?: string;
    departureDateTo?: string;
    arrivalDateFrom?: string;
    arrivalDateTo?: string;
    mode?: string;
    minPrice?: string;
    maxPrice?: string;
  }) => {
    setLoading(true);
    try {
      const params: any = {
        limit: pagination.limit,
        offset: resetOffset ? 0 : pagination.offset,
      };

      // Use override filters if provided, otherwise use state values
      const filters = overrideFilters || {
        originCountry,
        originCity,
        destinationCountry,
        destinationCity,
        departureDateFrom,
        departureDateTo,
        arrivalDateFrom,
        arrivalDateTo,
        mode,
        minPrice,
        maxPrice,
      };

      if (filters.originCountry) params.originCountry = filters.originCountry;
      if (filters.originCity) params.originCity = filters.originCity;
      if (filters.destinationCountry) params.destinationCountry = filters.destinationCountry;
      if (filters.destinationCity) params.destinationCity = filters.destinationCity;

      // Departure date filters (convert to ISO 8601)
      if (filters.departureDateFrom) params.dateFrom = dateToISO(filters.departureDateFrom);
      if (filters.departureDateTo) params.dateTo = dateToISO(filters.departureDateTo, true);

      // Arrival date filters (convert to ISO 8601)
      if (filters.arrivalDateFrom) params.arrivalFrom = dateToISO(filters.arrivalDateFrom);
      if (filters.arrivalDateTo) params.arrivalTo = dateToISO(filters.arrivalDateTo, true);

      if (filters.mode && filters.mode !== 'all') params.mode = filters.mode;

      // Price filters
      if (filters.minPrice) params.minPrice = filters.minPrice;
      if (filters.maxPrice) params.maxPrice = filters.maxPrice;

      const response = await shipmentApi.search(params);

      // Filter out shipments where cutoff time or departure time has passed
      const availableShipments = response.data.filter((shipment: any) =>
        isShipmentAvailable({
          cutoffTimeForReceivingItems: shipment.cutoffTimeForReceivingItems,
          departureTime: shipment.departureTime,
        })
      );

      if (resetOffset) {
        setShipments(availableShipments);
      } else {
        setShipments([...shipments, ...availableShipments]);
      }

      // Update pagination to reflect filtered results
      setPagination({
        ...response.pagination,
        total: availableShipments.length,
        hasMore: response.pagination.hasMore && availableShipments.length > 0,
      });
    } catch (error) {
      console.error('Failed to fetch shipments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchShipments(true);
  };

  const handleClearFilters = () => {
    // Clear all filters
    setOriginCountry('');
    setOriginCity('');
    setDestinationCountry('');
    setDestinationCity('');
    setDepartureDateFrom('');
    setDepartureDateTo('');
    setArrivalDateFrom('');
    setArrivalDateTo('');
    setMode('all');
    setMinPrice('');
    setMaxPrice('');
    
    // Fetch immediately with cleared filters (empty values)
    fetchShipments(true, {
      originCountry: '',
      originCity: '',
      destinationCountry: '',
      destinationCity: '',
      departureDateFrom: '',
      departureDateTo: '',
      arrivalDateFrom: '',
      arrivalDateTo: '',
      mode: 'all',
      minPrice: '',
      maxPrice: '',
    });
  };

  const hasActiveFilters = originCountry || originCity || destinationCountry || destinationCity ||
    departureDateFrom || departureDateTo || arrivalDateFrom || arrivalDateTo || (mode && mode !== 'all');

  // Count active filters (excluding route which is always visible)
  const activeFiltersCount = [
    departureDateFrom,
    departureDateTo,
    arrivalDateFrom,
    arrivalDateTo,
    mode !== 'all' ? mode : null,
    minPrice,
    maxPrice,
  ].filter(Boolean).length;

  return (
    <GoogleMapsLoader>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Browse Shipments</h1>
          <p className="text-gray-600 mt-2">Find available shipment slots that match your needs</p>
        </div>

        {/* Search Filters */}
        <Card className="overflow-hidden">
          {/* Route Section - Always Visible */}
          <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-white p-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-4 w-4 text-orange-600" />
              <CardTitle className="text-sm">Route</CardTitle>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div>
                <Label className="text-xs font-medium text-gray-700 block mb-1">From Country</Label>
                <CountrySelect
                  value={originCountry}
                  onChange={(value) => {
                    setOriginCountry(value);
                    setOriginCity('');
                  }}
                  label=""
                  placeholder="Country"
                  className="[&_button]:h-8 [&_button]:text-xs"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-700 block mb-1">From City</Label>
                <CitySelect
                  value={originCity}
                  onChange={(value) => setOriginCity(value)}
                  country={originCountry}
                  label=""
                  placeholder="City"
                  disabled={!originCountry}
                  className="[&_button]:h-8 [&_button]:text-xs"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-700 block mb-1">To Country</Label>
                <CountrySelect
                  value={destinationCountry}
                  onChange={(value) => {
                    setDestinationCountry(value);
                    setDestinationCity('');
                  }}
                  label=""
                  placeholder="Country"
                  className="[&_button]:h-8 [&_button]:text-xs"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-700 block mb-1">To City</Label>
                <CitySelect
                  value={destinationCity}
                  onChange={(value) => setDestinationCity(value)}
                  country={destinationCountry}
                  label=""
                  placeholder="City"
                  disabled={!destinationCountry}
                  className="[&_button]:h-8 [&_button]:text-xs"
                />
              </div>
            </div>
          </CardHeader>

          {/* Additional Filters Button and Search */}
          <div className="px-4 py-3 border-t flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsFiltersModalOpen(true)}
              className="flex-1 justify-between h-9 text-sm"
            >
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-orange-600" />
                <span className="font-medium">Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold">
                    {activeFiltersCount}
                  </span>
                )}
              </div>
            </Button>
            <Button onClick={handleSearch} className="bg-orange-600 hover:bg-orange-700 h-9 px-6 text-sm" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Additional Filters Modal */}
        <Dialog open={isFiltersModalOpen} onOpenChange={setIsFiltersModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-orange-600" />
                Additional Filters
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {/* Dates Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-orange-600" />
                  <h4 className="font-semibold text-gray-900">Dates</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Departure Date</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="departureDateFrom" className="text-xs text-gray-500">From</Label>
                        <Input
                          id="departureDateFrom"
                          type="date"
                          value={departureDateFrom}
                          onChange={(e) => setDepartureDateFrom(e.target.value)}
                          className="h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="departureDateTo" className="text-xs text-gray-500">To</Label>
                        <Input
                          id="departureDateTo"
                          type="date"
                          value={departureDateTo}
                          onChange={(e) => setDepartureDateTo(e.target.value)}
                          min={departureDateFrom || undefined}
                          className="h-10"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Arrival Date</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="arrivalDateFrom" className="text-xs text-gray-500">From</Label>
                        <Input
                          id="arrivalDateFrom"
                          type="date"
                          value={arrivalDateFrom}
                          onChange={(e) => setArrivalDateFrom(e.target.value)}
                          className="h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="arrivalDateTo" className="text-xs text-gray-500">To</Label>
                        <Input
                          id="arrivalDateTo"
                          type="date"
                          value={arrivalDateTo}
                          onChange={(e) => setArrivalDateTo(e.target.value)}
                          min={arrivalDateFrom || undefined}
                          className="h-10"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t"></div>

                  {/* Transport Mode Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Truck className="h-5 w-5 text-orange-600" />
                      <h4 className="font-semibold text-gray-900">Transport Mode</h4>
                    </div>
                    <div>
                      <Select value={mode} onValueChange={setMode}>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="All transport modes" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Modes</SelectItem>
                          <SelectItem value="AIR">✈️ Air</SelectItem>
                          <SelectItem value="BUS">🚌 Bus</SelectItem>
                          <SelectItem value="VAN">🚐 Van</SelectItem>
                          <SelectItem value="TRAIN">🚂 Train</SelectItem>
                          <SelectItem value="SHIP">🚢 Ship</SelectItem>
                          <SelectItem value="RIDER">🏍️ Rider</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t"></div>

                  {/* Price Range Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-orange-600" />
                      <h4 className="font-semibold text-gray-900">Price Range</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="minPrice" className="text-sm font-medium text-gray-700">Min Price</Label>
                        <Input
                          id="minPrice"
                          type="number"
                          placeholder="0.00"
                          value={minPrice}
                          onChange={(e) => setMinPrice(e.target.value)}
                          className="h-10"
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="maxPrice" className="text-sm font-medium text-gray-700">Max Price</Label>
                        <Input
                          id="maxPrice"
                          type="number"
                          placeholder="No limit"
                          value={maxPrice}
                          onChange={(e) => setMaxPrice(e.target.value)}
                          className="h-10"
                          min={minPrice || "0"}
                          step="0.01"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      Price comparison depends on pricing model (FLAT, PER_KG, or PER_ITEM)
                    </p>
                  </div>
                </div>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setDepartureDateFrom('');
                  setDepartureDateTo('');
                  setArrivalDateFrom('');
                  setArrivalDateTo('');
                  setMode('all');
                  setMinPrice('');
                  setMaxPrice('');
                }}
                className="text-gray-600"
              >
                <X className="mr-2 h-4 w-4" />
                Clear filters
              </Button>
              <Button
                type="button"
                onClick={() => setIsFiltersModalOpen(false)}
                className="bg-orange-600 hover:bg-orange-700"
              >
                Apply Filters
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Results */}
        <div>
          {loading && shipments.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
              </CardContent>
            </Card>
          ) : shipments.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-gray-600 mb-4">No shipments found</p>
                <p className="text-sm text-gray-500">Try adjusting your search filters</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="mb-4 text-sm text-gray-600">
                Found {pagination.total} {pagination.total === 1 ? 'shipment' : 'shipments'}
              </div>
              <div className="grid gap-4">
                {shipments.map((shipment) => (
                  <ShipmentCard key={shipment.id} shipment={shipment} />
                ))}
              </div>
              {pagination.hasMore && (
                <div className="mt-6 text-center">
                  <Button
                    variant="outline"
                    onClick={() => fetchShipments(false)}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Load More'
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </GoogleMapsLoader>
  );
}


'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ShipmentCard, ShipmentCardData } from '@/components/shipment-card';
import { Search, Loader2, X } from 'lucide-react';
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
  const [loading, setLoading] = useState(false);
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
    });
  };

  const hasActiveFilters = originCountry || originCity || destinationCountry || destinationCity ||
    departureDateFrom || departureDateTo || arrivalDateFrom || arrivalDateTo || (mode && mode !== 'all');

  return (
    <GoogleMapsLoader>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Browse Shipments</h1>
          <p className="text-gray-600 mt-2">Find available shipment slots that match your needs</p>
        </div>

        {/* Search Filters */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Search Filters</CardTitle>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <CountrySelect
                  value={originCountry}
                  onChange={(value) => {
                    setOriginCountry(value);
                    setOriginCity('');
                  }}
                  label="Origin Country"
                  placeholder="Select origin country"
                />
              </div>
              <div className="space-y-2">
                <CitySelect
                  value={originCity}
                  onChange={(value) => setOriginCity(value)}
                  country={originCountry}
                  label="Origin City"
                  placeholder="Select origin city"
                  disabled={!originCountry}
                />
              </div>
              <div className="space-y-2">
                <CountrySelect
                  value={destinationCountry}
                  onChange={(value) => {
                    setDestinationCountry(value);
                    setDestinationCity('');
                  }}
                  label="Destination Country"
                  placeholder="Select destination country"
                />
              </div>
              <div className="space-y-2">
                <CitySelect
                  value={destinationCity}
                  onChange={(value) => setDestinationCity(value)}
                  country={destinationCountry}
                  label="Destination City"
                  placeholder="Select destination city"
                  disabled={!destinationCountry}
                />
              </div>
              <div className="space-y-2">
                <Label>Transport Mode</Label>
                <Select value={mode} onValueChange={setMode}>
                  <SelectTrigger>
                    <SelectValue placeholder="Transport Mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Modes</SelectItem>
                    <SelectItem value="TRUCK">Truck</SelectItem>
                    <SelectItem value="VAN">Van</SelectItem>
                    <SelectItem value="AIR">Air</SelectItem>
                    <SelectItem value="TRAIN">Train</SelectItem>
                    <SelectItem value="SHIP">Ship</SelectItem>
                    <SelectItem value="RIDER">Rider</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {/* Departure Date Range */}
              <div className="border rounded-lg p-3 bg-gray-50/50">
                <Label className="text-sm font-medium block mb-2 text-gray-700">
                  Departure Range
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="departureDateFrom" className="text-xs text-gray-600">From</Label>
                    <Input
                      id="departureDateFrom"
                      type="date"
                      value={departureDateFrom}
                      onChange={(e) => setDepartureDateFrom(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="departureDateTo" className="text-xs text-gray-600">To</Label>
                    <Input
                      id="departureDateTo"
                      type="date"
                      value={departureDateTo}
                      onChange={(e) => setDepartureDateTo(e.target.value)}
                      min={departureDateFrom || undefined}
                    />
                  </div>
                </div>
              </div>

              {/* Arrival Date Range */}
              <div className="border rounded-lg p-3 bg-gray-50/50">
                <Label className="text-sm font-medium block mb-2 text-gray-700">
                  Arrival Range
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="arrivalDateFrom" className="text-xs text-gray-600">From</Label>
                    <Input
                      id="arrivalDateFrom"
                      type="date"
                      value={arrivalDateFrom}
                      onChange={(e) => setArrivalDateFrom(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="arrivalDateTo" className="text-xs text-gray-600">To</Label>
                    <Input
                      id="arrivalDateTo"
                      type="date"
                      value={arrivalDateTo}
                      onChange={(e) => setArrivalDateTo(e.target.value)}
                      min={arrivalDateFrom || undefined}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <Button onClick={handleSearch} className="w-full md:w-auto" disabled={loading}>
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
          </CardContent>
        </Card>

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


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
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { isShipmentAvailable } from '@/lib/utils';

export default function BrowseShipmentsPage() {
  const [originCountry, setOriginCountry] = useState('');
  const [originCity, setOriginCity] = useState('');
  const [destinationCountry, setDestinationCountry] = useState('');
  const [destinationCity, setDestinationCity] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [mode, setMode] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [shipments, setShipments] = useState<ShipmentCardData[]>([]);
  const [pagination, setPagination] = useState({
    limit: 10,
    offset: 0,
    total: 0,
    hasMore: false,
  });

  useEffect(() => {
    // Get URL params and populate search form
    const params = new URLSearchParams(window.location.search);
    if (params.get('originCountry')) setOriginCountry(params.get('originCountry') || '');
    if (params.get('originCity')) setOriginCity(params.get('originCity') || '');
    if (params.get('destinationCountry')) setDestinationCountry(params.get('destinationCountry') || '');
    if (params.get('destinationCity')) setDestinationCity(params.get('destinationCity') || '');
    if (params.get('date')) {
      setDateFrom(params.get('date') || '');
      setDateTo(params.get('date') || '');
    }
    
    fetchShipments(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchShipments = async (resetOffset = true) => {
    setLoading(true);
    try {
      const params: any = {
        limit: pagination.limit,
        offset: resetOffset ? 0 : pagination.offset,
      };

      if (originCountry) params.originCountry = originCountry;
      if (originCity) params.originCity = originCity;
      if (destinationCountry) params.destinationCountry = destinationCountry;
      if (destinationCity) params.destinationCity = destinationCity;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      if (mode && mode !== 'all') params.mode = mode;

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
    setOriginCountry('');
    setOriginCity('');
    setDestinationCountry('');
    setDestinationCity('');
    setDateFrom('');
    setDateTo('');
    setMode('all');
    setTimeout(() => fetchShipments(true), 0);
  };

  const hasActiveFilters = originCountry || originCity || destinationCountry || destinationCity || dateFrom || dateTo || (mode && mode !== 'all');

  return (
    <GoogleMapsLoader>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Browse Available Slots</h1>
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
                    <Label htmlFor="dateFrom">From Date</Label>
                    <Input
                      id="dateFrom"
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateTo">To Date</Label>
                    <Input
                      id="dateTo"
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                    />
                  </div>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
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
                    <p className="text-gray-600 mb-4">No slots found</p>
                    <p className="text-sm text-gray-500">Try adjusting your search filters</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="mb-4 text-sm text-gray-600">
                    Found {pagination.total} {pagination.total === 1 ? 'slot' : 'slots'}
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
        </main>
        <Footer />
      </div>
    </GoogleMapsLoader>
  );
}


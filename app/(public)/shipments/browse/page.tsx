'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ShipmentCard, ShipmentCardData } from '@/components/shipment-card';
import { Search, Loader2, X, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [allShipments, setAllShipments] = useState<ShipmentCardData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const [pagination, setPagination] = useState({
    limit: 100, // Fetch more items to enable pagination
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
        setAllShipments(availableShipments);
        setCurrentPage(1);
      } else {
        setAllShipments([...allShipments, ...availableShipments]);
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

  // Calculate pagination
  const totalPages = Math.ceil(allShipments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentShipments = allShipments.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of results
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = () => {
    setCurrentPage(1);
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
    setCurrentPage(1);
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
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Search Filters</CardTitle>
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                      <X className="h-4 w-4 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0 pb-3">
                <div className="grid gap-2 grid-cols-2 md:grid-cols-3 lg:grid-cols-7">
                  <div className="space-y-1">
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
                  <div className="space-y-1">
                    <CitySelect
                      value={originCity}
                      onChange={(value) => setOriginCity(value)}
                      country={originCountry}
                      label="Origin City"
                      placeholder="Select origin city"
                      disabled={!originCountry}
                    />
                  </div>
                  <div className="space-y-1">
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
                  <div className="space-y-1">
                    <CitySelect
                      value={destinationCity}
                      onChange={(value) => setDestinationCity(value)}
                      country={destinationCountry}
                      label="Destination City"
                      placeholder="Select destination city"
                      disabled={!destinationCountry}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="dateFrom" className="text-xs">From Date</Label>
                    <Input
                      id="dateFrom"
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="dateTo" className="text-xs">To Date</Label>
                    <Input
                      id="dateTo"
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Mode</Label>
                    <Select value={mode} onValueChange={setMode}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Mode" />
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
                <div className="mt-2 flex justify-end">
                  <Button onClick={handleSearch} className="h-9" disabled={loading}>
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
              {loading && allShipments.length === 0 ? (
                <Card>
                  <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
                  </CardContent>
                </Card>
              ) : allShipments.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <p className="text-gray-600 mb-4">No slots found</p>
                    <p className="text-sm text-gray-500">Try adjusting your search filters</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="mb-6 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Showing <span className="font-semibold text-gray-900">{startIndex + 1}</span> to{' '}
                      <span className="font-semibold text-gray-900">{Math.min(endIndex, allShipments.length)}</span> of{' '}
                      <span className="font-semibold text-gray-900">{allShipments.length}</span> slots
                    </div>
                  </div>

                  {/* Scrollable Results Container */}
                  <Card className="overflow-hidden">
                    <div className="max-h-[800px] overflow-y-auto scrollbar-hide p-6">
                      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {currentShipments.map((shipment, index) => (
                          <div
                            key={shipment.id}
                            className="animate-slide-in"
                            style={{
                              animationDelay: `${(index % itemsPerPage) * 0.05}s`,
                            }}
                          >
                            <ShipmentCard shipment={shipment} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1 || loading}
                        className="flex items-center gap-1"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>

                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter((page) => {
                            // Show first page, last page, current page, and pages around current
                            if (page === 1 || page === totalPages) return true;
                            if (Math.abs(page - currentPage) <= 1) return true;
                            return false;
                          })
                          .map((page, index, array) => {
                            // Add ellipsis if there's a gap
                            const showEllipsisBefore = index > 0 && page - array[index - 1] > 1;
                            return (
                              <div key={page} className="flex items-center gap-1">
                                {showEllipsisBefore && (
                                  <span className="px-2 text-gray-400">...</span>
                                )}
                                <Button
                                  variant={currentPage === page ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => handlePageChange(page)}
                                  disabled={loading}
                                  className={`min-w-[40px] ${
                                    currentPage === page
                                      ? 'bg-orange-600 hover:bg-orange-700'
                                      : ''
                                  }`}
                                >
                                  {page}
                                </Button>
                              </div>
                            );
                          })}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages || loading}
                        className="flex items-center gap-1"
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {/* Load More for additional results */}
                  {pagination.hasMore && (
                    <div className="mt-4 text-center">
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
                          'Load More Results'
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


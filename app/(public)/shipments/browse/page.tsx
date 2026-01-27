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
import { Search, Loader2, X, ChevronLeft, ChevronRight, MapPin, Calendar, Filter, Truck, DollarSign, Package } from 'lucide-react';
import { shipmentApi } from '@/lib/api';
import { GoogleMapsLoader } from '@/components/google-maps-loader';
import { CountrySelect } from '@/components/country-select';
import { CitySelect } from '@/components/city-select';
import { Navbar } from '@/components/navbar';
import { CustomerHeader } from '@/components/customer-header';
import { isShipmentAvailable } from '@/lib/utils';
import { getStoredUser } from '@/lib/auth';

export default function BrowseShipmentsPage() {
  const [originCountry, setOriginCountry] = useState('');
  const [originCity, setOriginCity] = useState('');
  const [destinationCountry, setDestinationCountry] = useState('');
  const [destinationCity, setDestinationCity] = useState('');
  const [departureDateFrom, setDepartureDateFrom] = useState('');
  const [departureDateTo, setDepartureDateTo] = useState('');
  const [arrivalDateFrom, setArrivalDateFrom] = useState('');
  const [arrivalDateTo, setArrivalDateTo] = useState('');
  const [isCustomer, setIsCustomer] = useState(false);
  const [mode, setMode] = useState<string>('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false);

  // Get today's date in YYYY-MM-DD format for min date constraints
  const today = new Date().toISOString().split('T')[0];

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

  // Helper to extract date from ISO string (for display in date inputs)
  const isoToDateInput = (isoString: string): string => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  useEffect(() => {
    // Check if user is logged in as customer
    const user = getStoredUser();
    setIsCustomer(user?.role === 'CUSTOMER');

    // Get URL params and populate search form
    const urlParams = new URLSearchParams(window.location.search);
    
    // Extract values from URL
    const urlOriginCountry = urlParams.get('originCountry') || '';
    const urlOriginCity = urlParams.get('originCity') || '';
    const urlDestinationCountry = urlParams.get('destinationCountry') || '';
    const urlDestinationCity = urlParams.get('destinationCity') || '';
    const urlMode = urlParams.get('mode') || 'all';
    
    // Parse dateFrom and dateTo from ISO strings
    const urlDepartureDateFrom = urlParams.get('dateFrom') ? isoToDateInput(urlParams.get('dateFrom') || '') : '';
    const urlDepartureDateTo = urlParams.get('dateTo') ? isoToDateInput(urlParams.get('dateTo') || '') : '';
    const urlArrivalDateFrom = urlParams.get('arrivalFrom') ? isoToDateInput(urlParams.get('arrivalFrom') || '') : '';
    const urlArrivalDateTo = urlParams.get('arrivalTo') ? isoToDateInput(urlParams.get('arrivalTo') || '') : '';
    const urlMinPrice = urlParams.get('minPrice') || '';
    const urlMaxPrice = urlParams.get('maxPrice') || '';

    // Set state from URL params
    if (urlOriginCountry) setOriginCountry(urlOriginCountry);
    if (urlOriginCity) setOriginCity(urlOriginCity);
    if (urlDestinationCountry) setDestinationCountry(urlDestinationCountry);
    if (urlDestinationCity) setDestinationCity(urlDestinationCity);
    if (urlMode) setMode(urlMode);
    if (urlDepartureDateFrom) setDepartureDateFrom(urlDepartureDateFrom);
    if (urlDepartureDateTo) setDepartureDateTo(urlDepartureDateTo);
    if (urlArrivalDateFrom) setArrivalDateFrom(urlArrivalDateFrom);
    if (urlArrivalDateTo) setArrivalDateTo(urlArrivalDateTo);
    if (urlMinPrice) setMinPrice(urlMinPrice);
    if (urlMaxPrice) setMaxPrice(urlMaxPrice);

    // Fetch shipments with URL params directly (don't wait for state updates)
    fetchShipmentsWithParams({
      originCountry: urlOriginCountry,
      originCity: urlOriginCity,
      destinationCountry: urlDestinationCountry,
      destinationCity: urlDestinationCity,
      departureDateFrom: urlDepartureDateFrom,
      departureDateTo: urlDepartureDateTo,
      arrivalDateFrom: urlArrivalDateFrom,
      arrivalDateTo: urlArrivalDateTo,
      mode: urlMode,
      minPrice: urlMinPrice,
      maxPrice: urlMaxPrice,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchShipmentsWithParams = async (
    overrideFilters?: {
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
    },
    resetOffset = true
  ) => {
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

  const fetchShipments = async (resetOffset = true) => {
    return fetchShipmentsWithParams(undefined, resetOffset);
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
    setDepartureDateFrom('');
    setDepartureDateTo('');
    setArrivalDateFrom('');
    setArrivalDateTo('');
    setMode('all');
    setMinPrice('');
    setMaxPrice('');
    setCurrentPage(1);
    setTimeout(() => fetchShipments(true), 0);
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
      <div className="min-h-screen flex flex-col">
        {isCustomer ? <CustomerHeader /> : <Navbar />}
        <main className="flex-1 pt-16 md:pt-20">
          {/* Sticky Header Section */}
          <div className="sticky top-16 md:top-20 z-40 bg-white border-b shadow-sm">
            <div className="container mx-auto px-4 py-3 md:py-4">
              <h1 className="text-2xl md:text-3xl font-bold">Browse Available Slots</h1>
              <p className="text-sm md:text-base text-gray-600 mt-1">Find available shipment slots that match your needs</p>
            </div>
          </div>

          {/* Main Content */}
          <div className="container mx-auto px-4 py-4 md:py-6">
            <div className="space-y-4 md:space-y-6">

            {/* Search Filters - Sticky Below Header */}
            <Card className="overflow-hidden sticky top-[140px] md:top-[176px] z-30 shadow-md">
              {/* Route Section - Always Visible */}
              <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-white p-3 md:p-4">
                <div className="flex items-center gap-2 mb-2 md:mb-3">
                  <MapPin className="h-4 w-4 text-orange-600" />
                  <CardTitle className="text-sm md:text-base">Route</CardTitle>
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
                      allowedCountries={allowedCountries}
                      className="[&_button]:h-9 [&_button]:text-xs"
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
                      className="[&_button]:h-9 [&_button]:text-xs"
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
                      allowedCountries={allowedCountries}
                      className="[&_button]:h-9 [&_button]:text-xs"
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
                      className="[&_button]:h-9 [&_button]:text-xs"
                    />
                  </div>
                </div>
              </CardHeader>

              {/* Additional Filters Button and Search */}
              <div className="px-3 md:px-4 py-2 md:py-3 border-t flex items-center gap-2 md:gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFiltersModalOpen(true)}
                  className="flex-1 justify-between h-9 md:h-10 text-xs md:text-sm"
                >
                  <div className="flex items-center gap-1 md:gap-2">
                    <Filter className="h-4 w-4 text-orange-600" />
                    <span className="font-medium">Filters</span>
                    {activeFiltersCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold">
                        {activeFiltersCount}
                      </span>
                    )}
                  </div>
                </Button>
                <Button onClick={handleSearch} className="bg-orange-600 hover:bg-orange-700 h-9 md:h-10 px-4 md:px-6 text-xs md:text-sm flex-shrink-0" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-1 md:mr-2 h-4 w-4 animate-spin" />
                      <span className="hidden sm:inline">Searching...</span>
                      <span className="sm:hidden">...</span>
                    </>
                  ) : (
                    <>
                      <Search className="mr-1 md:mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">Search</span>
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
                              onChange={(e) => {
                                setDepartureDateFrom(e.target.value);
                                // If the new "From" date is after "To" date, clear "To" date
                                if (e.target.value && departureDateTo && e.target.value > departureDateTo) {
                                  setDepartureDateTo('');
                                }
                                // If the new "From" date is after or equal to arrival "From", clear arrival dates
                                if (e.target.value && arrivalDateFrom && e.target.value >= arrivalDateFrom) {
                                  setArrivalDateFrom('');
                                  setArrivalDateTo('');
                                }
                              }}
                              min={today}
                              max={
                                departureDateTo 
                                  ? departureDateTo 
                                  : arrivalDateFrom 
                                    ? arrivalDateFrom 
                                    : undefined
                              }
                              className="h-10"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="departureDateTo" className="text-xs text-gray-500">To</Label>
                            <Input
                              id="departureDateTo"
                              type="date"
                              value={departureDateTo}
                              onChange={(e) => {
                                setDepartureDateTo(e.target.value);
                                // If the new "To" date is after or equal to arrival "From", clear arrival dates
                                if (e.target.value && arrivalDateFrom && e.target.value >= arrivalDateFrom) {
                                  setArrivalDateFrom('');
                                  setArrivalDateTo('');
                                }
                              }}
                              min={departureDateFrom || today}
                              max={arrivalDateFrom ? arrivalDateFrom : undefined}
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
                              onChange={(e) => {
                                setArrivalDateFrom(e.target.value);
                                // If the new "From" date is after "To" date, clear "To" date
                                if (e.target.value && arrivalDateTo && e.target.value > arrivalDateTo) {
                                  setArrivalDateTo('');
                                }
                                // If the new "From" date is before or equal to departure "To", clear departure "To"
                                if (e.target.value && departureDateTo && e.target.value <= departureDateTo) {
                                  setDepartureDateTo('');
                                }
                                // If the new "From" date is before or equal to departure "From", clear departure dates
                                if (e.target.value && departureDateFrom && e.target.value <= departureDateFrom) {
                                  setDepartureDateFrom('');
                                  setDepartureDateTo('');
                                }
                              }}
                              min={
                                departureDateTo 
                                  ? departureDateTo 
                                  : departureDateFrom 
                                    ? departureDateFrom 
                                    : undefined
                              }
                              max={arrivalDateTo || undefined}
                              className="h-10"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="arrivalDateTo" className="text-xs text-gray-500">To</Label>
                            <Input
                              id="arrivalDateTo"
                              type="date"
                              value={arrivalDateTo}
                              onChange={(e) => {
                                setArrivalDateTo(e.target.value);
                                // If the new "To" date is before or equal to departure "To", clear departure "To"
                                if (e.target.value && departureDateTo && e.target.value <= departureDateTo) {
                                  setDepartureDateTo('');
                                }
                              }}
                              min={
                                arrivalDateFrom 
                                  ? arrivalDateFrom 
                                  : departureDateTo 
                                    ? departureDateTo 
                                    : departureDateFrom 
                                      ? departureDateFrom 
                                      : undefined
                              }
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
              {loading && allShipments.length === 0 ? (
                <Card>
                  <CardContent className="flex items-center justify-center py-8 md:py-12">
                    <Loader2 className="h-6 w-6 md:h-8 md:w-8 animate-spin text-orange-600" />
                  </CardContent>
                </Card>
              ) : allShipments.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8 md:py-12">
                    <Package className="h-12 w-12 md:h-16 md:w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2 text-sm md:text-base font-medium">No slots found</p>
                    <p className="text-xs md:text-sm text-gray-500 mb-4">Try adjusting your search filters</p>
                    {hasActiveFilters && (
                      <Button
                        variant="outline"
                        onClick={handleClearFilters}
                        className="text-sm"
                      >
                        Clear all filters
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="mb-4 md:mb-6 flex items-center justify-between">
                    <div className="text-xs md:text-sm text-gray-600">
                      Showing <span className="font-semibold text-gray-900">{startIndex + 1}</span> to{' '}
                      <span className="font-semibold text-gray-900">{Math.min(endIndex, allShipments.length)}</span> of{' '}
                      <span className="font-semibold text-gray-900">{allShipments.length}</span> slots
                    </div>
                  </div>

                  {/* Results Grid - No fixed height on mobile, scrollable on desktop */}
                  <div className="md:max-h-[800px] md:overflow-y-auto md:scrollbar-hide">
                    <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="mt-4 md:mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1 || loading}
                        className="w-full sm:w-auto flex items-center justify-center gap-1 h-9"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <span className="hidden sm:inline">Previous</span>
                        <span className="sm:hidden">Prev</span>
                      </Button>

                      <div className="flex items-center gap-1 overflow-x-auto max-w-full px-2">
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
                                  <span className="px-1 md:px-2 text-gray-400 text-sm">...</span>
                                )}
                                <Button
                                  variant={currentPage === page ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => handlePageChange(page)}
                                  disabled={loading}
                                  className={`min-w-[36px] md:min-w-[40px] h-9 ${currentPage === page
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
                        className="w-full sm:w-auto flex items-center justify-center gap-1 h-9"
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
                        className="w-full sm:w-auto h-10"
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
          </div>
        </main>
      </div>
    </GoogleMapsLoader>
  );
}


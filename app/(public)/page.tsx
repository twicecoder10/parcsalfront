'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { RouteCard } from '@/components/marketing/route-card';
import { 
  Search, Package, Truck, Shield, Zap, TrendingUp, CheckCircle, 
  Globe, Clock, Award, ArrowRight, MessageSquare, CreditCard,
  Users, FileCheck, Star, MapPin, Calendar, Filter, DollarSign, X,
  ChevronLeft, ChevronRight, Building2
} from 'lucide-react';
import { GoogleMapsLoader } from '@/components/google-maps-loader';
import { CountrySelect } from '@/components/country-select';
import { CitySelect } from '@/components/city-select';
import Image from 'next/image';

export default function LandingPage() {
  const router = useRouter();
  const [searchOriginCountry, setSearchOriginCountry] = useState('');
  const [searchOrigin, setSearchOrigin] = useState('');
  const [searchDestinationCountry, setSearchDestinationCountry] = useState('');
  const [searchDestination, setSearchDestination] = useState('');
  const [departureDateFrom, setDepartureDateFrom] = useState('');
  const [departureDateTo, setDepartureDateTo] = useState('');
  const [arrivalDateFrom, setArrivalDateFrom] = useState('');
  const [arrivalDateTo, setArrivalDateTo] = useState('');
  const [mode, setMode] = useState<string>('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false);
  
  // Slider state
  const sliderRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isAutoScrollPaused, setIsAutoScrollPaused] = useState(false);
  const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const today = new Date().toISOString().split('T')[0];

  // Allowed countries for the landing page dropdown
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

  // Helper to convert date string to ISO 8601 datetime
  const dateToISO = (dateString: string, isEndDate = false): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isEndDate) {
      date.setHours(23, 59, 59, 999);
    } else {
      date.setHours(0, 0, 0, 0);
    }
    return date.toISOString();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchOriginCountry) params.append('originCountry', searchOriginCountry);
    if (searchOrigin) params.append('originCity', searchOrigin);
    if (searchDestinationCountry) params.append('destinationCountry', searchDestinationCountry);
    if (searchDestination) params.append('destinationCity', searchDestination);
    
    if (departureDateFrom) params.append('dateFrom', dateToISO(departureDateFrom));
    if (departureDateTo) params.append('dateTo', dateToISO(departureDateTo, true));
    if (arrivalDateFrom) params.append('arrivalFrom', dateToISO(arrivalDateFrom));
    if (arrivalDateTo) params.append('arrivalTo', dateToISO(arrivalDateTo, true));
    if (mode && mode !== 'all') params.append('mode', mode);
    if (minPrice) params.append('minPrice', minPrice);
    if (maxPrice) params.append('maxPrice', maxPrice);
    
    router.push(`/shipments/browse?${params.toString()}`);
  };

  const activeFiltersCount = [
    departureDateFrom,
    departureDateTo,
    arrivalDateFrom,
    arrivalDateTo,
    mode !== 'all' ? mode : null,
    minPrice,
    maxPrice,
  ].filter(Boolean).length;

  // Popular routes data - Using only allowed countries
  const popularRoutes = [
    // Africa to Europe
    { 
      origin: 'Lagos', 
      originCountry: 'Nigeria',
      destination: 'London', 
      destinationCountry: 'United Kingdom',
      image: '/images/categories/air-freight.jpg',
      searchUrl: '/shipments/browse?originCountry=Nigeria&originCity=Lagos&destinationCountry=United+Kingdom&destinationCity=London'
    },
    { 
      origin: 'Accra', 
      originCountry: 'Ghana',
      destination: 'London', 
      destinationCountry: 'United Kingdom',
      image: '/images/categories/sea-freight.jpg',
      searchUrl: '/shipments/browse?originCountry=Ghana&originCity=Accra&destinationCountry=United+Kingdom&destinationCity=London'
    },
    { 
      origin: 'Dakar', 
      originCountry: 'Senegal',
      destination: 'Paris', 
      destinationCountry: 'France',
      image: '/images/categories/express-delivery.jpg',
      searchUrl: '/shipments/browse?originCountry=Senegal&originCity=Dakar&destinationCountry=France&destinationCity=Paris'
    },
    { 
      origin: 'Abidjan', 
      originCountry: 'Ivory Coast',
      destination: 'Paris', 
      destinationCountry: 'France',
      image: '/images/categories/air-freight.jpg',
      searchUrl: '/shipments/browse?originCountry=Ivory+Coast&originCity=Abidjan&destinationCountry=France&destinationCity=Paris'
    },
    { 
      origin: 'Lagos', 
      originCountry: 'Nigeria',
      destination: 'Berlin', 
      destinationCountry: 'Germany',
      image: '/images/categories/road-transport.jpg',
      searchUrl: '/shipments/browse?originCountry=Nigeria&originCity=Lagos&destinationCountry=Germany&destinationCity=Berlin'
    },
    { 
      origin: 'Casablanca', 
      originCountry: 'Morocco',
      destination: 'Madrid', 
      destinationCountry: 'Spain',
      image: '/images/categories/sea-freight.jpg',
      searchUrl: '/shipments/browse?originCountry=Morocco&originCity=Casablanca&destinationCountry=Spain&destinationCity=Madrid'
    },
    { 
      origin: 'Lagos', 
      originCountry: 'Nigeria',
      destination: 'Amsterdam', 
      destinationCountry: 'Netherlands',
      image: '/images/categories/air-freight.jpg',
      searchUrl: '/shipments/browse?originCountry=Nigeria&originCity=Lagos&destinationCountry=Netherlands&destinationCity=Amsterdam'
    },
    { 
      origin: 'Algiers', 
      originCountry: 'Algeria',
      destination: 'Paris', 
      destinationCountry: 'France',
      image: '/images/categories/express-delivery.jpg',
      searchUrl: '/shipments/browse?originCountry=Algeria&originCity=Algiers&destinationCountry=France&destinationCity=Paris'
    },
    // Europe to Africa
    { 
      origin: 'London', 
      originCountry: 'United Kingdom',
      destination: 'Lagos', 
      destinationCountry: 'Nigeria',
      image: '/images/categories/express-delivery.jpg',
      searchUrl: '/shipments/browse?originCountry=United+Kingdom&originCity=London&destinationCountry=Nigeria&destinationCity=Lagos'
    },
    { 
      origin: 'London', 
      originCountry: 'United Kingdom',
      destination: 'Accra', 
      destinationCountry: 'Ghana',
      image: '/images/categories/air-freight.jpg',
      searchUrl: '/shipments/browse?originCountry=United+Kingdom&originCity=London&destinationCountry=Ghana&destinationCity=Accra'
    },
    { 
      origin: 'Paris', 
      originCountry: 'France',
      destination: 'Dakar', 
      destinationCountry: 'Senegal',
      image: '/images/categories/express-delivery.jpg',
      searchUrl: '/shipments/browse?originCountry=France&originCity=Paris&destinationCountry=Senegal&destinationCity=Dakar'
    },
    { 
      origin: 'Paris', 
      originCountry: 'France',
      destination: 'Abidjan', 
      destinationCountry: 'Ivory Coast',
      image: '/images/categories/air-freight.jpg',
      searchUrl: '/shipments/browse?originCountry=France&originCity=Paris&destinationCountry=Ivory+Coast&destinationCity=Abidjan'
    },
    { 
      origin: 'Berlin', 
      originCountry: 'Germany',
      destination: 'Lagos', 
      destinationCountry: 'Nigeria',
      image: '/images/categories/sea-freight.jpg',
      searchUrl: '/shipments/browse?originCountry=Germany&originCity=Berlin&destinationCountry=Nigeria&destinationCity=Lagos'
    },
    { 
      origin: 'Madrid', 
      originCountry: 'Spain',
      destination: 'Casablanca', 
      destinationCountry: 'Morocco',
      image: '/images/categories/express-delivery.jpg',
      searchUrl: '/shipments/browse?originCountry=Spain&originCity=Madrid&destinationCountry=Morocco&destinationCity=Casablanca'
    },
    // USA to Africa
    { 
      origin: 'New York', 
      originCountry: 'United States',
      destination: 'Lagos', 
      destinationCountry: 'Nigeria',
      image: '/images/categories/air-freight.jpg',
      searchUrl: '/shipments/browse?originCountry=United+States&originCity=New+York&destinationCountry=Nigeria&destinationCity=Lagos'
    },
    { 
      origin: 'New York', 
      originCountry: 'United States',
      destination: 'Accra', 
      destinationCountry: 'Ghana',
      image: '/images/categories/air-freight.jpg',
      searchUrl: '/shipments/browse?originCountry=United+States&originCity=New+York&destinationCountry=Ghana&destinationCity=Accra'
    },
    // Africa to USA
    { 
      origin: 'Lagos', 
      originCountry: 'Nigeria',
      destination: 'New York', 
      destinationCountry: 'United States',
      image: '/images/categories/air-freight.jpg',
      searchUrl: '/shipments/browse?originCountry=Nigeria&originCity=Lagos&destinationCountry=United+States&destinationCity=New+York'
    },
    { 
      origin: 'Accra', 
      originCountry: 'Ghana',
      destination: 'New York', 
      destinationCountry: 'United States',
      image: '/images/categories/air-freight.jpg',
      searchUrl: '/shipments/browse?originCountry=Ghana&originCity=Accra&destinationCountry=United+States&destinationCity=New+York'
    },
    // Within Africa
    { 
      origin: 'Lagos', 
      originCountry: 'Nigeria',
      destination: 'Accra', 
      destinationCountry: 'Ghana',
      image: '/images/categories/road-transport.jpg',
      searchUrl: '/shipments/browse?originCountry=Nigeria&originCity=Lagos&destinationCountry=Ghana&destinationCity=Accra'
    },
    { 
      origin: 'Dakar', 
      originCountry: 'Senegal',
      destination: 'Casablanca', 
      destinationCountry: 'Morocco',
      image: '/images/categories/sea-freight.jpg',
      searchUrl: '/shipments/browse?originCountry=Senegal&originCity=Dakar&destinationCountry=Morocco&destinationCity=Casablanca'
    },
    { 
      origin: 'Lagos', 
      originCountry: 'Nigeria',
      destination: 'Johannesburg', 
      destinationCountry: 'South Africa',
      image: '/images/categories/air-freight.jpg',
      searchUrl: '/shipments/browse?originCountry=Nigeria&originCity=Lagos&destinationCountry=South+Africa&destinationCity=Johannesburg'
    },
    { 
      origin: 'Yaoundé', 
      originCountry: 'Cameroon',
      destination: 'Lagos', 
      destinationCountry: 'Nigeria',
      image: '/images/categories/road-transport.jpg',
      searchUrl: '/shipments/browse?originCountry=Cameroon&originCity=Yaoundé&destinationCountry=Nigeria&destinationCity=Lagos'
    },
    // Within Europe
    { 
      origin: 'London', 
      originCountry: 'United Kingdom',
      destination: 'Paris', 
      destinationCountry: 'France',
      image: '/images/categories/road-transport.jpg',
      searchUrl: '/shipments/browse?originCountry=United+Kingdom&originCity=London&destinationCountry=France&destinationCity=Paris'
    },
    { 
      origin: 'Berlin', 
      originCountry: 'Germany',
      destination: 'Amsterdam', 
      destinationCountry: 'Netherlands',
      image: '/images/categories/road-transport.jpg',
      searchUrl: '/shipments/browse?originCountry=Germany&originCity=Berlin&destinationCountry=Netherlands&destinationCity=Amsterdam'
    },
  ];

  // Check scroll position for navigation buttons
  const checkScrollPosition = () => {
    if (sliderRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  // Scroll functions
  const scrollSlider = (direction: 'left' | 'right') => {
    if (sliderRef.current) {
      const scrollAmount = sliderRef.current.clientWidth * 0.8;
      const targetScroll = direction === 'left'
        ? sliderRef.current.scrollLeft - scrollAmount
        : sliderRef.current.scrollLeft + scrollAmount;

      sliderRef.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
    }
  };

  // Auto-scroll function
  const autoScroll = useCallback(() => {
    if (sliderRef.current && !isAutoScrollPaused) {
      const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
      
      // If at the end, scroll back to start
      if (scrollLeft >= scrollWidth - clientWidth - 10) {
        sliderRef.current.scrollTo({
          left: 0,
          behavior: 'smooth'
        });
      } else {
        // Scroll to the right
        scrollSlider('right');
      }
    }
  }, [isAutoScrollPaused]);

  // Check scroll position on mount and resize
  useEffect(() => {
    checkScrollPosition();
    const handleResize = () => checkScrollPosition();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-scroll effect
  useEffect(() => {
    // Start auto-scroll
    autoScrollIntervalRef.current = setInterval(() => {
      autoScroll();
    }, 2000); // Scroll every 4 seconds

    return () => {
      // Clean up interval on unmount
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
      }
    };
  }, [autoScroll]);

  return (
    <GoogleMapsLoader>
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />
        
        <main className="flex-1 pt-16 md:pt-20">
          {/* Hero Section */}
          <section className="relative pt-12 pb-16 md:pt-24 md:pb-32 overflow-hidden">
            {/* Background Video/Image */}
            <div className="absolute inset-0 z-0">
              <video 
                autoPlay 
                loop 
                muted 
                playsInline
                className="w-full h-full object-cover"
              >
                <source src="/videos/hero-background.mp4" type="video/mp4" />
              </video>
              {/* Fallback image */}
              <Image 
                src="/images/hero/hero-bg.jpg"
                alt="Logistics background"
                fill
                className="object-cover -z-10"
                priority
              />
              {/* Gradient overlay for text readability */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/45 to-black/65" />
            </div>

            <div className="container mx-auto px-4 relative z-10">
              <div className="max-w-4xl mx-auto text-center mb-8 md:mb-12">
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4 md:mb-6 leading-tight">
                  Book space on upcoming<br className="hidden sm:block" />
                  <span className="text-orange-300"> shipment routes</span>
                </h1>
                <p className="text-base md:text-lg lg:text-xl text-white/90 max-w-2xl mx-auto font-semibold">
                  Connect with verified carriers. Send parcels worldwide. Track everything in real-time.
                </p>
              </div>

              {/* Search Card */}
              <div className="max-w-5xl mx-auto">
                <Card className="border-2 shadow-2xl">
                  <CardContent className="p-4 md:p-8">
                    <form onSubmit={handleSearch}>
                      {/* Mobile: 2x2 Grid, Desktop: 4 columns */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-3 md:mb-4">
                        {/* From Country */}
                        <div className="space-y-1 md:space-y-2">
                          <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide block">
                            From Country
                          </label>
                          <CountrySelect
                            value={searchOriginCountry}
                            onChange={(value) => {
                              setSearchOriginCountry(value);
                              setSearchOrigin('');
                            }}
                            label=""
                            placeholder="Country"
                            allowedCountries={allowedCountries}
                            className="[&_button]:h-10 md:[&_button]:h-12 [&_button]:border-2 [&_button]:text-xs md:[&_button]:text-sm"
                          />
                        </div>

                        {/* From City */}
                        <div className="space-y-1 md:space-y-2">
                          <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide block">
                            From City
                          </label>
                          <CitySelect
                            value={searchOrigin}
                            onChange={(value) => setSearchOrigin(value)}
                            country={searchOriginCountry}
                            label=""
                            placeholder="City"
                            disabled={!searchOriginCountry}
                            className="[&_button]:h-10 md:[&_button]:h-12 [&_button]:border-2 [&_button]:text-xs md:[&_button]:text-sm"
                          />
                        </div>

                        {/* To Country */}
                        <div className="space-y-1 md:space-y-2">
                          <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide block">
                            To Country
                          </label>
                          <CountrySelect
                            value={searchDestinationCountry}
                            onChange={(value) => {
                              setSearchDestinationCountry(value);
                              setSearchDestination('');
                            }}
                            label=""
                            placeholder="Country"
                            allowedCountries={allowedCountries}
                            className="[&_button]:h-10 md:[&_button]:h-12 [&_button]:border-2 [&_button]:text-xs md:[&_button]:text-sm"
                          />
                        </div>

                        {/* To City */}
                        <div className="space-y-1 md:space-y-2">
                          <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide block">
                            To City
                          </label>
                          <CitySelect
                            value={searchDestination}
                            onChange={(value) => setSearchDestination(value)}
                            country={searchDestinationCountry}
                            label=""
                            placeholder="City"
                            disabled={!searchDestinationCountry}
                            className="[&_button]:h-10 md:[&_button]:h-12 [&_button]:border-2 [&_button]:text-xs md:[&_button]:text-sm"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsFiltersModalOpen(true)}
                          className="h-8 md:h-14 px-4 md:px-6 border-2 text-sm md:text-base"
                        >
                          <Filter className="mr-2 h-4 md:h-5 w-4 md:w-5" />
                          Filters
                          {activeFiltersCount > 0 && (
                            <span className="ml-2 px-1.5 md:px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold">
                              {activeFiltersCount}
                            </span>
                          )}
                        </Button>
                        <Button 
                          type="submit" 
                          className="flex-1 h-8 md:h-14 text-sm md:text-base bg-orange-600 hover:bg-orange-700 shadow-md hover:shadow-lg transition-all font-semibold"
                        >
                          <Search className="mr-2 h-5 w-5" />
                          Find shipments
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>

                {/* Quick Action Links */}
                <div className="mt-4 md:mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4">
                  <Link href="/companies/browse" className="w-full sm:w-auto">
                    <Button 
                      variant="outline" 
                      className="w-full sm:w-auto h-10 md:h-12 px-6 md:px-8 bg-white/90 backdrop-blur-sm border-2 border-white text-gray-800 hover:bg-white hover:text-orange-600 font-semibold shadow-lg transition-all"
                    >
                      <Building2 className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                      Browse All Companies
                    </Button>
                  </Link>
                  <Link href="/track" className="w-full sm:w-auto">
                    <Button 
                      variant="outline" 
                      className="w-full sm:w-auto h-10 md:h-12 px-6 md:px-8 bg-white/90 backdrop-blur-sm border-2 border-white text-gray-800 hover:bg-white hover:text-orange-600 font-semibold shadow-lg transition-all"
                    >
                      <Package className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                      Track Your Booking
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Filters Modal */}
              <Dialog open={isFiltersModalOpen} onOpenChange={setIsFiltersModalOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                      <Filter className="h-6 w-6 text-orange-600" />
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
                              <Label className="text-xs text-gray-500">From</Label>
                              <Input
                                type="date"
                                value={departureDateFrom}
                                onChange={(e) => setDepartureDateFrom(e.target.value)}
                                min={today}
                                className="h-10"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs text-gray-500">To</Label>
                              <Input
                                type="date"
                                value={departureDateTo}
                                onChange={(e) => setDepartureDateTo(e.target.value)}
                                min={departureDateFrom || today}
                                className="h-10"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">Arrival Date</Label>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label className="text-xs text-gray-500">From</Label>
                              <Input
                                type="date"
                                value={arrivalDateFrom}
                                onChange={(e) => setArrivalDateFrom(e.target.value)}
                                min={departureDateFrom || today}
                                className="h-10"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs text-gray-500">To</Label>
                              <Input
                                type="date"
                                value={arrivalDateTo}
                                onChange={(e) => setArrivalDateTo(e.target.value)}
                                min={arrivalDateFrom || departureDateFrom || today}
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
            </div>
          </section>

          {/* Popular Routes Slider */}
          <section className="py-12 md:py-24 bg-gray-50">
            <div className="w-full">
              {/* Header - Centered with Container */}
              <div className="container mx-auto px-4 mb-8 md:mb-12">
                <div className="text-center">
                  <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-3 md:mb-4">
                    Popular routes
                  </h2>
                  <p className="text-base md:text-lg text-gray-600">
                    Discover frequently booked shipping routes
                  </p>
                </div>
              </div>

              {/* Full Width Slider */}
              <div className="relative group w-full">
                {/* Navigation Buttons */}
                {canScrollLeft && (
                  <button
                    onClick={() => scrollSlider('left')}
                    className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-3 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 opacity-0 md:opacity-100 md:group-hover:opacity-100 opacity-100"
                    aria-label="Scroll left"
                  >
                    <ChevronLeft className="h-6 w-6 text-orange-600" />
                  </button>
                )}
                {canScrollRight && (
                  <button
                    onClick={() => scrollSlider('right')}
                    className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-3 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 opacity-0 md:opacity-100 md:group-hover:opacity-100 opacity-100"
                    aria-label="Scroll right"
                  >
                    <ChevronRight className="h-6 w-6 text-orange-600" />
                  </button>
                )}

                {/* Slider Container */}
                <div
                  ref={sliderRef}
                  onScroll={checkScrollPosition}
                  onMouseEnter={() => setIsAutoScrollPaused(true)}
                  onMouseLeave={() => setIsAutoScrollPaused(false)}
                  className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4 snap-x snap-mandatory px-4 md:px-8"
                  style={{
                    scrollSnapType: 'x mandatory',
                    WebkitOverflowScrolling: 'touch',
                  }}
                >
                  {popularRoutes.map((route, index) => (
                    <div
                      key={index}
                      className="flex-shrink-0 w-[85vw] sm:w-[45vw] lg:w-[30vw] xl:w-[23vw] snap-start animate-slide-in"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <RouteCard 
                        origin={route.origin}
                        destination={route.destination}
                        image={route.image}
                        searchUrl={route.searchUrl}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* How It Works with Video - Redesigned Side-by-Side */}
          <section id="how-it-works" className="py-12 md:py-24 bg-white">
            <div className="container mx-auto px-4">
              <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12 md:mb-16">
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                    How it works
                  </h2>
                  <p className="text-lg md:text-xl text-gray-600">
                    Simple and transparent for everyone
                  </p>
                </div>

                <Tabs defaultValue="customers" className="w-full">
                  <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-16">
                    <TabsTrigger value="customers" className="text-base">
                      <Package className="h-4 w-4 mr-2" />
                      For Customers
                    </TabsTrigger>
                    <TabsTrigger value="companies" className="text-base">
                      <Truck className="h-4 w-4 mr-2" />
                      For Companies
                    </TabsTrigger>
                  </TabsList>

                  {/* For Customers - Video on Right */}
                  <TabsContent value="customers">
                    <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center mb-12">
                      {/* Left Side - Content */}
                      <div className="order-2 lg:order-1 space-y-6">
                        <div className="space-y-4">
                          <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 px-3 py-1 text-sm">
                            For Customers
                          </Badge>
                          <h3 className="text-3xl md:text-4xl font-bold text-gray-900">
                            Ship your parcels with ease
                          </h3>
                          <p className="text-lg text-gray-600">
                            Book space on verified shipment routes and track your parcels in real-time from pickup to delivery.
                          </p>
                        </div>

                        <div className="space-y-4">
                          {[
                            {
                              number: '1',
                              title: 'Search routes',
                              description: 'Browse available shipments by route, date, and price. Compare options instantly.',
                              icon: Search,
                            },
                            {
                              number: '2',
                              title: 'Book & pay securely',
                              description: 'Reserve your slot with secure payment. Get instant confirmation.',
                              icon: CreditCard,
                            },
                            {
                              number: '3',
                              title: 'Track delivery',
                              description: 'Monitor your parcel with real-time updates until safe arrival.',
                              icon: MapPin,
                            },
                          ].map((step, index) => (
                            <div key={index} className="flex gap-4 items-start group">
                              <div className="flex-shrink-0">
                                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center group-hover:bg-orange-600 transition-all duration-300">
                                  <step.icon className="h-6 w-6 text-orange-600 group-hover:text-white transition-colors" />
                                </div>
                              </div>
                              <div className="flex-1">
                                <h4 className="text-lg font-bold text-gray-900 mb-1">
                                  {step.number}. {step.title}
                                </h4>
                                <p className="text-gray-600">{step.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="pt-4">
                          <Link href="/auth/register-customer">
                            <Button size="lg" className="bg-orange-600 hover:bg-orange-700 text-white px-8 h-12">
                              Get started as a customer
                              <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                          </Link>
                        </div>
                      </div>

                      {/* Right Side - Video */}
                      <div className="order-1 lg:order-2">
                        <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-black border-2 border-orange-200">
                          <video
                            className="w-full h-full object-cover"
                            autoPlay
                            muted
                            loop
                            playsInline
                          >
                            <source src="/videos/how-to-customer.mp4" type="video/mp4" />
                          </video>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* For Companies - Video on Left */}
                  <TabsContent value="companies">
                    <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center mb-12">
                      {/* Left Side - Video */}
                      <div className="order-1">
                        <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-black border-2 border-orange-200">
                          <video
                            className="w-full h-full object-cover"
                            autoPlay
                            muted
                            loop
                            playsInline
                          >
                            <source src="/videos/how-to-company.mp4" type="video/mp4" />
                          </video>
                        </div>
                      </div>

                      {/* Right Side - Content */}
                      <div className="order-2 space-y-6">
                        <div className="space-y-4">
                          <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 px-3 py-1 text-sm">
                            For Companies
                          </Badge>
                          <h3 className="text-3xl md:text-4xl font-bold text-gray-900">
                            Maximize your capacity
                          </h3>
                          <p className="text-lg text-gray-600">
                            List your available space, connect with customers, and grow your logistics business with our platform.
                          </p>
                        </div>

                        <div className="space-y-4">
                          {[
                            {
                              number: '1',
                              title: 'List capacity',
                              description: 'Create shipment routes with your available space, pricing, and schedule.',
                              icon: TrendingUp,
                            },
                            {
                              number: '2',
                              title: 'Manage bookings',
                              description: 'Accept reservations and communicate through our secure platform.',
                              icon: Users,
                            },
                            {
                              number: '3',
                              title: 'Get paid',
                              description: 'Receive payments securely after delivery. Track earnings easily.',
                              icon: Zap,
                            },
                          ].map((step, index) => (
                            <div key={index} className="flex gap-4 items-start group">
                              <div className="flex-shrink-0">
                                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center group-hover:bg-orange-600 transition-all duration-300">
                                  <step.icon className="h-6 w-6 text-orange-600 group-hover:text-white transition-colors" />
                                </div>
                              </div>
                              <div className="flex-1">
                                <h4 className="text-lg font-bold text-gray-900 mb-1">
                                  {step.number}. {step.title}
                                </h4>
                                <p className="text-gray-600">{step.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="pt-4">
                          <Link href="/auth/register-company">
                            <Button size="lg" className="bg-orange-600 hover:bg-orange-700 text-white px-8 h-12">
                              Get started as a company
                              <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </section>

          {/* Value Props - Redesigned with Image + Cards Layout */}
          <section className="py-12 md:py-24 bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="container mx-auto px-4">
              <div className="max-w-7xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                  {/* Left Side - Image */}
                  <div className="order-2 lg:order-1">
                    <div className="relative rounded-3xl overflow-hidden shadow-2xl h-[500px] lg:h-[650px]">
                      <Image 
                        src="/images/categories/warehouse.jpg"
                        alt="Modern logistics and warehouse operations"
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-tr from-orange-900/40 to-transparent" />
                      {/* Overlay content */}
                      <div className="absolute bottom-8 left-8 text-white">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <Award className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold">Trusted by thousands</h3>
                            <p className="text-white/90 text-sm">Across 50+ countries</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Side - Feature Cards */}
                  <div className="order-1 lg:order-2 space-y-4">
                    <div className="mb-8">
                      <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                        Why choose Parcsal?
                      </h2>
                      <p className="text-lg text-gray-600">
                        Experience the next generation of shipping with powerful features designed for your success
                      </p>
                    </div>

                    <div className="space-y-4">
                      {[
                        {
                          icon: CreditCard,
                          title: 'Transparent Pricing',
                          description: 'See all costs upfront. No hidden fees or surprises.',
                        },
                        {
                          icon: Shield,
                          title: 'Secure Payments',
                          description: 'Bank-level encryption protects every transaction.',
                        },
                        {
                          icon: CheckCircle,
                          title: 'Verified Carriers',
                          description: 'All shipping companies are verified and insured.',
                        },
                        {
                          icon: Globe,
                          title: 'Real-Time Tracking',
                          description: 'Monitor shipments with live updates at every stage.',
                        },
                        {
                          icon: MessageSquare,
                          title: 'In-App Messaging',
                          description: 'Secure communication without sharing contact details.',
                        },
                        {
                          icon: FileCheck,
                          title: 'Customer-Approved Extras',
                          description: 'You approve all additional costs. No surprise charges.',
                        },
                      ].map((feature, index) => (
                        <div
                          key={index}
                          className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-orange-300 hover:shadow-xl transition-all duration-300 group cursor-pointer"
                        >
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center group-hover:bg-orange-600 transition-all duration-300">
                                <feature.icon className="h-6 w-6 text-orange-600 group-hover:text-white transition-colors" />
                              </div>
                            </div>
                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
                                {feature.title}
                              </h3>
                              <p className="text-gray-600 leading-relaxed">
                                {feature.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Safety & Trust */}
          <section id="safety" className="py-12 md:py-24 bg-white">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8 md:mb-12">
                  <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-3 md:mb-4">
                    Your safety is our priority
                  </h2>
                  <p className="text-base md:text-lg text-gray-600">
                    We&apos;ve built trust into every part of the platform
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 mb-12">
                  {[
                    {
                      icon: Shield,
                      title: 'Secure payments',
                      description: 'Payments held securely until delivery is confirmed.',
                    },
                    {
                      icon: Users,
                      title: 'Privacy protected',
                      description: 'We never share your contact details with carriers.',
                    },
                    {
                      icon: MessageSquare,
                      title: 'Support & disputes',
                      description: '24/7 customer support and dispute resolution.',
                    },
                  ].map((item, index) => (
                    <div key={index} className="text-center">
                      <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-4">
                        <item.icon className="h-8 w-8 text-green-600" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                      <p className="text-gray-600 text-sm">{item.description}</p>
                    </div>
                  ))}
                </div>

                <div className="text-center">
                  <p className="text-sm text-gray-500">
                    Payment processing powered by <span className="font-semibold text-gray-700">Stripe</span>
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Pricing Summary */}
          <section className="py-12 md:py-24 bg-gray-50">
            <div className="container mx-auto px-4">
              <div className="max-w-5xl mx-auto">
                <div className="text-center mb-8 md:mb-12">
                  <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-3 md:mb-4">
                    Simple, transparent pricing
                  </h2>
                  <p className="text-base md:text-lg text-gray-600">
                    Choose the plan that works for you
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  {/* Customers */}
                  <Card className="border-2">
                    <CardHeader>
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="h-6 w-6 text-orange-600" />
                        <CardTitle className="text-2xl">For Customers</CardTitle>
                      </div>
                      <CardDescription className="text-base">
                        Pay per booking
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3 mb-6">
                        {[
                          'No monthly fees',
                          'Pay only when you ship',
                          'Transparent pricing',
                        ].map((item, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700">{item}</span>
                          </li>
                        ))}
                      </ul>
                      <Link href="/auth/register-customer">
                        <Button className="w-full bg-orange-600 hover:bg-orange-700">
                          Get started free
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>

                  {/* Companies */}
                  <Card className="border-2 border-orange-200 bg-orange-50/30">
                    <CardHeader>
                      <div className="flex items-center gap-2 mb-2">
                        <Truck className="h-6 w-6 text-orange-600" />
                        <CardTitle className="text-2xl">For Companies</CardTitle>
                      </div>
                      <CardDescription className="text-base">
                        Subscription plans available
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3 mb-6">
                        {[
                          'Free: £0/month (15% commission)',
                          'Starter: £49/month (15% commission, most popular)',
                          'Professional: £149/month (15% commission)',
                          'Enterprise: From £500/month (12–14% negotiable)',
                        ].map((item, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700">{item}</span>
                          </li>
                        ))}
                      </ul>
                      <Link href="/pricing">
                        <Button variant="outline" className="w-full border-2 border-orange-600 text-orange-600 hover:bg-orange-600 hover:text-white">
                          View pricing
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </section>

          {/* Final CTA */}
          <section className="py-12 md:py-24 bg-gradient-to-br from-orange-600 to-orange-500 text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }} />

            <div className="container mx-auto px-4 relative">
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="text-2xl md:text-5xl font-bold mb-4 md:mb-6">
                  Ship smarter with Parcsal
                </h2>
                <p className="text-lg md:text-2xl text-white/95 mb-8 md:mb-10">
                  Join thousands who trust us with their shipping needs
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/shipments/browse">
                    <Button size="lg" className="bg-white text-orange-600 hover:bg-gray-100 text-base px-8 h-14 shadow-xl hover:shadow-2xl">
                      <Search className="mr-2 h-5 w-5" />
                      Find shipments
                    </Button>
                  </Link>
                  <Link href="/auth/register-company">
                    <Button size="lg" variant="outline" className="bg-transparent text-white border-2 border-white hover:bg-white/10 text-base px-8 h-14">
                      <Truck className="mr-2 h-5 w-5" />
                      List a shipment
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </GoogleMapsLoader>
  );
}

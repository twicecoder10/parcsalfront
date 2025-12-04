'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { ShipmentCard } from '@/components/shipment-card';
import { shipmentApi } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { Search, Package, Truck, Users, Star, ArrowRight, Shield, Zap, TrendingUp, Loader2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { GoogleMapsLoader } from '@/components/google-maps-loader';
import { CountrySelect } from '@/components/country-select';
import { CitySelect } from '@/components/city-select';
import { isShipmentAvailable } from '@/lib/utils';

export default function LandingPage() {
  const router = useRouter();
  const [searchOriginCountry, setSearchOriginCountry] = useState('');
  const [searchOrigin, setSearchOrigin] = useState('');
  const [searchDestinationCountry, setSearchDestinationCountry] = useState('');
  const [searchDestination, setSearchDestination] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const sliderRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const scrollResumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch available shipments
  const { data: shipmentsData, isLoading: shipmentsLoading, error: shipmentsError } = useQuery({
    queryKey: ['shipments', 'featured'],
    queryFn: () => shipmentApi.search({ 
      limit: 6,
      offset: 0,
    }),
    staleTime: 60000, // Cache for 1 minute
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Build search query and redirect
    const params = new URLSearchParams();
    if (searchOriginCountry) params.append('originCountry', searchOriginCountry);
    if (searchOrigin) params.append('originCity', searchOrigin);
    if (searchDestinationCountry) params.append('destinationCountry', searchDestinationCountry);
    if (searchDestination) params.append('destinationCity', searchDestination);
    if (searchDate) params.append('date', searchDate);
    router.push(`/shipments/browse?${params.toString()}`);
  };

  // Filter out shipments where cutoff time or departure time has passed
  const shipments = (shipmentsData?.data || []).filter((shipment: any) => 
    isShipmentAvailable({
      cutoffTimeForReceivingItems: shipment.cutoffTimeForReceivingItems,
      departureTime: shipment.departureTime,
    })
  );

  // Check scroll position for navigation buttons
  const checkScrollPosition = () => {
    if (sliderRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScrollPosition();
    // Also check on window resize
    const handleResize = () => checkScrollPosition();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [shipments]);

  // Auto-scroll functionality
  useEffect(() => {
    if (!sliderRef.current || shipments.length === 0 || isPaused) {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
        autoScrollIntervalRef.current = null;
      }
      return;
    }

    // Clear any existing interval
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
    }

    // Set up auto-scroll
    autoScrollIntervalRef.current = setInterval(() => {
      if (sliderRef.current && !isPaused) {
        const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
        const maxScroll = scrollWidth - clientWidth;
        
        // If we're at the end, scroll back to the beginning
        if (scrollLeft >= maxScroll - 10) {
          sliderRef.current.scrollTo({
            left: 0,
            behavior: 'smooth'
          });
        } else {
          // Otherwise, scroll forward
          const scrollAmount = clientWidth * 0.5; // Scroll half a viewport at a time
          sliderRef.current.scrollBy({
            left: scrollAmount,
            behavior: 'smooth'
          });
        }
      }
    }, 1500); // Auto-scroll every 1.5 seconds

    return () => {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
        autoScrollIntervalRef.current = null;
      }
      if (scrollResumeTimeoutRef.current) {
        clearTimeout(scrollResumeTimeoutRef.current);
        scrollResumeTimeoutRef.current = null;
      }
    };
  }, [shipments, isPaused]);

  const scrollSlider = (direction: 'left' | 'right') => {
    if (sliderRef.current) {
      setIsPaused(true); // Pause auto-scroll when user manually scrolls
      const scrollAmount = sliderRef.current.clientWidth * 0.8;
      const targetScroll = direction === 'left' 
        ? sliderRef.current.scrollLeft - scrollAmount
        : sliderRef.current.scrollLeft + scrollAmount;
      
      sliderRef.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
      
      // Resume auto-scroll after 5 seconds of inactivity
      if (scrollResumeTimeoutRef.current) {
        clearTimeout(scrollResumeTimeoutRef.current);
      }
      scrollResumeTimeoutRef.current = setTimeout(() => setIsPaused(false), 5000);
    }
  };

  return (
    <GoogleMapsLoader>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-orange-50 to-white py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-5xl font-bold mb-6 text-gray-900">
                The Marketplace for Shipment Slots
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Connect shippers with available capacity. Find routes, book slots, or list your shipping capacity.
              </p>
              <div className="flex gap-4 justify-center">
                <Link href="/shipments/browse">
                  <Button size="lg" className="bg-orange-600 hover:bg-orange-700">
                    Find a Slot
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/auth/register-company">
                  <Button size="lg" variant="outline" className="border-2">
                    List Your Capacity
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Search Bar */}
        <section className="py-4 bg-white border-b">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <form onSubmit={handleSearch} className="p-3 bg-white border rounded-lg shadow-sm">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 items-end">
                  <div className="space-y-1">
                    <CountrySelect
                      value={searchOriginCountry}
                      onChange={(value) => {
                        setSearchOriginCountry(value);
                        setSearchOrigin('');
                      }}
                      label="Origin Country"
                      placeholder="Select origin country"
                    />
                  </div>
                  <div className="space-y-1">
                    <CitySelect
                      value={searchOrigin}
                      onChange={(value) => setSearchOrigin(value)}
                      country={searchOriginCountry}
                      label="Origin City"
                      placeholder="Select origin city"
                      disabled={!searchOriginCountry}
                    />
                  </div>
                  <div className="space-y-1">
                    <CountrySelect
                      value={searchDestinationCountry}
                      onChange={(value) => {
                        setSearchDestinationCountry(value);
                        setSearchDestination('');
                      }}
                      label="Destination Country"
                      placeholder="Select destination country"
                    />
                  </div>
                  <div className="space-y-1">
                    <CitySelect
                      value={searchDestination}
                      onChange={(value) => setSearchDestination(value)}
                      country={searchDestinationCountry}
                      label="Destination City"
                      placeholder="Select destination city"
                      disabled={!searchDestinationCountry}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium block">Date</label>
                    <Input 
                      type="date" 
                      value={searchDate}
                      onChange={(e) => setSearchDate(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
                <div className="mt-2 flex justify-end">
                  <Button type="submit" className="h-9">
                    <Search className="mr-2 h-4 w-4" />
                    Search
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </section>

        {/* Available Slots */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Available Slots</h2>
                  <p className="text-gray-600">Browse our latest available shipment slots</p>
                </div>
                <Link href="/shipments/browse">
                  <Button variant="outline">
                    View All
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>

              {shipmentsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
                  <span className="ml-3 text-gray-600">Loading slots...</span>
                </div>
              ) : shipmentsError ? (
                <div className="flex flex-col items-center justify-center py-12 bg-white rounded-lg border">
                  <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                  <p className="text-gray-700 mb-2">Failed to load slots</p>
                  <p className="text-sm text-gray-500">Please try again later</p>
                </div>
              ) : shipments.length > 0 ? (
                <div 
                  className="relative group"
                  onMouseEnter={() => setIsPaused(true)}
                  onMouseLeave={() => setIsPaused(false)}
                  onTouchStart={() => setIsPaused(true)}
                  onTouchEnd={() => {
                    // Resume after touch ends, with a delay
                    if (scrollResumeTimeoutRef.current) {
                      clearTimeout(scrollResumeTimeoutRef.current);
                    }
                    scrollResumeTimeoutRef.current = setTimeout(() => setIsPaused(false), 3000);
                  }}
                >
                  {/* Navigation Buttons */}
                  {canScrollLeft && (
                    <button
                      onClick={() => scrollSlider('left')}
                      className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 md:opacity-0 md:group-hover:opacity-100 opacity-100 active:scale-95"
                      aria-label="Scroll left"
                    >
                      <ChevronLeft className="h-6 w-6 text-orange-600" />
                    </button>
                  )}
                  {canScrollRight && (
                    <button
                      onClick={() => scrollSlider('right')}
                      className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 md:opacity-0 md:group-hover:opacity-100 opacity-100 active:scale-95"
                      aria-label="Scroll right"
                    >
                      <ChevronRight className="h-6 w-6 text-orange-600" />
                    </button>
                  )}

                  {/* Slider Container */}
                  <div
                    ref={sliderRef}
                    className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4 -mx-4 px-4 snap-x snap-mandatory"
                    onScroll={() => {
                      checkScrollPosition();
                      // Pause auto-scroll when user manually scrolls
                      setIsPaused(true);
                      // Resume after 3 seconds of no scrolling
                      if (scrollResumeTimeoutRef.current) {
                        clearTimeout(scrollResumeTimeoutRef.current);
                      }
                      scrollResumeTimeoutRef.current = setTimeout(() => {
                        setIsPaused(false);
                      }, 3000);
                    }}
                  >
                    {shipments.map((shipment: any, index: number) => (
                      <div
                        key={shipment.id}
                        className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] md:w-[calc(33.333%-16px)] lg:w-[calc(33.333%-16px)] snap-start animate-slide-in transform transition-transform duration-300 hover:scale-[1.02]"
                        style={{
                          animationDelay: `${index * 0.08}s`,
                        }}
                      >
                        <ShipmentCard shipment={shipment} />
                      </div>
                  ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 bg-white rounded-lg border">
                  <Package className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-700 mb-2">No slots available</p>
                  <p className="text-sm text-gray-500">Check back later for new listings</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 bg-orange-600 text-white">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center max-w-5xl mx-auto">
              <div>
                <div className="text-3xl md:text-4xl font-bold mb-2">1000+</div>
                <div className="text-orange-100 text-sm">Active Users</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold mb-2">500+</div>
                <div className="text-orange-100 text-sm">Verified Companies</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold mb-2">10K+</div>
                <div className="text-orange-100 text-sm">Shipments Booked</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold mb-2">99%</div>
                <div className="text-orange-100 text-sm">Satisfaction Rate</div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
            <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
              <div>
                <h3 className="text-2xl font-semibold mb-6 text-orange-600">For Customers</h3>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold">1</div>
                    <div>
                      <h4 className="font-semibold mb-1">Search Routes</h4>
                      <p className="text-gray-600">Browse available shipment slots by origin, destination, and date.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold">2</div>
                    <div>
                      <h4 className="font-semibold mb-1">Book & Pay</h4>
                      <p className="text-gray-600">Select a slot, enter your shipment details, and complete payment.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold">3</div>
                    <div>
                      <h4 className="font-semibold mb-1">Track & Receive</h4>
                      <p className="text-gray-600">Monitor your shipment status and receive updates until delivery.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-semibold mb-6 text-orange-600">For Companies</h3>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold">1</div>
                    <div>
                      <h4 className="font-semibold mb-1">List Slots</h4>
                      <p className="text-gray-600">Create shipment slots with routes, capacity, and pricing.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold">2</div>
                    <div>
                      <h4 className="font-semibold mb-1">Accept Bookings</h4>
                      <p className="text-gray-600">Review and accept booking requests from customers.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold">3</div>
                    <div>
                      <h4 className="font-semibold mb-1">Manage & Deliver</h4>
                      <p className="text-gray-600">Update shipment status and manage deliveries efficiently.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Who It's For */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Who It&apos;s For</h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <Card>
                <CardHeader>
                  <Users className="h-12 w-12 text-orange-600 mb-4" />
                  <CardTitle>Individuals</CardTitle>
                  <CardDescription>
                    Send packages and personal items safely and affordably.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <Package className="h-12 w-12 text-orange-600 mb-4" />
                  <CardTitle>Small Businesses</CardTitle>
                  <CardDescription>
                    Find reliable shipping options for your business needs.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <Truck className="h-12 w-12 text-orange-600 mb-4" />
                  <CardTitle>Logistics Companies</CardTitle>
                  <CardDescription>
                    Maximize capacity utilization and reach new customers.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* Key Benefits */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Why Choose Parcsal?</h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <Card>
                <CardHeader>
                  <div className="rounded-full bg-orange-100 p-3 w-fit mb-4">
                    <Shield className="h-8 w-8 text-orange-600" />
                  </div>
                  <CardTitle>Secure & Trusted</CardTitle>
                  <CardDescription>
                    All transactions are protected with industry-standard encryption. Every company is verified before joining our platform.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <div className="rounded-full bg-orange-100 p-3 w-fit mb-4">
                    <Zap className="h-8 w-8 text-orange-600" />
                  </div>
                  <CardTitle>Fast & Easy</CardTitle>
                  <CardDescription>
                    Find and book shipment slots in minutes. Simple search, instant booking, and real-time tracking all in one place.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <div className="rounded-full bg-orange-100 p-3 w-fit mb-4">
                    <TrendingUp className="h-8 w-8 text-orange-600" />
                  </div>
                  <CardTitle>Cost Effective</CardTitle>
                  <CardDescription>
                    Compare prices from multiple providers and get the best deals. Transparent pricing with no hidden fees.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">What Our Users Say</h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4">
                    &quot;Parcsal made shipping so easy! Found exactly what I needed in minutes and the booking process was seamless.&quot;
                  </p>
                  <div>
                    <p className="font-semibold">Sarah Johnson</p>
                    <p className="text-sm text-gray-600">Small Business Owner</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4">
                    &quot;As a logistics company, Parcsal helped us maximize our capacity utilization. The platform is intuitive and customer support is excellent.&quot;
                  </p>
                  <div>
                    <p className="font-semibold">Michael Chen</p>
                    <p className="text-sm text-gray-600">Logistics Manager</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4">
                    &quot;Real-time tracking and notifications kept me informed every step of the way. Highly recommended!&quot;
                  </p>
                  <div>
                    <p className="font-semibold">David Martinez</p>
                    <p className="text-sm text-gray-600">E-commerce Seller</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Pricing Teaser */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
              <p className="text-gray-600 mb-8">Choose the plan that fits your business needs</p>
              <Link href="/pricing">
                <Button size="lg" className="bg-orange-600 hover:bg-orange-700">
                  View Pricing Plans
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-orange-600 to-orange-700 text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-4xl font-bold mb-6">Ready to Get Started?</h2>
              <p className="text-xl text-orange-100 mb-8">
                Join thousands of users who are already using Parcsal to streamline their shipping needs
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth/register-customer">
                  <Button size="lg" variant="secondary">
                    Sign Up as Customer
                  </Button>
                </Link>
                <Link href="/auth/register-company">
                  <Button size="lg" variant="outline" className="bg-transparent text-white border-white hover:bg-white/10">
                    Sign Up as Company
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


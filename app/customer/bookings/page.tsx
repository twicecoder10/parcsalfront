'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Eye, Search, Loader2, Filter, ChevronDown, Copy, Check, Calendar, MapPin, Building2, CreditCard } from 'lucide-react';
import { customerApi } from '@/lib/customer-api';
import { format } from 'date-fns';
import { getStoredUser, hasRoleAccess, getDashboardPath } from '@/lib/auth';

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  ACCEPTED: 'bg-blue-100 text-blue-800',
  IN_TRANSIT: 'bg-orange-100 text-orange-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  REJECTED: 'bg-red-100 text-red-800',
};

const paymentStatusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-gray-100 text-gray-800',
  PARTIALLY_REFUNDED: 'bg-orange-100 text-orange-800',
};

export default function BookingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [copiedBookingId, setCopiedBookingId] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    limit: 20,
    offset: 0,
    total: 0,
    hasMore: false,
  });

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

  const fetchBookings = useCallback(async (resetOffset = true) => {
    // Double-check auth before making API call
    const user = getStoredUser();
    if (!user || !hasRoleAccess(user.role, ['CUSTOMER'])) {
      return;
    }

    setLoading(true);
    try {
      setPagination(prev => {
        const currentOffset = resetOffset ? 0 : prev.offset + prev.limit;
        
        // Prepare API params
        const params: any = {
          limit: prev.limit,
          offset: currentOffset,
        };
        
        // Add search parameter if provided
        if (searchQuery.trim()) {
          params.search = searchQuery.trim();
        }
        
        // Add status filter if not 'all'
        if (statusFilter !== 'all') {
          params.status = statusFilter;
        }
        
        // Make API call
        customerApi.getBookings(params).then((response) => {
          const newBookings = response.data || [];
          const paginationData = response.pagination || {};
          
          if (resetOffset) {
            setBookings(newBookings);
            setPagination({
              limit: paginationData.limit || prev.limit,
              offset: 0,
              total: paginationData.total || 0,
              hasMore: paginationData.hasMore !== undefined ? paginationData.hasMore : (newBookings.length >= prev.limit),
            });
          } else {
            setBookings(current => [...current, ...newBookings]);
            setPagination({
              limit: paginationData.limit || prev.limit,
              offset: currentOffset,
              total: paginationData.total || prev.total,
              hasMore: paginationData.hasMore !== undefined ? paginationData.hasMore : (newBookings.length >= prev.limit),
            });
          }
          setLoading(false);
        }).catch((error) => {
          console.error('Failed to fetch bookings:', error);
          if (resetOffset) {
            setBookings([]);
          }
          setLoading(false);
        });
        
        return prev;
      });
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      if (resetOffset) {
        setBookings([]);
      }
      setLoading(false);
    }
  }, [statusFilter, searchQuery]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const user = getStoredUser();
    // Only fetch if user is authorized
    if (user && hasRoleAccess(user.role, ['CUSTOMER'])) {
      fetchBookings(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, searchQuery]);

  // Reset pagination when filters change
  useEffect(() => {
    setPagination(prev => ({ ...prev, offset: 0 }));
  }, [statusFilter, searchQuery]);

  // No client-side filtering needed - API handles search and status filtering
  const filteredBookings = bookings;

  const copyBookingId = async (bookingId: string) => {
    try {
      await navigator.clipboard.writeText(bookingId);
      setCopiedBookingId(bookingId);
      setTimeout(() => setCopiedBookingId(null), 2000);
    } catch (error) {
      console.error('Failed to copy booking ID:', error);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Fixed Header Section */}
      <div className="flex-shrink-0 space-y-3 md:space-y-4 pb-3 md:pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">My Bookings</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1 md:mt-2">Track and manage your shipment bookings</p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="p-3 pb-2 md:p-6 md:pb-6">
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <CardTitle className="text-base md:text-xl">Filters</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-6">
            <div className="flex flex-col gap-2 md:grid md:grid-cols-2 md:gap-4">
              <Input
                placeholder="Search bookings..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full h-9 md:h-10 md:max-w-md text-sm"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full h-9 md:h-10 md:max-w-md text-sm">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="ACCEPTED">Accepted</SelectItem>
                  <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
                  <SelectItem value="DELIVERED">Delivered</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scrollable Content Section */}
      <div className="flex-1 overflow-y-auto space-y-3 md:space-y-4 pb-4">
        {/* Bookings - Desktop Table View */}
        <Card className="hidden lg:block">
        <CardHeader>
          <CardTitle>Booking History</CardTitle>
          <CardDescription>
            {searchQuery || statusFilter !== 'all'
              ? `${filteredBookings.length} ${filteredBookings.length === 1 ? 'booking' : 'bookings'} found`
              : `Showing ${bookings.length} of ${pagination.total} ${pagination.total === 1 ? 'booking' : 'bookings'}`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No bookings found</p>
              <Link href="/shipments/browse">
                <Button>Browse Shipments</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Booking ID</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Departure Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment Status</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.map((booking) => {
                    // Calculate price: use payment.totalAmount (in cents) if available, otherwise calculatedPrice
                    let displayPrice = '0.00';
                    if (booking.payment?.totalAmount) {
                      // totalAmount is in cents, convert to pounds
                      displayPrice = (booking.payment.totalAmount / 100).toFixed(2);
                    } else if (booking.payment?.amount) {
                      // amount is already in pounds as string
                      displayPrice = parseFloat(booking.payment.amount).toFixed(2);
                    } else if (booking.calculatedPrice) {
                      displayPrice = parseFloat(booking.calculatedPrice.toString()).toFixed(2);
                    } else if (booking.price) {
                      displayPrice = parseFloat(booking.price.toString()).toFixed(2);
                    }

                    // Get payment status
                    const paymentStatus = booking.paymentStatus || (booking.payment ? booking.payment.status : 'PENDING');

                    return (
                      <TableRow key={booking.id}>
                        <TableCell className="font-mono text-sm">
                          <button
                            onClick={() => copyBookingId(booking.id)}
                            className="flex items-center gap-2 hover:text-orange-600 transition-colors cursor-pointer"
                            title="Click to copy booking ID"
                          >
                            {booking.id}
                            {copiedBookingId === booking.id ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3 opacity-50" />
                            )}
                          </button>
                        </TableCell>
                        <TableCell className="font-medium">
                          {booking.companyName || booking.shipmentSlot?.company?.name || 'N/A'}
                        </TableCell>
                        <TableCell className="font-medium">
                          {booking.shipmentSlot?.originCity || booking.originCity || 'N/A'} → {booking.shipmentSlot?.destinationCity || booking.destinationCity || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {booking.shipmentSlot?.departureTime 
                            ? format(new Date(booking.shipmentSlot.departureTime), 'MMM dd, yyyy')
                            : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[booking.status] || 'bg-gray-100 text-gray-800'}>
                            {booking.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={paymentStatusColors[paymentStatus] || 'bg-gray-100 text-gray-800'}>
                            {paymentStatus.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">£{displayPrice}</TableCell>
                        <TableCell className="text-right">
                          <Link href={`/customer/bookings/${booking.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          
          {/* Load More Button */}
          {!loading && !searchQuery && pagination.hasMore && (
            <div className="mt-6 text-center">
              <Button
                variant="outline"
                onClick={() => fetchBookings(false)}
                disabled={loading}
                className="min-w-[120px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    Load More
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
        </Card>

        {/* Bookings - Mobile Card View */}
        <div className="lg:hidden space-y-3">
        <div className="px-1">
          <p className="text-sm text-gray-600">
            {searchQuery || statusFilter !== 'all'
              ? `${filteredBookings.length} ${filteredBookings.length === 1 ? 'booking' : 'bookings'} found`
              : `Showing ${bookings.length} of ${pagination.total} ${pagination.total === 1 ? 'booking' : 'bookings'}`
            }
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
          </div>
        ) : filteredBookings.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-600 mb-4">No bookings found</p>
              <Link href="/shipments/browse">
                <Button>Browse Shipments</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            {filteredBookings.map((booking) => {
              // Calculate price: use payment.totalAmount (in cents) if available, otherwise calculatedPrice
              let displayPrice = '0.00';
              if (booking.payment?.totalAmount) {
                displayPrice = (booking.payment.totalAmount / 100).toFixed(2);
              } else if (booking.payment?.amount) {
                displayPrice = parseFloat(booking.payment.amount).toFixed(2);
              } else if (booking.calculatedPrice) {
                displayPrice = parseFloat(booking.calculatedPrice.toString()).toFixed(2);
              } else if (booking.price) {
                displayPrice = parseFloat(booking.price.toString()).toFixed(2);
              }

              // Get payment status
              const paymentStatus = booking.paymentStatus || (booking.payment ? booking.payment.status : 'PENDING');

              return (
                <Card key={booking.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    {/* Header with ID and Price */}
                    <div className="flex items-start justify-between mb-3 pb-3 border-b">
                      <div className="flex-1 min-w-0">
                        <button
                          onClick={() => copyBookingId(booking.id)}
                          className="flex items-center gap-2 hover:text-orange-600 transition-colors cursor-pointer group"
                          title="Click to copy booking ID"
                        >
                          <span className="font-mono text-xs text-gray-600 truncate">
                            {booking.id}
                          </span>
                          {copiedBookingId === booking.id ? (
                            <Check className="h-3 w-3 text-green-600 flex-shrink-0" />
                          ) : (
                            <Copy className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity flex-shrink-0" />
                          )}
                        </button>
                      </div>
                      <span className="text-lg font-bold text-orange-600 ml-3 flex-shrink-0">
                        £{displayPrice}
                      </span>
                    </div>

                    {/* Company */}
                    <div className="flex items-center gap-2 mb-3">
                      <Building2 className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="font-medium text-sm">
                        {booking.companyName || booking.shipmentSlot?.company?.name || 'N/A'}
                      </span>
                    </div>

                    {/* Route */}
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-700">
                        {booking.shipmentSlot?.originCity || booking.originCity || 'N/A'}
                        {' → '}
                        {booking.shipmentSlot?.destinationCity || booking.destinationCity || 'N/A'}
                      </span>
                    </div>

                    {/* Departure Date */}
                    <div className="flex items-center gap-2 mb-4">
                      <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-700">
                        {booking.shipmentSlot?.departureTime 
                          ? format(new Date(booking.shipmentSlot.departureTime), 'MMM dd, yyyy')
                          : 'N/A'}
                      </span>
                    </div>

                    {/* Status Information */}
                    <div className="space-y-2.5 mb-4 pt-3 border-t">
                      {/* Booking Status - Primary */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 font-medium">Status</span>
                        <Badge className={`${statusColors[booking.status] || 'bg-gray-100 text-gray-800'} text-xs`}>
                          {booking.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      {/* Payment Status - Only show if different or needs attention */}
                      {(paymentStatus === 'FAILED' || 
                        paymentStatus === 'REFUNDED' || 
                        paymentStatus === 'PARTIALLY_REFUNDED' || 
                        (paymentStatus === 'PAID' && ['PENDING', 'ACCEPTED'].includes(booking.status))) && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <CreditCard className="h-3.5 w-3.5 text-gray-400" />
                            <span className="text-xs text-gray-500 font-medium">Payment</span>
                          </div>
                          <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${
                            paymentStatus === 'PAID' 
                              ? 'bg-green-50 text-green-700 border-green-200' 
                              : paymentStatus === 'FAILED'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : paymentStatus === 'REFUNDED' || paymentStatus === 'PARTIALLY_REFUNDED'
                              ? 'bg-orange-50 text-orange-700 border-orange-200'
                              : 'bg-gray-50 text-gray-700 border-gray-200'
                          }`}>
                            {paymentStatus.replace('_', ' ')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* View Button */}
                    <Link href={`/customer/bookings/${booking.id}`} className="block">
                      <Button className="w-full h-10" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}

            {/* Load More Button - Mobile */}
            {!loading && !searchQuery && pagination.hasMore && (
              <div className="pt-2">
                <Button
                  variant="outline"
                  onClick={() => fetchBookings(false)}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      Load More
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
        </div>
      </div>
    </div>
  );
}


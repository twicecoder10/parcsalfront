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
import { Eye, Search, Loader2, Filter, ChevronDown, Copy, Check } from 'lucide-react';
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Bookings</h1>
        <p className="text-gray-600 mt-2">Track and manage your shipment bookings</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <CardTitle>Filters</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              placeholder="Search by booking ID, company, city, or status..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="max-w-md"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="max-w-md">
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

      {/* Bookings Table */}
      <Card>
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
              <Link href="/customer/shipments/browse">
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
    </div>
  );
}


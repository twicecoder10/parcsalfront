'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, ShoppingCart, Clock, Truck, ArrowRight, Loader2 } from 'lucide-react';
import { customerApi } from '@/lib/customer-api';
import { getStoredUser, hasRoleAccess, getDashboardPath } from '@/lib/auth';

export default function CustomerDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeBookings: 0,
    pendingBookings: 0,
    totalBookings: 0,
    upcomingDepartures: 0,
  });
  const [recentBookings, setRecentBookings] = useState<any[]>([]);

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

  const fetchDashboardData = async () => {
    // Double-check auth before making API call
    const user = getStoredUser();
    if (!user || !hasRoleAccess(user.role, ['CUSTOMER'])) {
      return;
    }

    setLoading(true);
    try {
      const [dashboardData, recent] = await Promise.all([
        customerApi.getDashboardStats(),
        customerApi.getRecentBookings({ limit: 5 }),
      ]);
      
      setStats(dashboardData);
      setRecentBookings(recent || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // Set defaults on error
      setStats({
        activeBookings: 0,
        pendingBookings: 0,
        totalBookings: 0,
        upcomingDepartures: 0,
      });
      setRecentBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const user = getStoredUser();
    // Only fetch if user is authorized
    if (user && hasRoleAccess(user.role, ['CUSTOMER'])) {
      fetchDashboardData();
    }
  }, []);

  const statusColors: Record<string, string> = {
    PENDING: 'text-yellow-600',
    ACCEPTED: 'text-blue-600',
    IN_TRANSIT: 'text-orange-600',
    DELIVERED: 'text-green-600',
    CANCELLED: 'text-red-600',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600 mt-2">Overview of your shipments and bookings</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeBookings}</div>
            <p className="text-xs text-muted-foreground">In transit or accepted</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingBookings}</div>
            <p className="text-xs text-muted-foreground">Awaiting confirmation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBookings}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingDepartures}</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started quickly</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/shipments/browse">
              <Button className="w-full justify-between" variant="outline">
                <span className="flex items-center">
                  <Package className="mr-2 h-4 w-4" />
                  Browse Shipments
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/customer/bookings">
              <Button className="w-full justify-between" variant="outline">
                <span className="flex items-center">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  My Bookings
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Bookings</CardTitle>
                <CardDescription>Your latest activity</CardDescription>
              </div>
              {recentBookings.length > 0 && (
                <Link href="/customer/bookings">
                  <Button variant="ghost" size="sm">View All</Button>
                </Link>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {recentBookings.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-600 mb-4">No bookings yet</p>
                <Link href="/shipments/browse">
                  <Button size="sm">Browse Shipments</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentBookings.map((booking) => {
                  const originCity = booking.shipmentSlot?.originCity || booking.originCity || '';
                  const destinationCity = booking.shipmentSlot?.destinationCity || booking.destinationCity || '';
                  return (
                    <Link key={booking.id} href={`/customer/bookings/${booking.id}`}>
                      <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                        <div className="flex-1">
                          <p className="text-sm font-medium">Booking #{booking.id}</p>
                          <p className="text-xs text-muted-foreground">
                            {originCity} → {destinationCity}
                          </p>
                        </div>
                        <Badge className={statusColors[booking.status] || ''}>
                          {booking.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


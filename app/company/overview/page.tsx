'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Clock, ShoppingCart, DollarSign, Plus, AlertCircle, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { getStoredUser, setStoredUser } from '@/lib/auth';
import { authApi } from '@/lib/api';
import { companyApi } from '@/lib/company-api';
import type { User } from '@/lib/api';
import type { OverviewStats, RecentBooking, UpcomingShipment } from '@/lib/company-api';

export default function CompanyOverviewPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [upcomingShipments, setUpcomingShipments] = useState<UpcomingShipment[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Fetch latest user data from API to get current company verification status
        const currentUser = await authApi.getCurrentUser();
        setStoredUser(currentUser);
        setUser(currentUser);
      } catch (error) {
        // Fallback to stored user if API call fails
        const storedUser = getStoredUser();
        setUser(storedUser);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUser();
    fetchOverviewData();
  }, []);

  const fetchOverviewData = async () => {
    setStatsLoading(true);
    setError(null);
    try {
      const [statsResponse, bookingsResponse, shipmentsResponse] = await Promise.all([
        companyApi.getOverviewStats(),
        companyApi.getRecentBookings(5),
        companyApi.getUpcomingShipments(5),
      ]);
      
      setStats(statsResponse);
      setRecentBookings(bookingsResponse);
      setUpcomingShipments(shipmentsResponse);
    } catch (error: any) {
      console.error('Failed to fetch overview data:', error);
      setError(error.message || 'Failed to load overview data. Please try again.');
    } finally {
      setStatsLoading(false);
    }
  };

  const isVerificationPending = !loading && 
                                user?.onboardingCompleted === true && 
                                user?.company?.isVerified === false;

  return (
    <div className="space-y-6">
      {/* Verification Pending Alert */}
      {isVerificationPending && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <CardTitle className="text-yellow-800">Company Verification Pending</CardTitle>
            </div>
            <CardDescription className="text-yellow-700">
              Your company account is currently pending verification. Once verified, you&apos;ll have full access to all platform features. 
              If you have any questions or need assistance, please{' '}
              <a href="mailto:support@parcsal.com" className="underline font-medium">
                contact our support team
              </a>
              .
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Overview</h1>
          <p className="text-gray-600 mt-2">Monitor your shipment operations at a glance</p>
        </div>
        <Link href="/company/shipments/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Shipment Slot
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      {statsLoading ? (
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="h-24 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Shipments</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.activeShipments ?? 0}</div>
              <p className="text-xs text-muted-foreground">Currently published</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Departures</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.upcomingDepartures ?? 0}</div>
              <p className="text-xs text-muted-foreground">Next 7 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-bold">{stats?.totalBookings ?? 0}</div>
                {stats?.bookingsChangePercentage !== undefined && (
                  <div className={`flex items-center gap-1 text-xs ${
                    stats.bookingsChangePercentage >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stats.bookingsChangePercentage >= 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {Math.abs(stats.bookingsChangePercentage)}%
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-bold">£{(stats?.revenue ?? 0).toLocaleString()}</div>
                {stats?.revenueChangePercentage !== undefined && (
                  <div className={`flex items-center gap-1 text-xs ${
                    stats.revenueChangePercentage >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stats.revenueChangePercentage >= 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {Math.abs(stats.revenueChangePercentage)}%
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Additional Stats */}
      {!statsLoading && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Bookings</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats?.pendingBookings ?? 0}</div>
              <p className="text-xs text-muted-foreground">Requires your attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accepted Bookings</CardTitle>
              <ShoppingCart className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats?.acceptedBookings ?? 0}</div>
              <p className="text-xs text-muted-foreground">Confirmed this month</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-sm text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Charts placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Bookings Over Time</CardTitle>
          <CardDescription>Track your booking trends</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-500">
            Chart visualization will be implemented here
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
            <CardDescription>Latest booking requests</CardDescription>
          </CardHeader>
          <CardContent>
            {recentBookings.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No recent bookings</p>
            ) : (
              <>
                <div className="space-y-4">
                  {recentBookings.map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between pb-4 border-b last:border-0 last:pb-0">
                      <div>
                        <p className="text-sm font-medium">Booking #{booking.id.slice(0, 8)}</p>
                        <p className="text-xs text-muted-foreground">
                          {booking.route.origin} → {booking.route.destination}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {booking.customer.name} • £{booking.price}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        booking.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                  ))}
                </div>
                <Link href="/company/bookings">
                  <Button variant="ghost" className="w-full mt-4">
                    View All Bookings
                  </Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Departures</CardTitle>
            <CardDescription>Next scheduled shipments</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingShipments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No upcoming departures</p>
            ) : (
              <>
                <div className="space-y-4">
                  {upcomingShipments.map((shipment) => {
                    const departureDate = new Date(shipment.departureTime);
                    const daysUntil = Math.ceil((departureDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                    return (
                      <div key={shipment.id} className="flex items-center justify-between pb-4 border-b last:border-0 last:pb-0">
                        <div>
                          <p className="text-sm font-medium">
                            {shipment.route.origin} → {shipment.route.destination}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {departureDate.toLocaleDateString()} at {departureDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {shipment.bookingsCount} booking{shipment.bookingsCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <span className="text-xs text-blue-600 font-medium">
                          {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days`}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <Link href="/company/shipments">
                  <Button variant="ghost" className="w-full mt-4">
                    View Slots
                  </Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


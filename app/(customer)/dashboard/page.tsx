import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, ShoppingCart, Clock, Truck } from 'lucide-react';

export default function CustomerDashboardPage() {
  // Mock data - will be replaced with API calls
  const stats = {
    activeBookings: 3,
    upcomingDepartures: 2,
    lastDelivery: '2024-01-15',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome back!</h1>
        <p className="text-gray-600 mt-2">Here&apos;s what&apos;s happening with your shipments</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeBookings}</div>
            <p className="text-xs text-muted-foreground">Currently in transit</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Departures</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingDepartures}</div>
            <p className="text-xs text-muted-foreground">Scheduled this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Delivery</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Date(stats.lastDelivery).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
            <p className="text-xs text-muted-foreground">Most recent completion</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/shipments/browse">
              <Button className="w-full justify-start" variant="outline">
                <Package className="mr-2 h-4 w-4" />
                Browse Available Shipments
              </Button>
            </Link>
            <Link href="/customer/bookings">
              <Button className="w-full justify-start" variant="outline">
                <ShoppingCart className="mr-2 h-4 w-4" />
                View My Bookings
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest shipment updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Booking #1234</p>
                  <p className="text-xs text-muted-foreground">New York → Los Angeles</p>
                </div>
                <span className="text-xs text-orange-600">In Transit</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Booking #1233</p>
                  <p className="text-xs text-muted-foreground">Chicago → Miami</p>
                </div>
                <span className="text-xs text-green-600">Delivered</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


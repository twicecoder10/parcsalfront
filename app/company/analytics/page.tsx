'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, TrendingUp, TrendingDown, PoundSterling, Package, ShoppingCart, Users } from 'lucide-react';
import { companyApi } from '@/lib/company-api';
import type { AnalyticsData } from '@/lib/company-api';

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const analyticsData = await companyApi.getAnalytics(period as 'week' | 'month' | 'quarter' | 'year');
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-gray-600 mt-2">Insights and performance metrics</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Last Week</SelectItem>
            <SelectItem value="month">Last Month</SelectItem>
            <SelectItem value="quarter">Last Quarter</SelectItem>
            <SelectItem value="year">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
        </div>
      ) : analytics ? (
        <>
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <PoundSterling className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <div className="text-2xl font-bold">£{analytics.revenue.total.toLocaleString()}</div>
                  {analytics.revenue.changePercentage !== undefined && (
                    <div className={`flex items-center gap-1 text-xs ${
                      analytics.revenue.changePercentage >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {analytics.revenue.changePercentage >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {Math.abs(analytics.revenue.changePercentage)}%
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <div className="text-2xl font-bold">{analytics.bookings.total}</div>
                  {analytics.bookings.changePercentage !== undefined && (
                    <div className={`flex items-center gap-1 text-xs ${
                      analytics.bookings.changePercentage >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {analytics.bookings.changePercentage >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {Math.abs(analytics.bookings.changePercentage)}%
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {analytics.bookings.accepted} accepted
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Shipments</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <div className="text-2xl font-bold">{analytics.shipments.active}</div>
                  {analytics.shipments.changePercentage !== undefined && (
                    <div className={`flex items-center gap-1 text-xs ${
                      analytics.shipments.changePercentage >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {analytics.shipments.changePercentage >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {Math.abs(analytics.shipments.changePercentage)}%
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {analytics.shipments.published} published
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Booking Status</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <div className="text-sm">
                    <span className="text-green-600 font-medium">{analytics.bookings.accepted}</span> accepted
                  </div>
                  <div className="text-sm">
                    <span className="text-yellow-600 font-medium">{analytics.bookings.pending}</span> pending
                  </div>
                  <div className="text-sm">
                    <span className="text-red-600 font-medium">{analytics.bookings.rejected}</span> rejected
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Revenue Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Revenue over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  Chart visualization will be implemented here
                  {/* TODO: Add chart library (e.g., recharts) */}
                </div>
              </CardContent>
            </Card>

            {/* Top Routes */}
            <Card>
              <CardHeader>
                <CardTitle>Top Routes</CardTitle>
                <CardDescription>Most popular routes by bookings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.topRoutes.map((route, index) => (
                    <div key={index} className="flex items-center justify-between pb-4 border-b last:border-0">
                      <div>
                        <p className="font-medium">{route.route}</p>
                        <p className="text-sm text-muted-foreground">{route.bookingsCount} bookings</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">£{route.revenue.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">Revenue</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Metrics */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Shipment Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Active</span>
                    <span className="font-medium">{analytics.shipments.active}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Published</span>
                    <span className="font-medium">{analytics.shipments.published}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Completed</span>
                    <span className="font-medium">{analytics.shipments.completed}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Booking Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Acceptance Rate</span>
                    <span className="font-medium">
                      {analytics.bookings.total > 0
                        ? Math.round((analytics.bookings.accepted / analytics.bookings.total) * 100)
                        : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Avg. Booking Value</span>
                    <span className="font-medium">
                      £{analytics.bookings.accepted > 0
                        ? Math.round(analytics.revenue.total / analytics.bookings.accepted)
                        : 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Period</span>
                    <span className="font-medium">
                      {analytics.revenueByPeriod && analytics.revenueByPeriod.length > 0
                        ? (() => {
                            // Get the latest period (last item in array)
                            const latestPeriod = analytics.revenueByPeriod[analytics.revenueByPeriod.length - 1].period;
                            
                            // Handle different period formats
                            if (latestPeriod.includes('Q')) {
                              // Quarter format: "2025-Q4" -> "Q4 2025"
                              const [year, quarter] = latestPeriod.split('-Q');
                              return `Q${quarter} ${year}`;
                            } else if (latestPeriod.match(/^\d{4}-\d{2}-\d{2}$/)) {
                              // Daily format: "2025-12-18" -> "December 18, 2025"
                              const date = new Date(latestPeriod);
                              return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
                            } else if (latestPeriod.match(/^\d{4}-\d{2}$/)) {
                              // Monthly format: "2025-12" -> "December 2025"
                              const [year, month] = latestPeriod.split('-');
                              const date = new Date(parseInt(year), parseInt(month) - 1);
                              return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                            } else if (latestPeriod.match(/^\d{4}$/)) {
                              // Yearly format: "2025" -> "2025"
                              return latestPeriod;
                            } else {
                              // Fallback: return as is
                              return latestPeriod;
                            }
                          })()
                        : period.charAt(0).toUpperCase() + period.slice(1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Revenue Growth</span>
                    <span className={`font-medium ${
                      analytics.revenue.changePercentage >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {analytics.revenue.changePercentage >= 0 ? '+' : ''}{analytics.revenue.changePercentage}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">No analytics data available</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


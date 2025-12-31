'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, TrendingUp, TrendingDown, PoundSterling, Package, ShoppingCart, Users } from 'lucide-react';
import { companyApi } from '@/lib/company-api';
import type { AnalyticsData } from '@/lib/company-api';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';

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

  // Format revenue data for the chart
  const chartData = useMemo(() => {
    if (!analytics?.revenueByPeriod) return [];

    return analytics.revenueByPeriod.map((item) => {
      let formattedPeriod = item.period;
      
      // Format period based on its format
      if (item.period.includes('Q')) {
        // Quarter format: "2025-Q4" -> "Q4 2025"
        const [year, quarter] = item.period.split('-Q');
        formattedPeriod = `Q${quarter} ${year}`;
      } else if (item.period.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Daily format: "2025-12-18" -> "Dec 18"
        const date = new Date(item.period);
        formattedPeriod = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else if (item.period.match(/^\d{4}-\d{2}$/)) {
        // Monthly format: "2025-12" -> "Dec 2025"
        const [year, month] = item.period.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        formattedPeriod = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }
      // Yearly format stays as is: "2025" -> "2025"

      return {
        period: formattedPeriod,
        revenue: item.revenue,
      };
    });
  }, [analytics?.revenueByPeriod]);

  // Format booking status data for pie chart
  const bookingStatusData = useMemo(() => {
    if (!analytics?.bookings) return [];
    
    return [
      { name: 'Accepted', value: analytics.bookings.accepted, color: '#22c55e' },
      { name: 'Pending', value: analytics.bookings.pending, color: '#eab308' },
      { name: 'Rejected', value: analytics.bookings.rejected, color: '#ef4444' },
    ].filter(item => item.value > 0);
  }, [analytics?.bookings]);

  // Format top routes data for bar chart
  const topRoutesData = useMemo(() => {
    if (!analytics?.topRoutes) return [];
    
    return analytics.topRoutes.map((route) => ({
      route: route.route.length > 20 ? `${route.route.substring(0, 20)}...` : route.route,
      fullRoute: route.route,
      bookings: route.bookingsCount,
      revenue: route.revenue,
    }));
  }, [analytics?.topRoutes]);

  // Format shipment performance data for bar chart
  const shipmentPerformanceData = useMemo(() => {
    if (!analytics?.shipments) return [];
    
    return [
      { name: 'Active', value: analytics.shipments.active, color: '#3b82f6' },
      { name: 'Published', value: analytics.shipments.published, color: '#8b5cf6' },
      { name: 'Completed', value: analytics.shipments.completed, color: '#22c55e' },
    ];
  }, [analytics?.shipments]);

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
                {bookingStatusData.length > 0 ? (
                  <div className="flex flex-col items-center justify-center">
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie
                          data={bookingStatusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={false}
                          outerRadius={70}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {bookingStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'white', 
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px',
                            padding: '8px'
                          }}
                          formatter={(value: number, name: string, props: any) => {
                            const total = bookingStatusData.reduce((sum, item) => sum + item.value, 0);
                            const percent = total > 0 ? (value / total) * 100 : 0;
                            return [`${value} (${percent.toFixed(1)}%)`, props.payload?.name || name];
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap justify-center gap-4 mt-2">
                      {bookingStatusData.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: entry.color }}
                          />
                          <span className="text-sm text-muted-foreground">
                            {entry.name}: <span className="font-medium text-foreground">{entry.value}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
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
                )}
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
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={256}>
                    <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                      <XAxis 
                        dataKey="period" 
                        className="text-xs"
                        tick={{ fill: '#6b7280' }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis 
                        className="text-xs"
                        tick={{ fill: '#6b7280' }}
                        tickFormatter={(value) => `£${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          padding: '8px'
                        }}
                        formatter={(value: number) => [`£${value.toLocaleString()}`, 'Revenue']}
                        labelStyle={{ color: '#374151', fontWeight: 600 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#f97316" 
                        strokeWidth={2}
                        dot={{ fill: '#f97316', r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    No revenue data available for this period
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Routes */}
            <Card>
              <CardHeader>
                <CardTitle>Top Routes</CardTitle>
                <CardDescription>Most popular routes by bookings</CardDescription>
              </CardHeader>
              <CardContent>
                {topRoutesData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={256}>
                    <BarChart
                      data={topRoutesData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                      <XAxis type="number" className="text-xs" tick={{ fill: '#6b7280' }} />
                      <YAxis 
                        type="category" 
                        dataKey="route" 
                        className="text-xs"
                        tick={{ fill: '#6b7280' }}
                        width={100}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          padding: '8px'
                        }}
                        formatter={(value: number, name: string, props: any) => {
                          if (name === 'bookings') {
                            return [`${value} bookings`, 'Bookings'];
                          }
                          return [`£${value.toLocaleString()}`, 'Revenue'];
                        }}
                        labelFormatter={(label) => topRoutesData.find(d => d.route === label)?.fullRoute || label}
                        labelStyle={{ color: '#374151', fontWeight: 600 }}
                      />
                      <Bar dataKey="bookings" fill="#f97316" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
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
                )}
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
                {shipmentPerformanceData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={shipmentPerformanceData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                      <XAxis 
                        dataKey="name" 
                        className="text-xs"
                        tick={{ fill: '#6b7280' }}
                      />
                      <YAxis 
                        className="text-xs"
                        tick={{ fill: '#6b7280' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          padding: '8px'
                        }}
                        formatter={(value: number) => [value, 'Shipments']}
                        labelStyle={{ color: '#374151', fontWeight: 600 }}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {shipmentPerformanceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
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
                )}
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


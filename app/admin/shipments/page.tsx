'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { Eye, Package, Search, Loader2 } from 'lucide-react';
import { adminApi } from '@/lib/admin-api';
import type { AdminShipment, ShipmentStats } from '@/lib/admin-api';

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  PUBLISHED: 'bg-green-100 text-green-800',
  CLOSED: 'bg-red-100 text-red-800',
};

const modeColors: Record<string, string> = {
  AIR: 'bg-blue-100 text-blue-800',
  BUS: 'bg-purple-100 text-purple-800',
  VAN: 'bg-yellow-100 text-yellow-800',
  TRAIN: 'bg-orange-100 text-orange-800',
  SHIP: 'bg-cyan-100 text-cyan-800',
  RIDER: 'bg-pink-100 text-pink-800',
};

export default function AdminShipmentsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shipments, setShipments] = useState<AdminShipment[]>([]);
  const [stats, setStats] = useState<ShipmentStats | null>(null);
  const [pagination, setPagination] = useState({ limit: 20, offset: 0, total: 0, hasMore: false });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'all'>('all');
  const [modeFilter, setModeFilter] = useState<'AIR' | 'BUS' | 'VAN' | 'TRAIN' | 'SHIP' | 'RIDER' | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(0);

  const fetchShipments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [shipmentsResponse, statsResponse] = await Promise.all([
        adminApi.getShipments({
          limit: 20,
          offset: currentPage * 20,
          search: searchQuery || undefined,
          status: statusFilter === 'all' ? 'all' : statusFilter,
          mode: modeFilter === 'all' ? 'all' : modeFilter,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        }),
        adminApi.getShipmentStats(),
      ]);
      setShipments(shipmentsResponse.data);
      setPagination(shipmentsResponse.pagination);
      setStats(statsResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load shipments');
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, modeFilter, searchQuery]);

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 0) {
        fetchShipments();
      } else {
        setCurrentPage(0);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, currentPage, fetchShipments]);

  if (error && !shipments.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchShipments}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Shipments</h1>
        <p className="text-gray-600 mt-2">View and manage all platform shipments</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shipments</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || pagination.total || shipments.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.published || 0}</div>
            <p className="text-xs text-muted-foreground">Active now</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft</CardTitle>
            <Package className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.draft || 0}</div>
            <p className="text-xs text-muted-foreground">Not published</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Closed</CardTitle>
            <Package className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.closed || 0}</div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by origin, destination, or company..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={(value) => {
              setStatusFilter(value as typeof statusFilter);
              setCurrentPage(0);
            }}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="PUBLISHED">Published</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={modeFilter} onValueChange={(value) => {
              setModeFilter(value as typeof modeFilter);
              setCurrentPage(0);
            }}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Transport Mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modes</SelectItem>
                <SelectItem value="AIR">Air</SelectItem>
                <SelectItem value="BUS">Bus</SelectItem>
                <SelectItem value="VAN">Van</SelectItem>
                <SelectItem value="TRAIN">Train</SelectItem>
                <SelectItem value="SHIP">Ship</SelectItem>
                <SelectItem value="RIDER">Rider</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Shipments Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Shipments</CardTitle>
          <CardDescription>View and manage shipment listings</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Route</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Departure</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && shipments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-orange-600" />
                  </TableCell>
                </TableRow>
              ) : shipments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No shipments found
                  </TableCell>
                </TableRow>
              ) : (
                shipments.map((shipment) => (
                  <TableRow key={shipment.id}>
                    <TableCell>
                      <div className="font-medium">
                        {shipment.originCity}, {shipment.originCountry}
                      </div>
                      <div className="text-sm text-gray-500">
                        → {shipment.destinationCity}, {shipment.destinationCountry}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link href={`/admin/companies/${shipment.company.id}`}>
                        <Button variant="link" className="p-0 h-auto">
                          {shipment.company.name}
                        </Button>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge className={modeColors[shipment.mode] || ''}>
                        {shipment.mode}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(shipment.departureTime).toLocaleDateString()}
                      <div className="text-xs text-gray-500">
                        {new Date(shipment.departureTime).toLocaleTimeString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {shipment._count?.bookings || 0} bookings
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[shipment.status] || ''}>
                        {shipment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/admin/shipments/${shipment.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        {pagination.total > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <div className="text-sm text-gray-600">
              Showing {currentPage * 20 + 1} to {Math.min((currentPage + 1) * 20, pagination.total)} of {pagination.total} shipments
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0 || loading}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => p + 1)}
                disabled={!pagination.hasMore || loading}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}


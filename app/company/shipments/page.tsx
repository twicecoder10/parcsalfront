'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Eye, Edit, X, Plus, Search, Loader2, Calendar, Send } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { companyApi } from '@/lib/company-api';
import type { Shipment } from '@/lib/company-api';
import { getErrorMessage } from '@/lib/api';
import { usePermissions, canPerformAction } from '@/lib/permissions';
import { toast } from '@/lib/toast';

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  PUBLISHED: 'bg-green-100 text-green-800',
  CLOSED: 'bg-red-100 text-red-800',
};

const modeLabels: Record<string, string> = {
  AIR: 'Air',
  BUS: 'Bus',
  VAN: 'Van',
  TRAIN: 'Train',
  SHIP: 'Ship',
  RIDER: 'Rider',
  TRUCK: 'Truck',
};

export default function ShipmentsPage() {
  const permissions = usePermissions();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [modeFilter, setModeFilter] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [shipmentToDelete, setShipmentToDelete] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false,
  });

  const fetchShipments = useCallback(async () => {
    setLoading(true);
    try {
      const limit = 20; // Fixed limit to avoid dependency issues
      const response = await companyApi.getShipments({
        limit: limit,
        offset: currentPage * limit,
        status: statusFilter !== 'all' ? statusFilter as 'DRAFT' | 'PUBLISHED' | 'CLOSED' : undefined,
        mode: modeFilter !== 'all' ? modeFilter : undefined,
        search: searchQuery || undefined,
      });
      
      // Validate response structure
      if (response && typeof response === 'object') {
        setShipments(Array.isArray(response.data) ? response.data : []);
        setPagination(response.pagination && typeof response.pagination === 'object' ? {
          total: response.pagination.total || 0,
          limit: response.pagination.limit || 20,
          offset: response.pagination.offset || currentPage * 20,
          hasMore: response.pagination.hasMore || false,
        } : {
          total: 0,
          limit: 20,
          offset: currentPage * 20,
          hasMore: false,
        });
      } else {
        // Invalid response structure
        setShipments([]);
        setPagination({
          total: 0,
          limit: 20,
          offset: currentPage * 20,
          hasMore: false,
        });
      }
    } catch (error: any) {
      console.error('Failed to fetch shipments:', error);
      setShipments([]); // Set to empty array on error
      setPagination({
        total: 0,
        limit: 20,
        offset: currentPage * 20,
        hasMore: false,
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, modeFilter, searchQuery]);

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  const handleDelete = async (shipmentId: string) => {
    try {
      await companyApi.deleteShipment(shipmentId);
      setShipments((prev) => (prev || []).filter(s => s.id !== shipmentId));
      setDeleteDialogOpen(false);
      setShipmentToDelete(null);
      // Refresh the list
      fetchShipments();
      toast.success('Shipment deleted successfully');
    } catch (error: any) {
      console.error('Failed to delete shipment:', error);
      toast.error(getErrorMessage(error) || 'Failed to delete shipment. Please try again.');
    }
  };

  const handlePublishShipment = async (shipmentId: string) => {
    try {
      await companyApi.updateShipmentStatus(shipmentId, 'PUBLISHED');
      // Refresh the list
      fetchShipments();
      toast.success('Shipment published successfully');
    } catch (error: any) {
      console.error('Failed to publish shipment:', error);
      toast.error(getErrorMessage(error) || 'Failed to publish shipment. Please try again.');
    }
  };

  const handleCloseShipment = async (shipmentId: string) => {
    try {
      await companyApi.updateShipmentStatus(shipmentId, 'CLOSED');
      // Refresh the list
      fetchShipments();
      toast.success('Shipment closed successfully');
    } catch (error: any) {
      console.error('Failed to close shipment:', error);
      toast.error(getErrorMessage(error) || 'Failed to close shipment. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Shipments</h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">Manage your shipment slots</p>
        </div>
        {canPerformAction(permissions, 'createShipment') && (
          <Link href="/company/shipments/new">
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              New Shipment Slot
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by route..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={(value) => {
              setStatusFilter(value);
              setCurrentPage(0);
            }}>
              <SelectTrigger className="w-full sm:w-48">
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
              setModeFilter(value);
              setCurrentPage(0);
            }}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modes</SelectItem>
                <SelectItem value="TRUCK">Truck</SelectItem>
                <SelectItem value="VAN">Van</SelectItem>
                <SelectItem value="AIR">Air</SelectItem>
                <SelectItem value="BUS">Bus</SelectItem>
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
          <CardDescription>View and manage your shipment slots</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="sm:hidden space-y-3">
            {loading && (!shipments || shipments.length === 0) ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
              </div>
            ) : !shipments || shipments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No shipments found</div>
            ) : (
              shipments.map((shipment) => (
                <div key={shipment.id} className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">
                        {shipment.originCity}, {shipment.originCountry} → {shipment.destinationCity}, {shipment.destinationCountry}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-gray-600">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>
                          {new Date(shipment.departureTime).toLocaleDateString()} at{' '}
                          {new Date(shipment.departureTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                    <Badge className={statusColors[shipment.status] || ''}>
                      {shipment.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div>
                      <span className="font-medium text-gray-900">Mode:</span>{' '}
                      {modeLabels[shipment.mode] || shipment.mode}
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">Capacity:</span>{' '}
                      {shipment.remainingCapacityKg} / {shipment.totalCapacityKg} kg
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">Bookings:</span>{' '}
                      {shipment._count?.bookings ?? 0}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Link href={`/company/shipments/${shipment.id}`}>
                      <Button variant="outline" size="sm" className="h-8 px-3">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </Link>
                    {shipment.status !== 'CLOSED' && canPerformAction(permissions, 'updateShipment') && (
                      <Link href={`/company/shipments/${shipment.id}/edit`}>
                        <Button variant="outline" size="sm" className="h-8 px-3">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </Link>
                    )}
                    {shipment.status === 'PUBLISHED' && canPerformAction(permissions, 'updateShipmentStatus') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCloseShipment(shipment.id)}
                        className="h-8 px-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Close
                      </Button>
                    )}
                    {shipment.status === 'DRAFT' && (
                      <>
                        {canPerformAction(permissions, 'updateShipmentStatus') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePublishShipment(shipment.id)}
                            className="h-8 px-3 text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Publish
                          </Button>
                        )}
                        {canPerformAction(permissions, 'deleteShipment') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setShipmentToDelete(shipment.id);
                              setDeleteDialogOpen(true);
                            }}
                            className="h-8 px-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="hidden sm:block w-full overflow-x-auto">
            <Table className="min-w-[900px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Route</TableHead>
                  <TableHead>Departure Time</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Bookings</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (!shipments || shipments.length === 0) ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-orange-600" />
                    </TableCell>
                  </TableRow>
                ) : !shipments || shipments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No shipments found
                    </TableCell>
                  </TableRow>
                ) : (
                  shipments.map((shipment) => (
                    <TableRow key={shipment.id}>
                      <TableCell className="font-medium">
                        {shipment.originCity}, {shipment.originCountry} → {shipment.destinationCity}, {shipment.destinationCountry}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>
                            {new Date(shipment.departureTime).toLocaleDateString()} at{' '}
                            {new Date(shipment.departureTime).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{modeLabels[shipment.mode] || shipment.mode}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[shipment.status] || ''}>
                          {shipment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {shipment.remainingCapacityKg} / {shipment.totalCapacityKg} kg
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{shipment._count?.bookings ?? 0}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/company/shipments/${shipment.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          {shipment.status !== 'CLOSED' && canPerformAction(permissions, 'updateShipment') && (
                            <Link href={`/company/shipments/${shipment.id}/edit`}>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                          )}
                          {shipment.status === 'PUBLISHED' && canPerformAction(permissions, 'updateShipmentStatus') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCloseShipment(shipment.id)}
                            >
                              <X className="h-4 w-4 text-red-600" />
                            </Button>
                          )}
                          {shipment.status === 'DRAFT' && (
                            <>
                              {canPerformAction(permissions, 'updateShipmentStatus') && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handlePublishShipment(shipment.id)}
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  title="Publish"
                                >
                                  <Send className="h-4 w-4" />
                                </Button>
                              )}
                              {canPerformAction(permissions, 'deleteShipment') && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setShipmentToDelete(shipment.id);
                                    setDeleteDialogOpen(true);
                                  }}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  title="Delete"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        {pagination && pagination.total > pagination.limit && (
          <div className="flex flex-col gap-3 px-6 py-4 border-t sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-gray-600">
              Showing {currentPage * pagination.limit + 1} to{' '}
              {Math.min((currentPage + 1) * pagination.limit, pagination.total)} of{' '}
              {pagination.total} shipments
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Shipment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this shipment? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => shipmentToDelete && handleDelete(shipmentToDelete)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

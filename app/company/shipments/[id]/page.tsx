'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MapPin, Clock, Package, Edit, X, ArrowLeft, Loader2, Truck, PackageCheck, Send, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { companyApi } from '@/lib/company-api';
import type { Shipment, Booking, SlotTrackingStatus } from '@/lib/company-api';
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

const pricingModelLabels: Record<string, string> = {
  PER_KG: 'Per kg',
  PER_ITEM: 'Per item',
  FLAT: 'Flat rate',
};

const trackingStatusColors: Record<SlotTrackingStatus, string> = {
  PENDING: 'bg-gray-100 text-gray-800',
  IN_TRANSIT: 'bg-blue-100 text-blue-800',
  ARRIVED_AT_DESTINATION: 'bg-green-100 text-green-800',
  DELAYED: 'bg-orange-100 text-orange-800',
  DELIVERED: 'bg-green-100 text-green-800',
};

const trackingStatusLabels: Record<SlotTrackingStatus, string> = {
  PENDING: 'Pending',
  IN_TRANSIT: 'In Transit',
  ARRIVED_AT_DESTINATION: 'Arrived at Destination',
  DELAYED: 'Delayed',
  DELIVERED: 'Delivered',
};

// Status flow validation - defines valid transitions
const getValidNextStatuses = (currentStatus: SlotTrackingStatus | undefined): SlotTrackingStatus[] => {
  if (!currentStatus || currentStatus === 'PENDING') {
    return ['IN_TRANSIT', 'DELAYED'];
  }
  if (currentStatus === 'IN_TRANSIT') {
    return ['ARRIVED_AT_DESTINATION', 'DELIVERED', 'DELAYED'];
  }
  if (currentStatus === 'ARRIVED_AT_DESTINATION') {
    return ['DELIVERED', 'DELAYED'];
  }
  if (currentStatus === 'DELAYED') {
    return ['IN_TRANSIT', 'ARRIVED_AT_DESTINATION', 'DELIVERED'];
  }
  // DELIVERED is final state
  return [];
};

export default function ShipmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const permissions = usePermissions();
  const shipmentId = params.id as string;
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [updatingTrackingStatus, setUpdatingTrackingStatus] = useState(false);

  useEffect(() => {
    if (shipmentId) {
      fetchShipment();
      fetchBookings();
    }
  }, [shipmentId]);

  const fetchShipment = async () => {
    setLoading(true);
    try {
      const shipmentData = await companyApi.getShipmentById(shipmentId);
      setShipment(shipmentData);
    } catch (error) {
      console.error('Failed to fetch shipment:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    setBookingsLoading(true);
    try {
      const bookingsData = await companyApi.getShipmentBookings(shipmentId);
      setBookings(bookingsData);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setBookingsLoading(false);
    }
  };

  const handlePublishShipment = async () => {
    if (!shipment) return;
    setProcessing(true);
    try {
      await companyApi.updateShipmentStatus(shipmentId, 'PUBLISHED');
      setShipment({ ...shipment, status: 'PUBLISHED' });
    } catch (error: any) {
      console.error('Failed to publish shipment:', error);
      toast.error(getErrorMessage(error) || 'Failed to publish shipment. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteShipment = async () => {
    if (!shipment) return;
    setProcessing(true);
    try {
      await companyApi.deleteShipment(shipmentId);
      router.push('/company/shipments');
    } catch (error: any) {
      console.error('Failed to delete shipment:', error);
      toast.error(getErrorMessage(error) || 'Failed to delete shipment. Please try again.');
    } finally {
      setProcessing(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleCloseShipment = async () => {
    if (!shipment) return;
    setProcessing(true);
    try {
      await companyApi.updateShipmentStatus(shipmentId, 'CLOSED');
      setShipment({ ...shipment, status: 'CLOSED' });
      setCloseDialogOpen(false);
    } catch (error: any) {
      console.error('Failed to close shipment:', error);
      toast.error(getErrorMessage(error) || 'Failed to close shipment. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleTrackingStatusUpdate = async (newStatus: SlotTrackingStatus) => {
    if (!shipment) return;
    
    const currentStatus = shipment.trackingStatus || 'PENDING';
    const validNextStatuses = getValidNextStatuses(currentStatus);
    
    // Validate status transition
    if (currentStatus === 'DELIVERED') {
      toast.error('This shipment has already been delivered and cannot be updated.');
      return;
    }
    
    if (!validNextStatuses.includes(newStatus)) {
      toast.error(`Invalid status transition. Cannot change from ${trackingStatusLabels[currentStatus]} to ${trackingStatusLabels[newStatus]}.`);
      return;
    }

    setUpdatingTrackingStatus(true);
    try {
      const updatedShipment = await companyApi.updateSlotTrackingStatus(shipmentId, newStatus);
      setShipment(updatedShipment);
      
      // Refresh bookings to show updated statuses
      await fetchBookings();
      
      // Count affected bookings for notification
      const affectedBookings = bookings.filter(booking => {
        if (newStatus === 'IN_TRANSIT' && booking.status === 'ACCEPTED') return true;
        if (newStatus === 'DELIVERED' && booking.status === 'IN_TRANSIT') return true;
        if (newStatus === 'PENDING' && (booking.status === 'ACCEPTED' || booking.status === 'IN_TRANSIT')) return true;
        return false;
      });
      
      if (affectedBookings.length > 0) {
        toast.success(`Tracking status updated to ${trackingStatusLabels[newStatus]}. ${affectedBookings.length} booking(s) have been updated accordingly.`);
      } else {
        toast.success(`Tracking status updated to ${trackingStatusLabels[newStatus]}.`);
      }
    } catch (error: any) {
      console.error('Failed to update tracking status:', error);
      toast.error(getErrorMessage(error) || 'Failed to update tracking status. Please try again.');
    } finally {
      setUpdatingTrackingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
        </div>
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">Shipment not found</p>
            <Link href="/company/shipments">
              <Button variant="outline" className="mt-4">
                Back to Shipments
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canEdit = shipment && shipment.status !== 'CLOSED' && canPerformAction(permissions, 'updateShipment');
  const canClose = shipment && shipment.status === 'PUBLISHED' && canPerformAction(permissions, 'updateShipmentStatus');
  const canPublish = shipment && shipment.status === 'DRAFT' && canPerformAction(permissions, 'updateShipmentStatus');
  const canDelete = shipment && shipment.status === 'DRAFT' && canPerformAction(permissions, 'deleteShipment');
  const canUpdateTracking = canPerformAction(permissions, 'updateShipmentTrackingStatus');
  const capacityPercentage = shipment ? (shipment.remainingCapacityKg / shipment.totalCapacityKg) * 100 : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/company/shipments">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Shipment Details</h1>
            <p className="text-gray-600 mt-2">Shipment #{shipment.id}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <Link href={`/company/shipments/${shipment.id}/edit`}>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </Link>
          )}
          {canPublish && (
            <Button
              onClick={handlePublishShipment}
              disabled={processing}
              className="bg-green-600 hover:bg-green-700"
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Publish
                </>
              )}
            </Button>
          )}
          {canDelete && (
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Shipment</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete this draft shipment? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteShipment}
                    disabled={processing}
                  >
                    {processing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      'Delete'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          {canClose && (
            <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive">
                  <X className="h-4 w-4 mr-2" />
                  Close Shipment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Close Shipment</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to close this shipment? Customers will no longer be able to book this shipment.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCloseDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleCloseShipment}
                    disabled={processing}
                  >
                    {processing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Closing...
                      </>
                    ) : (
                      'Close Shipment'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Overview</CardTitle>
            <div className="flex items-center gap-2">
              <Badge className={statusColors[shipment.status] || ''}>
                {shipment.status}
              </Badge>
              {shipment.trackingStatus && (
                <Badge className={trackingStatusColors[shipment.trackingStatus] || ''}>
                  {trackingStatusLabels[shipment.trackingStatus]}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-orange-600 flex-shrink-0" />
              <div>
                <p className="font-medium">Route</p>
                <p className="text-sm text-gray-600">
                  {shipment.originCity}, {shipment.originCountry} → {shipment.destinationCity}, {shipment.destinationCountry}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Truck className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <div>
                <p className="font-medium">Mode</p>
                <p className="text-sm text-gray-600">{modeLabels[shipment.mode] || shipment.mode}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-purple-600 flex-shrink-0" />
              <div>
                <p className="font-medium">Departure</p>
                <p className="text-sm text-gray-600">
                  {new Date(shipment.departureTime).toLocaleString()}
                </p>
              </div>
            </div>
            {shipment.arrivalTime && (
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="font-medium">Arrival</p>
                  <p className="text-sm text-gray-600">
                    {new Date(shipment.arrivalTime).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6 pt-4 border-t">
            <div className="flex items-center gap-3">
              <Package className="h-5 w-5 text-orange-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium">Capacity (Weight)</p>
                <p className="text-sm text-gray-600">
                  {shipment.remainingCapacityKg} / {shipment.totalCapacityKg} kg remaining
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-orange-600 h-2 rounded-full"
                    style={{ width: `${capacityPercentage}%` }}
                  />
                </div>
              </div>
            </div>
            {shipment.totalCapacityItems !== undefined && (
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <div>
                  <p className="font-medium">Capacity (Items)</p>
                  <p className="text-sm text-gray-600">
                    {shipment.remainingCapacityItems} / {shipment.totalCapacityItems} items remaining
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t">
            <p className="font-medium mb-2">Pricing</p>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Model: {pricingModelLabels[shipment.pricingModel] || shipment.pricingModel}
              </span>
              {shipment.pricePerKg && (
                <span className="text-sm font-medium">£{shipment.pricePerKg} per kg</span>
              )}
              {shipment.pricePerItem && (
                <span className="text-sm font-medium">£{shipment.pricePerItem} per item</span>
              )}
              {shipment.flatPrice && (
                <span className="text-sm font-medium">£{shipment.flatPrice} flat rate</span>
              )}
            </div>
          </div>

          {shipment.cutoffTimeForReceivingItems && (
            <div className="pt-4 border-t">
              <p className="font-medium mb-1">Cutoff Time</p>
              <p className="text-sm text-gray-600">
                Last time to receive items: {new Date(shipment.cutoffTimeForReceivingItems).toLocaleString()}
              </p>
            </div>
          )}

          {/* Tracking Status Update */}
          {shipment.status === 'PUBLISHED' && canUpdateTracking && (
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <PackageCheck className="h-5 w-5 text-indigo-600 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Tracking Status</p>
                    <p className="text-sm text-gray-600">
                      Update the tracking status to automatically update related bookings
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {shipment.trackingStatus && (
                    <Badge className={trackingStatusColors[shipment.trackingStatus] || ''}>
                      {trackingStatusLabels[shipment.trackingStatus]}
                    </Badge>
                  )}
                  <Select
                    value={shipment.trackingStatus || 'PENDING'}
                    onValueChange={(value) => handleTrackingStatusUpdate(value as SlotTrackingStatus)}
                    disabled={updatingTrackingStatus || shipment.trackingStatus === 'DELIVERED'}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(trackingStatusLabels).map(([value, label]) => {
                        const currentStatus = shipment.trackingStatus || 'PENDING';
                        const validNextStatuses = getValidNextStatuses(currentStatus);
                        const isDisabled = 
                          value === currentStatus || 
                          (currentStatus === 'DELIVERED' && value !== 'DELIVERED') ||
                          (!validNextStatuses.includes(value as SlotTrackingStatus) && value !== currentStatus);
                        
                        return (
                          <SelectItem 
                            key={value} 
                            value={value}
                            disabled={isDisabled}
                          >
                            {label}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {updatingTrackingStatus && (
                    <Loader2 className="h-4 w-4 animate-spin text-orange-600" />
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bookings */}
      <Card>
        <CardHeader>
          <CardTitle>Bookings</CardTitle>
          <CardDescription>
            All bookings for this shipment slot ({bookings.length} total)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {bookingsLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-orange-600" />
            </div>
          ) : bookings.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No bookings yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Weight/Items</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{booking.customer.fullName}</p>
                        <p className="text-xs text-muted-foreground">{booking.customer.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {booking.requestedWeightKg ? `${booking.requestedWeightKg} kg` : booking.requestedItemsCount ? `${booking.requestedItemsCount} items` : 'N/A'}
                    </TableCell>
                    <TableCell className="font-medium">£{booking.calculatedPrice}</TableCell>
                    <TableCell>
                      <Badge className={
                        booking.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                        booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        booking.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                        booking.status === 'IN_TRANSIT' ? 'bg-blue-100 text-blue-800' :
                        booking.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                        booking.status === 'CANCELLED' ? 'bg-gray-100 text-gray-800' :
                        'bg-gray-100 text-gray-800'
                      }>
                        {booking.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/company/bookings/${booking.id}`}>
                        <Button variant="ghost" size="sm">View</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

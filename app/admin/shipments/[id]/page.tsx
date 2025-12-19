'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
import { ArrowLeft, MapPin, Calendar, Truck, Building2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { adminApi } from '@/lib/admin-api';
import type { AdminShipmentDetail } from '@/lib/admin-api';
import { toast } from '@/lib/toast';
import { useConfirm } from '@/lib/use-confirm';

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

const bookingStatusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
  IN_TRANSIT: 'bg-blue-100 text-blue-800',
  DELIVERED: 'bg-purple-100 text-purple-800',
};

export default function ShipmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { confirm, ConfirmDialog } = useConfirm();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shipment, setShipment] = useState<AdminShipmentDetail | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchShipment = async () => {
      if (!params.id || typeof params.id !== 'string') return;
      
      try {
        setLoading(true);
        setError(null);
        const shipmentData = await adminApi.getShipment(params.id);
        setShipment(shipmentData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load shipment');
      } finally {
        setLoading(false);
      }
    };

    fetchShipment();
  }, [params.id]);

  const handleClose = async () => {
    if (!shipment) return;
    const confirmed = await confirm({
      title: 'Close Shipment',
      description: 'Are you sure you want to close this shipment?',
      variant: 'destructive',
      confirmText: 'Close',
    });
    if (!confirmed) return;
    try {
      setActionLoading(true);
      await adminApi.closeShipment(shipment.id);
      const updatedShipment = await adminApi.getShipment(shipment.id);
      setShipment(updatedShipment);
      toast.success('Shipment closed successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to close shipment');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    );
  }

  if (error || !shipment) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Shipment not found'}</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  const capacityUsed = (shipment.totalCapacityKg || 0) - (shipment.remainingCapacityKg || 0);
  const capacityPercentage = shipment.totalCapacityKg ? (capacityUsed / shipment.totalCapacityKg) * 100 : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Shipment Details</h1>
            <p className="text-gray-600 mt-2">Shipment ID: {shipment.id}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge className={statusColors[shipment.status] || ''}>
            {shipment.status}
          </Badge>
          {shipment.status !== 'CLOSED' && (
            <Button variant="outline" onClick={handleClose} disabled={actionLoading}>
              Close Shipment
            </Button>
          )}
        </div>
      </div>

      {/* Shipment Info */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Route Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-medium">Origin</p>
                <p className="text-sm text-gray-600">
                  {shipment.originCity}, {shipment.originCountry}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium">Destination</p>
                <p className="text-sm text-gray-600">
                  {shipment.destinationCity}, {shipment.destinationCountry}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-purple-600" />
              <div>
                <p className="font-medium">Transport Mode</p>
                <Badge className={modeColors[shipment.mode] || ''}>
                  {shipment.mode}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium">Departure</p>
                <p className="text-sm text-gray-600">
                  {new Date(shipment.departureTime).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium">Arrival</p>
                <p className="text-sm text-gray-600">
                  {new Date(shipment.arrivalTime).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Capacity & Pricing */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Capacity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {shipment.totalCapacityKg && shipment.remainingCapacityKg !== undefined ? (
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Used: {capacityUsed} kg</span>
                  <span>Total: {shipment.totalCapacityKg} kg</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-orange-600 h-2.5 rounded-full"
                    style={{ width: `${capacityPercentage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {shipment.remainingCapacityKg} kg remaining ({Math.round(100 - capacityPercentage)}% available)
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-600">Capacity information not available</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {shipment.pricingModel && (
              <div className="flex justify-between">
                <span className="text-gray-600">Pricing Model</span>
                <span className="font-medium">{shipment.pricingModel.replace('_', ' ')}</span>
              </div>
            )}
            {shipment.pricePerKg && (
              <div className="flex justify-between">
                <span className="text-gray-600">Price per Kg</span>
                <span className="font-medium">£{parseFloat(shipment.pricePerKg).toFixed(2)}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Company Info */}
      <Card>
        <CardHeader>
          <CardTitle>Company</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-orange-600" />
            <Link href={`/admin/companies/${shipment.company.id}`}>
              <Button variant="link" className="p-0 h-auto">
                {shipment.company.name}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Bookings */}
      {shipment.bookings && shipment.bookings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Bookings</CardTitle>
            <CardDescription>
              {shipment.bookings.length} booking{shipment.bookings.length !== 1 ? 's' : ''} for this shipment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shipment.bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <div className="font-medium">{booking.customer.fullName}</div>
                      <div className="text-sm text-gray-500">{booking.customer.email}</div>
                    </TableCell>
                    <TableCell>£{parseFloat(booking.calculatedPrice).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge className={bookingStatusColors[booking.status] || ''}>
                        {booking.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/admin/bookings/${booking.id}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      <ConfirmDialog />
    </div>
  );
}


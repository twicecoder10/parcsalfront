'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, User, Package, MapPin, Calendar, PoundSterling, Building2, Mail, Phone, Loader2, Truck } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { adminApi, getAdminCustomerName, getAdminCustomerEmail, getAdminBookingPrice } from '@/lib/admin-api';
import type { AdminBookingDetail } from '@/lib/admin-api';

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
  IN_TRANSIT: 'bg-blue-100 text-blue-800',
  DELIVERED: 'bg-purple-100 text-purple-800',
};

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState<AdminBookingDetail | null>(null);

  const fetchBooking = useCallback(async () => {
    if (!params.id || typeof params.id !== 'string') return;
    
    try {
      setLoading(true);
      setError(null);
      const bookingData = await adminApi.getBooking(params.id);
      setBooking(bookingData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load booking');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Booking not found'}</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Booking Details</h1>
            <p className="text-gray-600 mt-2">Booking ID: {booking.id}</p>
          </div>
        </div>
        <Badge className={statusColors[booking.status] || ''}>
          {booking.status}
        </Badge>
      </div>

      {/* Customer Info */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-orange-600" />
            <div>
              <p className="font-medium">Name</p>
              <p className="text-sm text-gray-600">{getAdminCustomerName(booking.customer)}</p>
            </div>
          </div>
          {getAdminCustomerEmail(booking.customer) && (
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium">Email</p>
                <p className="text-sm text-gray-600">{getAdminCustomerEmail(booking.customer)}</p>
              </div>
            </div>
          )}
          {booking.customer.phoneNumber && (
            <div className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium">Phone</p>
                <p className="text-sm text-gray-600">{booking.customer.phoneNumber}</p>
              </div>
            </div>
          )}
          <div className="pt-2">
            <Link href={`/admin/users/${booking.customer.id}`}>
              <Button variant="outline" size="sm">
                View Customer Profile
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Shipment Info */}
      <Card>
        <CardHeader>
          <CardTitle>Shipment Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-orange-600" />
            <div>
              <p className="font-medium">Route</p>
              <p className="text-sm text-gray-600">
                {booking.shipmentSlot.originCity}, {booking.shipmentSlot.originCountry} →{' '}
                {booking.shipmentSlot.destinationCity}, {booking.shipmentSlot.destinationCountry}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <div>
              <p className="font-medium">Departure</p>
              <p className="text-sm text-gray-600">
                {new Date(booking.shipmentSlot.departureTime).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium">Arrival</p>
              <p className="text-sm text-gray-600">
                {new Date(booking.shipmentSlot.arrivalTime).toLocaleString()}
              </p>
            </div>
          </div>
          {booking.shipmentSlot.company && (
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-purple-600" />
              <div className="flex items-center gap-2 flex-1">
                {booking.shipmentSlot.company.logoUrl && (
                  <div className="relative w-8 h-8 rounded overflow-hidden flex-shrink-0">
                    <Image
                      src={booking.shipmentSlot.company.logoUrl}
                      alt={`${booking.shipmentSlot.company.name} logo`}
                      fill
                      className="object-cover"
                      sizes="32px"
                    />
                  </div>
                )}
                <div>
                  <p className="font-medium">Company</p>
                  <Link href={`/admin/companies/${booking.shipmentSlot.company.id}`}>
                    <Button variant="link" className="p-0 h-auto">
                      {booking.shipmentSlot.company.name}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Booking Details */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Booking Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {booking.requestedWeightKg && (
              <div>
                <p className="font-medium text-sm text-gray-600">Requested Weight</p>
                <p className="text-sm">{booking.requestedWeightKg} kg</p>
              </div>
            )}
            {booking.requestedItemsCount && (
              <div>
                <p className="font-medium text-sm text-gray-600">Requested Items</p>
                <p className="text-sm">{booking.requestedItemsCount} items</p>
              </div>
            )}
            {booking.notes && (
              <div>
                <p className="font-medium text-sm text-gray-600">Notes</p>
                <p className="text-sm">{booking.notes}</p>
              </div>
            )}
            <div className="pt-2 border-t">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total Price</span>
                <span className="text-2xl font-bold text-orange-600">
                  £{parseFloat(getAdminBookingPrice(booking)).toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium text-sm text-gray-600">Created At</p>
              <p className="text-sm">
                {new Date(booking.createdAt).toLocaleString()}
              </p>
            </div>
            {booking.updatedAt && (
              <div>
                <p className="font-medium text-sm text-gray-600">Last Updated</p>
                <p className="text-sm">
                  {new Date(booking.updatedAt).toLocaleString()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Parcel Information */}
      {(booking.parcelType || booking.weight || booking.value || booking.length || booking.width || booking.height || booking.description || booking.pickupMethod || booking.deliveryMethod) && (
        <Card>
          <CardHeader>
            <CardTitle>Parcel Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {booking.parcelType && (
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-medium">Parcel Type</p>
                  <p className="text-sm text-gray-600">{booking.parcelType}</p>
                </div>
              </div>
            )}
            {booking.weight && (
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-medium">Actual Weight</p>
                  <p className="text-sm text-gray-600">{booking.weight} kg</p>
                </div>
              </div>
            )}
            {booking.value && (
              <div className="flex items-center gap-3">
                <PoundSterling className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">Parcel Value</p>
                  <p className="text-sm text-gray-600">£{parseFloat(String(booking.value)).toFixed(2)}</p>
                </div>
              </div>
            )}
            {(booking.length || booking.width || booking.height) && (
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">Dimensions</p>
                  <p className="text-sm text-gray-600">
                    {booking.length && booking.width && booking.height
                      ? `${booking.length} × ${booking.width} × ${booking.height} cm`
                      : booking.length
                      ? `Length: ${booking.length} cm`
                      : booking.width
                      ? `Width: ${booking.width} cm`
                      : booking.height
                      ? `Height: ${booking.height} cm`
                      : 'N/A'}
                  </p>
                </div>
              </div>
            )}
            {booking.description && (
              <div className="flex items-start gap-3">
                <Package className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <p className="font-medium">Description</p>
                  <p className="text-sm text-gray-600">{booking.description}</p>
                </div>
              </div>
            )}
            {booking.pickupMethod && (
              <div className="flex items-center gap-3">
                <Truck className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">Pickup Method</p>
                  <p className="text-sm text-gray-600">
                    {booking.pickupMethod === 'PICKUP_FROM_SENDER'
                      ? 'Company picks up from sender'
                      : 'Sender drops off at company'}
                  </p>
                </div>
              </div>
            )}
            {booking.deliveryMethod && (
              <div className="flex items-center gap-3">
                <Truck className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">Delivery Method</p>
                  <p className="text-sm text-gray-600">
                    {booking.deliveryMethod === 'RECEIVER_PICKS_UP'
                      ? 'Receiver picks up from company'
                      : 'Company delivers to receiver'}
                  </p>
                </div>
              </div>
            )}
            {booking.images && booking.images.length > 0 && (
              <div className="flex items-start gap-3">
                <Package className="h-5 w-5 text-purple-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium mb-2">Images</p>
                  <div className="grid grid-cols-2 gap-2">
                    {booking.images.map((image: string, index: number) => (
                      <div key={index} className="relative w-full h-32 rounded-lg border overflow-hidden">
                        <Image
                          src={image}
                          alt={`Parcel image ${index + 1}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}


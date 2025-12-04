'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, User, Package, MapPin, Calendar, DollarSign, Building2, Mail, Phone, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { adminApi } from '@/lib/admin-api';
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

  useEffect(() => {
    const fetchBooking = async () => {
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
    };

    fetchBooking();
  }, [params.id]);

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
              <p className="text-sm text-gray-600">{booking.customer.fullName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            <div>
              <p className="font-medium">Email</p>
              <p className="text-sm text-gray-600">{booking.customer.email}</p>
            </div>
          </div>
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
              <div>
                <p className="font-medium">Company</p>
                <Link href={`/admin/companies/${booking.shipmentSlot.company.id}`}>
                  <Button variant="link" className="p-0 h-auto">
                    {booking.shipmentSlot.company.name}
                  </Button>
                </Link>
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
            <div className="pt-2 border-t">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total Price</span>
                <span className="text-2xl font-bold text-orange-600">
                  £{parseFloat(booking.calculatedPrice).toFixed(2)}
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


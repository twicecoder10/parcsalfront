'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, CreditCard, AlertCircle } from 'lucide-react';
import { customerApi } from '@/lib/customer-api';
import { getErrorMessage } from '@/lib/api';
import Link from 'next/link';

function PaymentContent() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;
  
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBookingData();
  }, [bookingId]);

  const fetchBookingData = async () => {
    setLoading(true);
    try {
      const data = await customerApi.getBookingById(bookingId);
      setBooking(data);
      
      // Check if booking is already paid
      if (data.paymentStatus === 'PAID') {
        router.push(`/customer/bookings/${bookingId}?payment=success`);
        return;
      }
    } catch (error: any) {
      console.error('Failed to fetch booking data:', error);
      setError(getErrorMessage(error) || 'Failed to load booking');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    setProcessing(true);
    setError(null);
    
    try {
      const { url } = await customerApi.createPaymentSession(bookingId);
      
      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error: any) {
      console.error('Payment failed:', error);
      setError(getErrorMessage(error) || 'Failed to create payment session. Please try again.');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Booking not found</p>
            <Link href="/customer/bookings">
              <Button variant="outline">Back to Bookings</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back Button */}
      <Link href={`/customer/bookings/${bookingId}`}>
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Booking
        </Button>
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Complete Payment</h1>
        <p className="text-gray-600 mt-2">Booking #{booking.id || bookingId}</p>
      </div>

      {/* Booking Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Booking Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Route</span>
              <span className="font-medium">
                {booking.shipmentSlot?.originCity || booking.originCity} → {booking.shipmentSlot?.destinationCity || booking.destinationCity}
              </span>
            </div>
            
            {/* Fee Breakdown */}
            <div className="pt-4 border-t space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Payment Breakdown</h3>
              
              {/* Base Amount (Shipment Price) */}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Shipment price</span>
                <span className="font-medium">
                  £{booking.baseAmount 
                    ? (booking.baseAmount / 100).toFixed(2)
                    : (booking.calculatedPrice || booking.price || booking.totalPrice || '0.00')}
                </span>
              </div>
              
              {/* Admin Fee */}
              {booking.adminFeeAmount !== null && booking.adminFeeAmount !== undefined && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Parcsal admin fee (10%)</span>
                  <span className="font-medium">
                    £{(booking.adminFeeAmount / 100).toFixed(2)}
                  </span>
                </div>
              )}
              
              {/* Processing Fee */}
              {booking.processingFeeAmount !== null && booking.processingFeeAmount !== undefined && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Payment processing fee</span>
                  <span className="font-medium">
                    £{(booking.processingFeeAmount / 100).toFixed(2)}
                  </span>
                </div>
              )}
              
              {/* Total */}
              <div className="flex justify-between items-center pt-3 border-t">
                <span className="text-lg font-semibold">Total</span>
              <span className="text-2xl font-bold text-orange-600">
                  £{booking.totalAmount 
                    ? (booking.totalAmount / 100).toFixed(2)
                    : booking.calculatedPrice || booking.price || booking.totalPrice || '0.00'}
              </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="border-red-500 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-red-900 mb-1">Payment Error</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Button */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            <CardTitle>Complete Payment</CardTitle>
          </div>
          <CardDescription>You will be redirected to Stripe Checkout for secure payment processing</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handlePayment}
            className="w-full"
            disabled={processing || booking?.paymentStatus === 'PAID'}
            size="lg"
          >
            {processing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Redirecting to Checkout...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Pay £{booking?.totalAmount 
                  ? (booking.totalAmount / 100).toFixed(2)
                  : booking?.calculatedPrice || booking?.totalPrice || '0.00'}
              </>
            )}
          </Button>
          {booking?.paymentStatus === 'PAID' && (
            <p className="text-sm text-green-600 mt-2 text-center">
              This booking has already been paid
            </p>
          )}
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Card className="bg-gray-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <CreditCard className="h-5 w-5 text-gray-600 mt-0.5" />
            <div className="text-sm text-gray-600">
              <p className="font-medium mb-1">Secure Payment via Stripe</p>
              <p>Your payment is processed securely through Stripe Checkout. We never store or see your card details.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentPage() {
  return <PaymentContent />;
}


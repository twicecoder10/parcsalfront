'use client';

import { useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function BookingRedirectPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = params.id as string;
  const payment = searchParams.get('payment');

  useEffect(() => {
    // Redirect to customer bookings page with payment parameter
    const redirectUrl = payment 
      ? `/customer/bookings/${bookingId}?payment=${payment}`
      : `/customer/bookings/${bookingId}`;
    
    router.replace(redirectUrl);
  }, [bookingId, payment, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
    </div>
  );
}


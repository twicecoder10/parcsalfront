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
  const extraCharge = searchParams.get('extraCharge');
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Build redirect URL with all relevant parameters
    const params = new URLSearchParams();
    
    if (payment) {
      params.set('payment', payment);
    }
    
    if (extraCharge) {
      params.set('extraCharge', extraCharge);
    }
    
    if (sessionId) {
      params.set('session_id', sessionId);
    }
    
    const queryString = params.toString();
    const redirectUrl = queryString
      ? `/customer/bookings/${bookingId}?${queryString}`
      : `/customer/bookings/${bookingId}`;
    
    router.replace(redirectUrl);
  }, [bookingId, payment, extraCharge, sessionId, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
    </div>
  );
}


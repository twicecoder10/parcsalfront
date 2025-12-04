'use client';

import { useEffect, useState } from 'react';

declare global {
  interface Window {
    google: any;
    initGoogleMaps: () => void;
  }
}

interface GoogleMapsLoaderProps {
  children: React.ReactNode;
}

export function GoogleMapsLoader({ children }: GoogleMapsLoaderProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.error('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set');
      setIsError(true);
      return;
    }

    // Check if Google Maps is already loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      setIsLoaded(true);
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
    if (existingScript) {
      existingScript.addEventListener('load', () => setIsLoaded(true));
      existingScript.addEventListener('error', () => setIsError(true));
      return;
    }

    // Load Google Maps script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsLoaded(true);
    script.onerror = () => setIsError(true);
    document.head.appendChild(script);

    return () => {
      // Cleanup if component unmounts
      const scriptToRemove = document.querySelector(`script[src*="maps.googleapis.com"]`);
      if (scriptToRemove && scriptToRemove === script) {
        scriptToRemove.remove();
      }
    };
  }, []);

  if (isError) {
    return <div className="text-red-500 text-sm">Failed to load Google Maps. Please refresh the page.</div>;
  }

  if (!isLoaded) {
    return null; // Or a loading spinner
  }

  return <>{children}</>;
}


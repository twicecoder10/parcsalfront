'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { GoogleMapsLoader } from './google-maps-loader';
import { Loader2, Warehouse, Package, ShoppingCart, AlertCircle } from 'lucide-react';
import { companyApi } from '@/lib/company-api';
import type { WarehouseAddress, Shipment, Booking } from '@/lib/company-api';
import { useCompanyPlan } from '@/lib/hooks/use-company-plan';
import { usePlanErrorHandler } from '@/lib/hooks/use-plan-error-handler';
import { getErrorMessage } from '@/lib/api';

interface MapMarker {
  id: string;
  type: 'warehouse' | 'slot' | 'booking';
  position: { lat: number; lng: number };
  title: string;
  info?: string;
}

interface RouteLine {
  id: string;
  type: 'slot' | 'booking';
  from: { lat: number; lng: number };
  to: { lat: number; lng: number };
  color: string;
  info?: string;
}

// Inner component that only renders when Google Maps is loaded
function MapContent() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const polylinesRef = useRef<google.maps.Polyline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [routes, setRoutes] = useState<RouteLine[]>([]);
  const [warehousesMap, setWarehousesMap] = useState<Map<string, WarehouseAddress>>(new Map());
  const { canAccessWarehouses } = useCompanyPlan();
  const { handleError, UpgradeModal } = usePlanErrorHandler();

  // Geocode function
  const geocodeAddress = useCallback(async (address: string): Promise<{ lat: number; lng: number } | null> => {
    return new Promise((resolve) => {
      if (!window.google?.maps?.Geocoder) {
        console.error('Geocoder not available');
        resolve(null);
        return;
      }

      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address }, (results: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
        if (status === window.google.maps.GeocoderStatus.OK && results && results[0]) {
          const location = results[0].geometry.location;
          resolve({
            lat: location.lat(),
            lng: location.lng(),
          });
        } else {
          console.warn(`Geocoding failed for "${address}":`, status);
          resolve(null);
        }
      });
    });
  }, []);

  // Fetch data - only runs when component mounts (which is after Google Maps loads)
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Verify Google Maps is available (should be since we're inside GoogleMapsLoader)
        if (!window.google?.maps?.Geocoder) {
          setError('Google Maps Geocoder is not available. Please refresh the page.');
          setLoading(false);
          return;
        }

        // Fetch warehouses, shipments, and active bookings in parallel
        // Only fetch warehouses if plan supports it
        const fetchPromises: [
          Promise<WarehouseAddress[]>,
          Promise<{ data: Shipment[]; pagination: any }>,
          Promise<{ data: Booking[]; pagination: any }>
        ] = [
          canAccessWarehouses
            ? companyApi.getWarehouseAddresses().catch((err) => {
                // Handle 403 errors gracefully
                if (err?.response?.status === 403) {
                  handleError(err);
                  return []; // Return empty array if not available
                }
                throw err;
              })
            : Promise.resolve([]),
          companyApi.getShipments({ limit: 1000 }), // Get all slots
          companyApi.getBookings({ 
            limit: 1000,
            status: 'ACCEPTED' // Only active bookings
          }),
        ];

        const [warehouses, shipmentsResponse, bookingsResponse] = await Promise.all(fetchPromises);

        const shipments = shipmentsResponse.data || [];
        const bookings = bookingsResponse.data || [];

        // Create warehouses map for quick lookup
        const warehousesMapData = new Map<string, WarehouseAddress>();
        warehouses.forEach(w => warehousesMapData.set(w.id, w));
        setWarehousesMap(warehousesMapData);

        // Geocode all locations with batching to avoid rate limits
        const allMarkers: MapMarker[] = [];
        const geocodeCache = new Map<string, { lat: number; lng: number } | null>();

        // Helper to geocode with caching and delay
        const geocodeWithDelay = async (address: string, delay: number = 100): Promise<{ lat: number; lng: number } | null> => {
          if (geocodeCache.has(address)) {
            return geocodeCache.get(address) || null;
          }
          
          await new Promise(resolve => setTimeout(resolve, delay));
          const coords = await geocodeAddress(address);
          geocodeCache.set(address, coords);
          return coords;
        };

        // Geocode warehouses
        for (const warehouse of warehouses) {
          const address = `${warehouse.address}, ${warehouse.city}, ${warehouse.country}`;
          const coords = await geocodeWithDelay(address);
          if (coords) {
            allMarkers.push({
              id: warehouse.id,
              type: 'warehouse',
              position: coords,
              title: warehouse.name,
              info: `${warehouse.address}, ${warehouse.city}, ${warehouse.country}`,
            });
          }
        }

        // Geocode shipment slots (origin and destination)
        // Use Set to deduplicate locations
        const slotLocations = new Set<string>();
        for (const shipment of shipments) {
          slotLocations.add(`${shipment.originCity}, ${shipment.originCountry}`);
          slotLocations.add(`${shipment.destinationCity}, ${shipment.destinationCountry}`);
        }

        const slotCoordsMap = new Map<string, { lat: number; lng: number } | null>();
        for (const location of slotLocations) {
          const coords = await geocodeWithDelay(location);
          slotCoordsMap.set(location, coords);
        }

        // Create markers and routes for shipment slots
        const slotRoutes: RouteLine[] = [];
        for (const shipment of shipments) {
          const originKey = `${shipment.originCity}, ${shipment.originCountry}`;
          const destKey = `${shipment.destinationCity}, ${shipment.destinationCountry}`;
          
          const originCoords = slotCoordsMap.get(originKey);
          const destCoords = slotCoordsMap.get(destKey);
          
          if (originCoords && destCoords) {
            // Add route line
            slotRoutes.push({
              id: `slot-route-${shipment.id}`,
              type: 'slot',
              from: originCoords,
              to: destCoords,
              color: '#10B981', // Green
              info: `Slot: ${shipment.originCity} → ${shipment.destinationCity}`,
            });

            // Add markers
            allMarkers.push({
              id: `slot-origin-${shipment.id}`,
              type: 'slot',
              position: originCoords,
              title: `Slot Origin: ${shipment.originCity}`,
              info: `${shipment.originCity}, ${shipment.originCountry} → ${shipment.destinationCity}, ${shipment.destinationCountry}`,
            });

            allMarkers.push({
              id: `slot-dest-${shipment.id}`,
              type: 'slot',
              position: destCoords,
              title: `Slot Destination: ${shipment.destinationCity}`,
              info: `${shipment.originCity}, ${shipment.originCountry} → ${shipment.destinationCity}, ${shipment.destinationCountry}`,
            });
          }
        }

        // Geocode active bookings (origin and destination from shipment slot)
        // Use Set to deduplicate locations
        const bookingLocations = new Set<string>();
        for (const booking of bookings) {
          if (booking.shipmentSlot) {
            bookingLocations.add(`${booking.shipmentSlot.originCity}, ${booking.shipmentSlot.originCountry}`);
            bookingLocations.add(`${booking.shipmentSlot.destinationCity}, ${booking.shipmentSlot.destinationCountry}`);
          }
        }

        const bookingCoordsMap = new Map<string, { lat: number; lng: number } | null>();
        for (const location of bookingLocations) {
          const coords = await geocodeWithDelay(location);
          bookingCoordsMap.set(location, coords);
        }

        // Create markers and routes for bookings
        // Fetch full booking details to get warehouse IDs and pickup/delivery methods
        const bookingRoutes: RouteLine[] = [];
        const bookingDetailsPromises = bookings.map(booking => 
          companyApi.getBookingById(booking.id).catch(() => null)
        );
        const bookingDetails = await Promise.all(bookingDetailsPromises);

        for (let i = 0; i < bookings.length; i++) {
          const booking = bookings[i];
          const bookingDetail = bookingDetails[i];
          
          if (booking.shipmentSlot && bookingDetail) {
            let pickupCoords: { lat: number; lng: number } | null = null;
            let deliveryCoords: { lat: number; lng: number } | null = null;
            let pickupTitle = `Booking Origin: ${booking.shipmentSlot.originCity}`;
            let deliveryTitle = `Booking Destination: ${booking.shipmentSlot.destinationCity}`;

            // Determine pickup location
            // Check if booking has warehouse info (might be in bookingDetail as any)
            const bookingWithWarehouse = bookingDetail as any;
            if (bookingDetail.pickupMethod === 'DROP_OFF_AT_COMPANY' && bookingWithWarehouse.pickupWarehouseId) {
              const warehouse = warehousesMapData.get(bookingWithWarehouse.pickupWarehouseId);
              if (warehouse) {
                const address = `${warehouse.address}, ${warehouse.city}, ${warehouse.country}`;
                pickupCoords = await geocodeWithDelay(address);
                pickupTitle = `Pickup Warehouse: ${warehouse.name}`;
              }
            }
            
            // Fallback to origin city if no warehouse or pickup from sender
            if (!pickupCoords) {
              const originKey = `${booking.shipmentSlot.originCity}, ${booking.shipmentSlot.originCountry}`;
              pickupCoords = bookingCoordsMap.get(originKey) || null;
            }

            // Determine delivery location
            if (bookingDetail.deliveryMethod === 'RECEIVER_PICKS_UP' && bookingWithWarehouse.deliveryWarehouseId) {
              const warehouse = warehousesMapData.get(bookingWithWarehouse.deliveryWarehouseId);
              if (warehouse) {
                const address = `${warehouse.address}, ${warehouse.city}, ${warehouse.country}`;
                deliveryCoords = await geocodeWithDelay(address);
                deliveryTitle = `Delivery Warehouse: ${warehouse.name}`;
              }
            }
            
            // Fallback to destination city if no warehouse or delivered to receiver
            if (!deliveryCoords) {
              const destKey = `${booking.shipmentSlot.destinationCity}, ${booking.shipmentSlot.destinationCountry}`;
              deliveryCoords = bookingCoordsMap.get(destKey) || null;
            }

            // Add route if both coordinates are available
            if (pickupCoords && deliveryCoords) {
              bookingRoutes.push({
                id: `booking-route-${booking.id}`,
                type: 'booking',
                from: pickupCoords,
                to: deliveryCoords,
                color: '#F59E0B', // Orange
                info: `Booking #${booking.id}: ${booking.shipmentSlot.originCity} → ${booking.shipmentSlot.destinationCity}`,
              });

              // Add markers
              allMarkers.push({
                id: `booking-pickup-${booking.id}`,
                type: 'booking',
                position: pickupCoords,
                title: pickupTitle,
                info: `Booking #${booking.id} - ${booking.shipmentSlot.originCity} → ${booking.shipmentSlot.destinationCity}`,
              });

              allMarkers.push({
                id: `booking-delivery-${booking.id}`,
                type: 'booking',
                position: deliveryCoords,
                title: deliveryTitle,
                info: `Booking #${booking.id} - ${booking.shipmentSlot.originCity} → ${booking.shipmentSlot.destinationCity}`,
              });
            }
          }
        }

        setMarkers(allMarkers);
        setRoutes([...slotRoutes, ...bookingRoutes]);
      } catch (err: any) {
        console.error('Failed to fetch map data:', err);
        // Try to handle as plan error first
        if (!handleError(err)) {
          // If not a plan error, show regular error message
          setError(getErrorMessage(err) || 'Failed to load map data. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    // Small delay to ensure Google Maps is fully initialized
    const timer = setTimeout(() => {
      fetchData();
    }, 100);

    return () => clearTimeout(timer);
  }, [canAccessWarehouses, geocodeAddress, handleError]);

  // Helper function to create icon URL from SVG
  const createIconUrl = (iconSvg: string, color: string): string => {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="2">
        ${iconSvg}
      </svg>
    `;
    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
  };

  // Get icon SVG path based on type (using lucide-react icon paths)
  const getIconSvg = (type: string): string => {
    switch (type) {
      case 'warehouse':
        // Warehouse icon
        return '<path d="M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35l2-1.2V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v.5l8-4.8 8 4.8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.15Z"/><path d="M6 18h12"/><path d="M6 14h12"/><rect x="6" y="10" width="12" height="4"/>';
      case 'slot':
        // Package icon
        return '<path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>';
      case 'booking':
        // Shopping cart icon
        return '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>';
      default:
        return '<circle cx="12" cy="12" r="10"/>';
    }
  };

  // Initialize map and display markers and routes
  useEffect(() => {
    if (!mapRef.current || !window.google?.maps) return;

    // Initialize map
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        zoom: 2,
        center: { lat: 0, lng: 0 },
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
      });
    }

    // Clear existing markers and polylines
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
    polylinesRef.current.forEach(polyline => polyline.setMap(null));
    polylinesRef.current = [];

    if (markers.length === 0 && routes.length === 0) return;

    // Create polylines for routes
    routes.forEach((route) => {
      const polyline = new window.google.maps.Polyline({
        path: [
          new window.google.maps.LatLng(route.from.lat, route.from.lng),
          new window.google.maps.LatLng(route.to.lat, route.to.lng),
        ],
        geodesic: true,
        strokeColor: route.color,
        strokeOpacity: 0.6,
        strokeWeight: 3,
      });
      polyline.setMap(mapInstanceRef.current!);
      polylinesRef.current.push(polyline);
    });

    // Create markers with icons
    const markerColors: Record<string, string> = {
      warehouse: '#3B82F6', // Blue
      slot: '#10B981', // Green
      booking: '#F59E0B', // Orange
    };

    const infoWindow = new window.google.maps.InfoWindow();

    markers.forEach((markerData) => {
      const iconUrl = createIconUrl(getIconSvg(markerData.type), markerColors[markerData.type] || '#6B7280');
      
      const marker = new window.google.maps.Marker({
        position: markerData.position,
        map: mapInstanceRef.current!,
        title: markerData.title,
        icon: {
          url: iconUrl,
          scaledSize: new window.google.maps.Size(32, 32),
          anchor: new window.google.maps.Point(16, 16),
        },
      });

      // Add click listener to show info window
      marker.addListener('click', () => {
        infoWindow.setContent(`
          <div style="padding: 8px;">
            <h3 style="margin: 0 0 4px 0; font-weight: 600; font-size: 14px;">${markerData.title}</h3>
            ${markerData.info ? `<p style="margin: 0; font-size: 12px; color: #6B7280;">${markerData.info}</p>` : ''}
          </div>
        `);
        infoWindow.open(mapInstanceRef.current!, marker);
      });

      markersRef.current.push(marker);
    });

    // Fit bounds to show all markers and routes
    if ((markers.length > 0 || routes.length > 0) && mapInstanceRef.current) {
      const bounds = new window.google.maps.LatLngBounds();
      markers.forEach(marker => {
        bounds.extend(marker.position);
      });
      routes.forEach(route => {
        bounds.extend(route.from);
        bounds.extend(route.to);
      });
      mapInstanceRef.current.fitBounds(bounds);
    }
  }, [markers, routes]);

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-96 flex items-center justify-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-sm">
          {canAccessWarehouses && (
            <div className="flex items-center gap-2">
              <Warehouse className="w-4 h-4 text-blue-500" />
              <span>Warehouses</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-green-500" />
            <span>Shipment Slots</span>
          </div>
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-orange-500" />
            <span>Active Bookings</span>
          </div>
        </div>

        {/* Map */}
        <div ref={mapRef} className="w-full h-96 rounded-lg border" />
      </div>
      <UpgradeModal />
    </>
  );
}

// Main component that wraps with GoogleMapsLoader
export function CompanyMapView() {
  return (
    <GoogleMapsLoader>
      <MapContent />
    </GoogleMapsLoader>
  );
}


'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, PoundSterling, ArrowRight, Star } from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';

export interface ShipmentCardData {
  id: string;
  originCity?: string;
  originCountry?: string;
  destinationCity?: string;
  destinationCountry?: string;
  departureDate?: string;
  departureTime?: string;
  arrivalDate?: string;
  arrivalTime?: string;
  mode?: string;
  companyName?: string;
  company?: {
    id?: string;
    slug?: string;
    name?: string;
    rating?: number;
    logoUrl?: string;
  };
  companyRating?: number;
  priceFrom?: number;
  priceTo?: number;
  pricePerKg?: string | number;
  pricePerItem?: string | number | null;
  flatPrice?: string | number | null;
  pricingModel?: 'PER_KG' | 'PER_ITEM' | 'FLAT';
  remainingCapacity?: number;
  remainingCapacityKg?: number;
  capacityUnit?: string;
  currency?: string;
}

interface ShipmentCardProps {
  shipment: ShipmentCardData;
  showViewButton?: boolean;
}

const modeIcons: Record<string, string> = {
  TRUCK: '🚚',
  VAN: '🚐',
  AIR: '✈️',
  TRAIN: '🚂',
  SHIP: '🚢',
  RIDER: '🏍️',
};

const modeColors: Record<string, string> = {
  TRUCK: 'bg-blue-100 text-blue-800',
  VAN: 'bg-purple-100 text-purple-800',
  AIR: 'bg-sky-100 text-sky-800',
  TRAIN: 'bg-green-100 text-green-800',
  SHIP: 'bg-indigo-100 text-indigo-800',
  RIDER: 'bg-orange-100 text-orange-800',
};

export function ShipmentCard({ shipment, showViewButton = true }: ShipmentCardProps) {
  const origin = `${shipment.originCity || ''}${shipment.originCity && shipment.originCountry ? ', ' : ''}${shipment.originCountry || ''}`.trim();
  const destination = `${shipment.destinationCity || ''}${shipment.destinationCity && shipment.destinationCountry ? ', ' : ''}${shipment.destinationCountry || ''}`.trim();
  
  // Get company name from nested company object or direct property
  const companyName = shipment.company?.name || shipment.companyName || 'Shipping Company';
  const companyRating = shipment.company?.rating || shipment.companyRating;
  const companyLogoUrl = shipment.company?.logoUrl;
  
  // Get remaining capacity
  const remainingCapacity = shipment.remainingCapacityKg || shipment.remainingCapacity;
  
  // Format departure time from ISO string
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return format(date, 'MMM dd, yyyy');
    } catch {
      return dateStr;
    }
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return format(date, 'HH:mm');
    } catch {
      return '';
    }
  };

  // Calculate price from API response
  const calculatePrice = () => {
    // If priceFrom is provided, use it
    if (shipment.priceFrom) {
      if (shipment.priceTo && shipment.priceTo !== shipment.priceFrom) {
        return `From £${shipment.priceFrom.toLocaleString()} - £${shipment.priceTo.toLocaleString()}`;
      }
      return `From £${shipment.priceFrom.toLocaleString()}`;
    }
    
    // Otherwise calculate from pricing model
    if (shipment.pricingModel === 'PER_KG' && shipment.pricePerKg) {
      const price = typeof shipment.pricePerKg === 'string' ? parseFloat(shipment.pricePerKg) : shipment.pricePerKg;
      return `£${price.toFixed(2)} per kg`;
    }
    
    if (shipment.pricingModel === 'PER_ITEM' && shipment.pricePerItem) {
      const price = typeof shipment.pricePerItem === 'string' ? parseFloat(shipment.pricePerItem) : shipment.pricePerItem;
      return `£${price.toFixed(2)} per item`;
    }
    
    if (shipment.pricingModel === 'FLAT' && shipment.flatPrice) {
      const price = typeof shipment.flatPrice === 'string' ? parseFloat(shipment.flatPrice) : shipment.flatPrice;
      return `£${price.toFixed(2)} flat rate`;
    }
    
    return 'Contact for pricing';
  };

  // Get departure date/time from departureTime ISO string
  const departureTime = shipment.departureTime || shipment.departureDate;
  const departureDateFormatted = departureTime ? formatDate(departureTime) : null;
  const departureTimeFormatted = departureTime ? formatTime(departureTime) : null;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold mb-1">
              {origin || 'Origin'} → {destination || 'Destination'}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1">
              {companyLogoUrl && (
                <div className="relative w-6 h-6 rounded overflow-hidden flex-shrink-0">
                  <Image
                    src={companyLogoUrl}
                    alt={`${companyName} logo`}
                    fill
                    className="object-cover"
                    sizes="24px"
                  />
                </div>
              )}
              <Link 
                href={`/companies/${shipment.company?.slug || shipment.company?.id || 'unknown'}`}
                className="text-sm hover:text-orange-600 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                {companyName}
              </Link>
            </div>
          </div>
          {companyRating && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              {companyRating.toFixed(1)}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            {departureDateFormatted && (
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {departureDateFormatted}
                {departureTimeFormatted && ` at ${departureTimeFormatted}`}
              </span>
            )}
            {shipment.mode && (
              <Badge className={modeColors[shipment.mode] || 'bg-gray-100 text-gray-800'}>
                <span className="mr-1">{modeIcons[shipment.mode] || '📦'}</span>
                {shipment.mode}
              </Badge>
            )}
          </div>

          {remainingCapacity !== undefined && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">Available:</span> {remainingCapacity} {shipment.capacityUnit || 'kg'}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-1 text-orange-600 font-semibold">
              <span>{calculatePrice()}</span>
            </div>
            {showViewButton && (
              <Link href={`/shipments/${shipment.id}`}>
                <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                  View Details
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


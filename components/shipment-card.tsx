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
    <Card className="hover:shadow-lg transition-shadow h-full flex flex-col">
      <CardHeader className="p-4 md:p-6 pb-3 md:pb-4">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-2 mb-2">
          <div className="flex-1 w-full">
            <CardTitle className="text-base md:text-lg font-semibold mb-2 leading-tight">
              {origin || 'Origin'} → {destination || 'Destination'}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1">
              {companyLogoUrl && (
                <div className="relative w-5 h-5 md:w-6 md:h-6 rounded overflow-hidden flex-shrink-0">
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
                className="text-xs md:text-sm hover:text-orange-600 transition-colors truncate"
                onClick={(e) => e.stopPropagation()}
              >
                {companyName}
              </Link>
            </div>
          </div>
          {companyRating && (
            <Badge variant="outline" className="flex items-center gap-1 text-xs flex-shrink-0">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              {companyRating.toFixed(1)}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-4 md:p-6 pt-0 flex-1 flex flex-col">
        <div className="space-y-3 flex-1">
          {/* Date and Mode */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs md:text-sm text-gray-600">
            {departureDateFormatted && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0" />
                <span className="truncate">
                  {departureDateFormatted}
                  {departureTimeFormatted && <span className="hidden sm:inline"> at {departureTimeFormatted}</span>}
                </span>
              </span>
            )}
            {shipment.mode && (
              <Badge className={`${modeColors[shipment.mode] || 'bg-gray-100 text-gray-800'} text-xs`}>
                <span className="mr-1">{modeIcons[shipment.mode] || '📦'}</span>
                {shipment.mode}
              </Badge>
            )}
          </div>

          {/* Capacity */}
          {remainingCapacity !== undefined && (
            <div className="text-xs md:text-sm text-gray-600">
              <span className="font-medium">Available:</span> {remainingCapacity} {shipment.capacityUnit || 'kg'}
            </div>
          )}

          {/* Price and Button */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t mt-auto">
            <div className="text-orange-600 font-semibold text-sm md:text-base">
              {calculatePrice()}
            </div>
            {showViewButton && (
              <Link href={`/shipments/${shipment.id}`} className="w-full sm:w-auto">
                <Button size="sm" className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-xs md:text-sm h-8 md:h-9">
                  <span className="hidden sm:inline">View Details</span>
                  <span className="sm:hidden">View</span>
                  <ArrowRight className="ml-1 h-3.5 w-3.5 md:h-4 md:w-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


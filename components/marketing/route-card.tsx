import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface RouteCardProps {
  origin: string;
  destination: string;
  nextDeparture?: string;
  image?: string;
  searchUrl: string;
}

export function RouteCard({ origin, destination, nextDeparture, image, searchUrl }: RouteCardProps) {
  return (
    <Link href={searchUrl}>
      <Card className="group overflow-hidden border-2 hover:border-orange-300 hover:shadow-xl transition-all duration-300 cursor-pointer">
        <div className="relative h-48 overflow-hidden bg-gradient-to-br from-orange-50 to-blue-50">
          {image && (
            <Image 
              src={image} 
              alt={`${origin} to ${destination}`}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          
          {/* Badge - Only show if nextDeparture is provided */}
          {nextDeparture && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-orange-600 text-white border-0 shadow-lg">
                {nextDeparture}
              </Badge>
            </div>
          )}
          
          {/* Route Info */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span className="font-semibold text-lg">{origin}</span>
              </div>
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              <div className="flex items-center gap-2">
                <span className="font-semibold text-lg">{destination}</span>
                <MapPin className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>
        
        <CardContent className="p-4">
          <div className="text-center">
            <span className="text-sm text-gray-600 group-hover:text-orange-600 transition-colors font-medium">
              View options →
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}


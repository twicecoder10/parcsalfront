import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Checks if a shipment is still available for booking
 * A shipment is unavailable if:
 * - The cutoff time has passed (if it exists)
 * - The departure time has passed
 */
export function isShipmentAvailable(shipment: {
  cutoffTimeForReceivingItems?: string | null;
  departureTime?: string | null;
}): boolean {
  const now = new Date();
  
  // Check cutoff time if it exists
  if (shipment.cutoffTimeForReceivingItems) {
    const cutoffTime = new Date(shipment.cutoffTimeForReceivingItems);
    if (cutoffTime < now) {
      return false;
    }
  }
  
  // Check departure time
  if (shipment.departureTime) {
    const departureTime = new Date(shipment.departureTime);
    if (departureTime < now) {
      return false;
    }
  }
  
  return true;
}


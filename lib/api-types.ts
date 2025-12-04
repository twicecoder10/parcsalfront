// Additional API types for shipment search and other endpoints

export interface ShipmentSearchParams {
  originCity?: string;
  originCountry?: string;
  destinationCity?: string;
  destinationCountry?: string;
  dateFrom?: string; // ISO 8601 datetime
  dateTo?: string; // ISO 8601 datetime
  mode?: 'AIR' | 'BUS' | 'VAN' | 'TRAIN' | 'SHIP' | 'RIDER';
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
  offset?: number;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  isVerified: boolean;
  logoUrl?: string;
}

export interface Shipment {
  id: string;
  originCountry: string;
  originCity: string;
  destinationCountry: string;
  destinationCity: string;
  departureTime: string; // ISO 8601 datetime
  arrivalTime: string; // ISO 8601 datetime
  mode: 'AIR' | 'BUS' | 'VAN' | 'TRAIN' | 'SHIP' | 'RIDER';
  totalCapacityKg: number;
  remainingCapacityKg: number;
  totalCapacityItems: number | null;
  remainingCapacityItems: number | null;
  pricingModel: 'PER_KG' | 'PER_ITEM' | 'FLAT';
  pricePerKg: string | number | null; // API returns as string, but can be number for compatibility
  pricePerItem: string | number | null; // API returns as string, but can be number for compatibility
  flatPrice: string | number | null; // API returns as string, but can be number for compatibility
  cutoffTimeForReceivingItems: string; // ISO 8601 datetime
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
  company: Company;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationResponse {
  limit: number;
  offset: number;
  total: number;
  hasMore: boolean;
}

export interface ShipmentSearchResponse {
  data: Shipment[];
  pagination: PaginationResponse;
}

// Notification Types
export type NotificationType =
  | 'BOOKING_CREATED'
  | 'BOOKING_ACCEPTED'
  | 'BOOKING_REJECTED'
  | 'BOOKING_CANCELLED'
  | 'BOOKING_IN_TRANSIT'
  | 'BOOKING_DELIVERED'
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_REFUNDED'
  | 'SHIPMENT_PUBLISHED'
  | 'SHIPMENT_CLOSED'
  | 'SHIPMENT_TRACKING_UPDATE'
  | 'TEAM_INVITATION'
  | 'TEAM_MEMBER_ADDED'
  | 'TEAM_MEMBER_REMOVED'
  | 'SUBSCRIPTION_ACTIVE'
  | 'SUBSCRIPTION_CANCELLED'
  | 'SUBSCRIPTION_PAST_DUE';

export interface NotificationMetadata {
  // Booking notifications
  bookingId?: string;
  shipmentSlotId?: string;
  status?: string;
  customerId?: string;
  customerName?: string;
  // Payment notifications
  paymentIntentId?: string;
  amount?: number;
  refundedAmount?: number;
  // Shipment notifications
  trackingStatus?: string;
  originCity?: string;
  destinationCity?: string;
  // Team notifications
  invitationId?: string;
  companyId?: string;
  companyName?: string;
  role?: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  metadata?: NotificationMetadata;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface NotificationListResponse {
  status: 'success';
  data: Notification[];
  pagination: NotificationPagination;
}

export interface UnreadCountResponse {
  status: 'success';
  count: number;
}


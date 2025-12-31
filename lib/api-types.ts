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
  trackingStatus?: 'PENDING' | 'IN_TRANSIT' | 'ARRIVED_AT_DESTINATION' | 'DELAYED' | 'DELIVERED';
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
  | 'SUBSCRIPTION_PAST_DUE'
  | 'EXTRA_CHARGE_REQUESTED'
  | 'EXTRA_CHARGE_PAID'
  | 'EXTRA_CHARGE_DECLINED'
  | 'EXTRA_CHARGE_CANCELLED';

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
  limit: number;
  offset: number;
  total: number;
  hasMore: boolean;
  // Computed fields for backward compatibility
  page?: number;
  totalPages?: number;
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

// Booking Types
export type ParcelType = 
  | 'DOCUMENT' 
  | 'PACKAGE' 
  | 'FRAGILE' 
  | 'ELECTRONICS' 
  | 'CLOTHING' 
  | 'FOOD' 
  | 'MEDICINE' 
  | 'OTHER';

export type PickupMethod = 'PICKUP_FROM_SENDER' | 'DROP_OFF_AT_COMPANY';

export type DeliveryMethod = 'RECEIVER_PICKS_UP' | 'DELIVERED_TO_RECEIVER';

// Extra Charge Types
export type ExtraChargeReason =
  | 'EXCESS_WEIGHT'
  | 'EXTRA_ITEMS'
  | 'OVERSIZE'
  | 'REPACKING'
  | 'LATE_DROP_OFF'
  | 'OTHER';

export type ExtraChargeStatus =
  | 'PENDING'
  | 'PAID'
  | 'DECLINED'
  | 'EXPIRED'
  | 'CANCELLED';

export interface ExtraCharge {
  id: string;
  bookingId: string;
  companyId: string;
  reason: ExtraChargeReason;
  description?: string | null;
  evidenceUrls: string[];
  baseAmount: number; // minor units (pence)
  adminFeeAmount: number; // minor units (pence)
  processingFeeAmount: number; // minor units (pence)
  totalAmount: number; // minor units (pence)
  status: ExtraChargeStatus;
  stripeSessionId?: string | null;
  stripePaymentIntentId?: string | null;
  expiresAt: string; // ISO date string
  paidAt?: string | null; // ISO date string
  declinedAt?: string | null; // ISO date string
  cancelledAt?: string | null; // ISO date string
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  company?: {
    id: string;
    name: string;
  };
  createdBy?: {
    id: string;
    fullName: string;
  };
}

// Warehouse Address
export interface WarehouseAddress {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string | null;
  country: string;
  postalCode: string | null;
  isDefault: boolean;
}

export interface CreateBookingRequest {
  shipmentSlotId: string;
  requestedWeightKg?: number | null;
  requestedItemsCount?: number | null;
  notes?: string | null;
  
  // New parcel information fields
  parcelType?: ParcelType | null;
  weight?: number | null;
  value?: number | null;
  length?: number | null;
  width?: number | null;
  height?: number | null;
  description?: string | null;
  images?: string[];
  pickupMethod: PickupMethod;  // Required
  deliveryMethod: DeliveryMethod; // Required
  
  // Pickup address fields (required if pickupMethod === "PICKUP_FROM_SENDER")
  pickupAddress?: string | null;
  pickupCity?: string | null;
  pickupState?: string | null;
  pickupCountry?: string | null;
  pickupPostalCode?: string | null;
  pickupContactName?: string | null;
  pickupContactPhone?: string | null;
  
  // Pickup warehouse (required if pickupMethod === "DROP_OFF_AT_COMPANY")
  pickupWarehouseId?: string | null;
  
  // Delivery address fields (required if deliveryMethod === "DELIVERED_TO_RECEIVER")
  deliveryAddress?: string | null;
  deliveryCity?: string | null;
  deliveryState?: string | null;
  deliveryCountry?: string | null;
  deliveryPostalCode?: string | null;
  deliveryContactName?: string | null;
  deliveryContactPhone?: string | null;
  
  // Delivery warehouse (required if deliveryMethod === "RECEIVER_PICKS_UP")
  deliveryWarehouseId?: string | null;
}

export interface Booking {
  id: string;
  shipmentSlotId: string;
  customerId: string;
  companyId: string;
  requestedWeightKg?: number | null;
  requestedItemsCount?: number | null;
  calculatedPrice: string | number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'IN_TRANSIT' | 'DELIVERED';
  paymentStatus: 'PENDING' | 'PAID' | 'UNPAID' | 'REFUNDED';
  notes?: string | null;
  
  // New parcel information fields
  parcelType: ParcelType | null;
  weight: number | null;
  value: string | null;  // Decimal as string from API
  length: number | null;
  width: number | null;
  height: number | null;
  description: string | null;
  images: string[];
  pickupMethod: PickupMethod;
  deliveryMethod: DeliveryMethod;
  
  // Address fields
  pickupAddress?: string | null;
  pickupCity?: string | null;
  pickupState?: string | null;
  pickupCountry?: string | null;
  pickupPostalCode?: string | null;
  pickupContactName?: string | null;
  pickupContactPhone?: string | null;
  pickupWarehouseId?: string | null;
  
  deliveryAddress?: string | null;
  deliveryCity?: string | null;
  deliveryState?: string | null;
  deliveryCountry?: string | null;
  deliveryPostalCode?: string | null;
  deliveryContactName?: string | null;
  deliveryContactPhone?: string | null;
  deliveryWarehouseId?: string | null;
  
  createdAt: string;
  updatedAt: string;
  shipmentSlot?: any;
  customer?: any;
  payment?: any;
}

// Marketing Types
export type CampaignChannel = 'EMAIL' | 'IN_APP' | 'WHATSAPP';
export type CampaignStatus = 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'SENT' | 'FAILED' | 'CANCELLED';
export type AudienceType = 'COMPANY_PAST_CUSTOMERS' | 'PLATFORM_CUSTOMERS_ONLY' | 'PLATFORM_COMPANIES_ONLY' | 'PLATFORM_ALL_USERS';

export interface MarketingCampaign {
  id: string;
  senderType: 'ADMIN' | 'COMPANY';
  senderCompanyId?: string | null;
  createdByUserId: string;
  audienceType: AudienceType;
  channel: CampaignChannel;
  subject?: string | null;
  title?: string | null;
  contentHtml?: string | null;
  contentText?: string | null;
  inAppBody?: string | null;
  whatsappTemplateKey?: string | null;
  status: CampaignStatus;
  scheduledAt?: string | null;
  startedAt?: string | null;
  sentAt?: string | null;
  failureReason?: string | null;
  totalRecipients: number;
  deliveredCount: number;
  failedCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MarketingConsent {
  id: string;
  userId: string;
  emailMarketingOptIn: boolean;
  whatsappMarketingOptIn: boolean;
  carrierMarketingOptIn: boolean;
  updatedAt: string;
  createdAt: string;
}

export interface CampaignPreviewResponse {
  totalCount: number;
  campaignId: string;
  audienceType: string;
  channel: string;
  sampleRecipients?: Array<{
    email: string;
    maskedEmail: string;
  }>;
}

export interface CreateCampaignRequest {
  audienceType: AudienceType;
  channel: CampaignChannel;
  subject?: string;
  title?: string;
  contentHtml?: string;
  contentText?: string;
  inAppBody?: string;
  whatsappTemplateKey?: string;
}

export interface ScheduleCampaignRequest {
  scheduledAt: string; // ISO 8601 datetime
}

export interface UpdateCampaignRequest {
  audienceType?: AudienceType;
  channel?: CampaignChannel;
  subject?: string | null;
  title?: string | null;
  contentHtml?: string | null;
  contentText?: string | null;
  inAppBody?: string | null;
  whatsappTemplateKey?: string | null;
  scheduledAt?: string | null; // ISO 8601 datetime or null to clear
}


import { api, ApiResponse, extractData } from './api';
import { Notification, NotificationListResponse, UnreadCountResponse, NotificationPagination, ParcelType, PickupMethod, DeliveryMethod } from './api-types';

// ============================================
// Type Definitions
// ============================================

export interface Plan {
  id: string;
  name: string;
  priceMonthly: number | string; // API returns as string, but can be converted to number
  maxActiveShipmentSlots: number | null;
  maxTeamMembers: number | null;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface OverviewStats {
  activeShipments: number;
  upcomingDepartures: number;
  totalBookings: number;
  revenue: number;
  pendingBookings: number;
  acceptedBookings: number;
  revenueChangePercentage: number;
  bookingsChangePercentage: number;
}

export interface RecentBooking {
  id: string;
  customer: {
    id: string;
    name: string;
    email: string;
  };
  route: {
    origin: string;
    destination: string;
  };
  status: string;
  price: number;
  createdAt: string;
}

export interface UpcomingShipment {
  id: string;
  route: {
    origin: string;
    destination: string;
  };
  departureTime: string;
  mode: string;
  bookingsCount: number;
}

export type SlotTrackingStatus = 
  | 'PENDING'
  | 'IN_TRANSIT'
  | 'ARRIVED_AT_DESTINATION'
  | 'DELAYED'
  | 'DELIVERED';

export interface Shipment {
  id: string;
  companyId?: string;
  originCountry: string;
  originCity: string;
  destinationCountry: string;
  destinationCity: string;
  departureTime: string;
  arrivalTime?: string;
  mode: 'AIR' | 'BUS' | 'VAN' | 'TRAIN' | 'SHIP' | 'RIDER' | 'TRUCK';
  totalCapacityKg: number;
  totalCapacityItems?: number | null;
  remainingCapacityKg: number;
  remainingCapacityItems?: number | null;
  pricingModel: 'PER_KG' | 'PER_ITEM' | 'FLAT';
  pricePerKg?: number | null;
  pricePerItem?: number | null;
  flatPrice?: number | null;
  cutoffTimeForReceivingItems?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
  trackingStatus?: SlotTrackingStatus;
  company?: {
    id: string;
    name: string;
    slug: string;
    isVerified: boolean;
  };
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    bookings?: number;
  };
}

export interface Booking {
  id: string;
  shipmentSlot?: {
    id: string;
    originCountry: string;
    originCity: string;
    destinationCountry: string;
    destinationCity: string;
    departureTime: string;
    arrivalTime?: string;
    company?: {
      id: string;
      name: string;
      slug: string;
      isVerified: boolean;
      logoUrl?: string;
    };
  };
  customer: {
    id: string;
    email?: string;
    fullName?: string;
    name?: string; // API may return 'name' instead of 'fullName'
  };
  requestedWeightKg?: number;
  requestedItemsCount?: number | null;
  calculatedPrice?: number | string; // API may return as string or number
  price?: number | string; // Alternative field name from API, may be string or number
  // Payment fee breakdown (in minor units - pence)
  baseAmount?: number | null;
  adminFeeAmount?: number | null;
  processingFeeAmount?: number | null;
  totalAmount?: number | null;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
  paymentStatus?: string;
  notes?: string | null;
  payment?: any | null;
  createdAt: string;
  updatedAt?: string;
  // New parcel information fields
  parcelType?: ParcelType | null;
  weight?: number | null;
  value?: string | number | null;  // API may return as string or number
  length?: number | null;
  width?: number | null;
  height?: number | null;
  description?: string | null;
  images?: string[];
  pickupMethod?: PickupMethod;
  deliveryMethod?: DeliveryMethod;
  pickupProofImages?: string[];
  deliveryProofImages?: string[];
  labelUrl?: string;
}

// Helper functions to handle API response variations
export function getCustomerName(customer: Booking['customer']): string {
  return customer.fullName || customer.name || 'N/A';
}

export function getCustomerEmail(customer: Booking['customer']): string | undefined {
  return customer.email;
}

export function getBookingPrice(booking: Booking): number {
  const price = booking.calculatedPrice || booking.price || 0;
  // Handle string values from API
  if (typeof price === 'string') {
    return parseFloat(price) || 0;
  }
  return price;
}

export interface BookingStats {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
  revenue: number;
}

export interface AnalyticsData {
  period?: {
    type: 'week' | 'month' | 'quarter' | 'year';
    label: string;
    startDate: string;
    endDate: string;
  };
  revenue: {
    total: number;
    changePercentage: number;
  };
  bookings: {
    total: number;
    accepted: number;
    pending: number;
    rejected: number;
    changePercentage: number;
  };
  shipments: {
    active: number;
    published: number;
    completed: number;
    changePercentage: number;
  };
  topRoutes: Array<{
    route: string;
    bookingsCount: number;
    revenue: number;
  }>;
  revenueByPeriod: Array<{
    period: string;
    revenue: number;
  }>;
}

export interface Subscription {
  id: string;
  companyId: string;
  companyPlanId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  createdAt: string;
  updatedAt: string;
  companyPlan: Plan;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'COMPANY_ADMIN' | 'COMPANY_STAFF';
  status: string;
  joinedAt: string;
}

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED';

export interface TeamInvitation {
  id: string;
  email: string;
  role: 'COMPANY_ADMIN' | 'COMPANY_STAFF';
  status: InvitationStatus;
  invitedAt: string;
  expiresAt: string;
  acceptedAt?: string | null;
  invitedBy?: {
    id: string;
    name: string;
    email: string;
  } | null;
  acceptedBy?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface CompanyProfile {
  id: string;
  name: string;
  slug: string;
  description?: string;
  country: string;
  city: string;
  website?: string;
  logoUrl?: string;
  contactEmail: string;
  contactPhone?: string;
  address?: string;
  state?: string;
  postalCode?: string;
  isVerified: boolean;
  activePlanId?: string;
  planExpiresAt?: string;
  adminId?: string;
  onboardingSteps?: {
    payment_setup?: {
      completed: boolean;
      completedAt?: string;
    };
    company_profile?: {
      completed: boolean;
      completedAt?: string;
    };
    first_shipment_slot?: {
      completed: boolean;
      completedAt?: string;
    };
  };
  onboardingCompleted?: boolean;
  stripeAccountId?: string;
  stripeOnboardingStatus?: string;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
  activePlan?: {
    id: string;
    name: string;
    priceMonthly: string | number;
    maxActiveShipmentSlots?: number | null;
    maxTeamMembers?: number | null;
    isDefault?: boolean;
    createdAt?: string;
    updatedAt?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface Payment {
  id: string;
  type?: 'BOOKING_PAYMENT' | 'EXTRA_CHARGE'; // Payment type
  bookingId: string;
  booking?: {
    id: string;
    customer: {
      id: string;
      fullName?: string;
      name?: string; // API may return 'name' instead of 'fullName'
      email?: string; // Email may not always be present
    };
    shipmentSlot?: {
      id: string;
      originCity: string;
      originCountry: string;
      destinationCity: string;
      destinationCountry: string;
    };
  };
  amount: number;
  baseAmount?: number | null; // Base amount before fees
  adminFeeAmount?: number | null; // Admin fee
  processingFeeAmount?: number | null; // Processing fee
  totalAmount?: number | null; // Total amount including fees
  currency: string;
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
  paymentMethod?: string;
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
  refundedAmount?: number;
  refundReason?: string;
  // Extra charge specific fields
  extraChargeReason?: string; // For EXTRA_CHARGE type
  extraChargeDescription?: string | null; // For EXTRA_CHARGE type
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt?: string;
  paidAt?: string | null;
  refundedAt?: string | null;
}

export interface PaymentStats {
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  refundedAmount: number;
  totalCount: number;
  paidCount: number;
  pendingCount: number;
  refundedCount: number;
  averageAmount: number;
  breakdown?: {
    bookingPayments: {
      count: number;
      totalAmount: number;
      paidAmount: number;
      pendingAmount: number;
      refundedAmount: number;
    };
    extraCharges: {
      count: number;
      totalAmount: number;
      paidAmount?: number;
      pendingAmount?: number;
      refundedAmount?: number;
    };
  };
  period?: {
    dateFrom?: string | null;
    dateTo?: string | null;
  };
}

export interface Review {
  id: string;
  bookingId: string;
  companyId: string;
  customerId: string;
  rating: number;
  comment?: string;
  companyReply?: string | null;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: string;
    fullName: string;
    email: string;
  };
  booking?: {
    id: string;
    shipmentSlot?: {
      originCity: string;
      originCountry: string;
      destinationCity: string;
      destinationCountry: string;
    };
  };
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    [key: number]: number;
  };
}

export interface CompanySettings {
  notifications: {
    email: boolean;
    sms: boolean;
    bookingUpdates: boolean;
    shipmentUpdates: boolean;
  };
  marketing?: {
    emailMarketingOptIn: boolean;
    whatsappMarketingOptIn: boolean;
    carrierMarketingOptIn: boolean;
  };
}

export interface StaffRestrictions {
  member: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  restrictions: Record<string, boolean>;
}

export interface WarehouseAddress {
  id: string;
  companyId: string;
  name: string;
  address: string;
  city: string;
  state?: string | null;
  country: string;
  postalCode?: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWarehouseAddressRequest {
  name: string;
  address: string;
  city: string;
  country: string;
  state?: string;
  postalCode?: string;
  isDefault?: boolean;
}

export interface UpdateWarehouseAddressRequest {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  isDefault?: boolean;
}


export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
}

// ============================================
// Company API Client
// ============================================

export const companyApi = {
  // ============================================
  // Overview / Dashboard
  // ============================================

  getOverviewStats: async (): Promise<OverviewStats> => {
    const response = await api.get<ApiResponse<OverviewStats>>('/companies/overview/stats');
    return extractData(response);
  },

  getRecentBookings: async (limit: number = 5): Promise<RecentBooking[]> => {
    const response = await api.get<ApiResponse<RecentBooking[]>>('/companies/overview/recent-bookings', {
      params: { limit },
    });
    return extractData(response);
  },

  getUpcomingShipments: async (limit: number = 5): Promise<UpcomingShipment[]> => {
    const response = await api.get<ApiResponse<UpcomingShipment[]>>('/companies/overview/upcoming-shipments', {
      params: { limit },
    });
    return extractData(response);
  },

  // ============================================
  // Shipments
  // ============================================

  getShipments: async (params?: {
    limit?: number;
    offset?: number;
    status?: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
    mode?: string;
    search?: string;
  }): Promise<PaginatedResponse<Shipment>> => {
    const response = await api.get<any>('/companies/shipments', {
      params: {
        limit: params?.limit ?? 20,
        offset: params?.offset ?? 0,
        ...(params?.status && { status: params.status }),
        ...(params?.mode && { mode: params.mode }),
        ...(params?.search && { search: params.search }),
      },
    });
    
    // Handle API response structure where data and pagination are at the top level
    if (response.data.status === 'success') {
      return {
        data: response.data.data || [],
        pagination: response.data.pagination || {
          limit: params?.limit ?? 20,
          offset: params?.offset ?? 0,
          total: 0,
          hasMore: false,
        },
      };
    }
    
    // Fallback to extractData for nested structure
    const data = extractData(response as { data: ApiResponse<PaginatedResponse<Shipment>> });
    return data;
  },

  getShipmentById: async (shipmentId: string): Promise<Shipment> => {
    const response = await api.get<ApiResponse<Shipment>>(`/companies/shipments/${shipmentId}`);
    return extractData(response);
  },

  createShipment: async (data: {
    originCountry: string;
    originCity: string;
    destinationCountry: string;
    destinationCity: string;
    departureTime: string;
    arrivalTime?: string;
    mode: string;
    totalCapacityKg: number;
    totalCapacityItems?: number | null;
    pricingModel: 'PER_KG' | 'PER_ITEM' | 'FLAT';
    pricePerKg?: number | null;
    pricePerItem?: number | null;
    flatPrice?: number | null;
    cutoffTimeForReceivingItems?: string;
    status?: 'DRAFT' | 'PUBLISHED';
  }): Promise<Shipment> => {
    const response = await api.post<ApiResponse<Shipment>>('/companies/shipments', data);
    return extractData(response);
  },

  updateShipment: async (shipmentId: string, data: Partial<{
    originCountry: string;
    originCity: string;
    destinationCountry: string;
    destinationCity: string;
    departureTime: string;
    arrivalTime: string;
    mode: string;
    totalCapacityKg: number;
    pricingModel: string;
    pricePerKg: number;
    pricePerItem: number;
    flatPrice: number;
  }>): Promise<Shipment> => {
    const response = await api.patch<ApiResponse<Shipment>>(`/shipments/${shipmentId}`, data);
    return extractData(response);
  },

  updateShipmentStatus: async (shipmentId: string, status: 'DRAFT' | 'PUBLISHED' | 'CLOSED'): Promise<Shipment> => {
    const response = await api.patch<ApiResponse<Shipment>>(`/companies/shipments/${shipmentId}/status`, { status });
    return extractData(response);
  },

  updateSlotTrackingStatus: async (shipmentId: string, trackingStatus: SlotTrackingStatus): Promise<Shipment> => {
    const response = await api.patch<ApiResponse<Shipment>>(`/companies/shipments/${shipmentId}/tracking-status`, { trackingStatus });
    return extractData(response);
  },

  deleteShipment: async (shipmentId: string): Promise<void> => {
    await api.delete<ApiResponse<{ message: string }>>(`/companies/shipments/${shipmentId}`);
  },

  getShipmentBookings: async (shipmentId: string): Promise<Booking[]> => {
    const response = await api.get<ApiResponse<Booking[]>>(`/companies/shipments/${shipmentId}/bookings`);
    return extractData(response);
  },

  // ============================================
  // Bookings
  // ============================================

  getBookings: async (params?: {
    limit?: number;
    offset?: number;
    status?: string;
    search?: string;
  }): Promise<PaginatedResponse<Booking>> => {
    const response = await api.get<any>('/companies/bookings', {
      params: {
        limit: params?.limit ?? 20,
        offset: params?.offset ?? 0,
        ...(params?.status && { status: params.status }),
        ...(params?.search && { search: params.search }),
      },
    });
    
    // Handle API response structure where data and pagination are at the top level
    if (response.data.status === 'success') {
      return {
        data: response.data.data || [],
        pagination: response.data.pagination || {
          limit: params?.limit ?? 20,
          offset: params?.offset ?? 0,
          total: 0,
          hasMore: false,
        },
      };
    }
    
    // Fallback to extractData for nested structure
    const data = extractData(response as { data: ApiResponse<PaginatedResponse<Booking>> });
    return data;
  },

  getBookingById: async (bookingId: string): Promise<Booking> => {
    const response = await api.get<ApiResponse<Booking>>(`/companies/bookings/${bookingId}`);
    return extractData(response);
  },

  acceptBooking: async (bookingId: string): Promise<Booking> => {
    const response = await api.post<ApiResponse<Booking>>(`/companies/bookings/${bookingId}/accept`);
    return extractData(response);
  },

  rejectBooking: async (bookingId: string, reason: string): Promise<Booking> => {
    const response = await api.post<ApiResponse<Booking>>(`/companies/bookings/${bookingId}/reject`, { reason });
    return extractData(response);
  },

  updateBookingStatus: async (bookingId: string, status: 'ACCEPTED' | 'IN_TRANSIT' | 'DELIVERED'): Promise<Booking> => {
    const response = await api.patch<ApiResponse<Booking>>(`/companies/bookings/${bookingId}/status`, { status });
    return extractData(response);
  },

  addProofImagesToBooking: async (
    bookingId: string,
    data: {
      pickupProofImages?: string[];
      deliveryProofImages?: string[];
    }
  ): Promise<Booking> => {
    const response = await api.patch<ApiResponse<Booking>>(`/companies/bookings/${bookingId}/proof-images`, data);
    return extractData(response);
  },

  getBookingStats: async (): Promise<BookingStats> => {
    const response = await api.get<ApiResponse<BookingStats>>('/companies/bookings/stats');
    return extractData(response);
  },

  getBookingLabel: async (bookingId: string): Promise<{ labelUrl: string }> => {
    const response = await api.get<ApiResponse<{ labelUrl: string }>>(`/companies/bookings/${bookingId}/label`);
    return extractData(response);
  },

  regenerateBookingLabel: async (bookingId: string): Promise<Booking> => {
    const response = await api.post<ApiResponse<Booking>>(`/companies/bookings/${bookingId}/label/regenerate`);
    return extractData(response);
  },

  // ============================================
  // Analytics
  // ============================================

  getAnalytics: async (period: 'week' | 'month' | 'quarter' | 'year', offset?: number): Promise<AnalyticsData> => {
    const response = await api.get<ApiResponse<AnalyticsData>>('/companies/analytics', {
      params: { 
        period,
        ...(offset !== undefined && offset > 0 && { offset }),
      },
    });
    return extractData(response);
  },

  // ============================================
  // Subscription
  // ============================================

  getSubscription: async (): Promise<Subscription> => {
    const response = await api.get<ApiResponse<Subscription>>('/companies/subscription');
    return extractData(response);
  },

  getPlans: async (): Promise<Plan[]> => {
    const response = await api.get<ApiResponse<Plan[]>>('/plans');
    return extractData(response);
  },

  createCheckoutSession: async (data: {
    planId: string;
    returnUrl?: string;
    fromOnboarding?: boolean;
  }): Promise<{ sessionId: string; url: string }> => {
    const response = await api.post<ApiResponse<{ sessionId: string; url: string }>>('/subscriptions/checkout-session', data);
    return extractData(response);
  },

  updatePaymentMethod: async (): Promise<{ url: string }> => {
    const response = await api.put<ApiResponse<{ url: string }>>('/companies/subscription/payment-method');
    return extractData(response);
  },

  cancelSubscription: async (reason?: string): Promise<Subscription> => {
    const response = await api.post<ApiResponse<Subscription>>('/companies/subscription/cancel', reason ? { reason } : {});
    return extractData(response);
  },

  // ============================================
  // Team Management
  // ============================================

  getTeamMembers: async (): Promise<TeamMember[]> => {
    const response = await api.get<ApiResponse<TeamMember[]>>('/companies/team');
    return extractData(response);
  },

  inviteTeamMember: async (data: {
    email: string;
    role: 'COMPANY_STAFF' | 'COMPANY_ADMIN';
  }): Promise<{ message: string }> => {
    const response = await api.post<ApiResponse<{ message: string }>>('/companies/team/invite', data);
    return extractData(response);
  },

  updateTeamMemberRole: async (memberId: string, role: 'COMPANY_STAFF' | 'COMPANY_ADMIN'): Promise<TeamMember> => {
    const response = await api.put<ApiResponse<TeamMember>>(`/companies/team/${memberId}/role`, { role });
    return extractData(response);
  },

  removeTeamMember: async (memberId: string): Promise<void> => {
    await api.delete<ApiResponse<{ message: string }>>(`/companies/team/${memberId}`);
  },

  // ============================================
  // Team Invitations
  // ============================================

  getInvitations: async (status?: InvitationStatus): Promise<TeamInvitation[]> => {
    const response = await api.get<ApiResponse<TeamInvitation[]>>('/companies/team/invitations', {
      params: status ? { status } : {},
    });
    return extractData(response);
  },

  getPendingInvitations: async (): Promise<TeamInvitation[]> => {
    const response = await api.get<ApiResponse<TeamInvitation[]>>('/companies/team/invitations/pending');
    return extractData(response);
  },

  revokeInvitation: async (invitationId: string): Promise<{ message: string }> => {
    const response = await api.delete<ApiResponse<{ message: string }>>(`/companies/team/invitations/${invitationId}`);
    return extractData(response);
  },

  // ============================================
  // Company Profile & Settings
  // ============================================

  getCompanyProfile: async (): Promise<CompanyProfile> => {
    const response = await api.get<ApiResponse<CompanyProfile>>('/companies/profile');
    return extractData(response);
  },

  updateCompanyProfile: async (data: Partial<{
    name: string;
    description: string;
    website: string;
    logoUrl: string;
    contactEmail: string;
    contactPhone: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
  }>): Promise<CompanyProfile> => {
    const response = await api.put<ApiResponse<CompanyProfile>>('/companies/profile', data);
    return extractData(response);
  },

  uploadCompanyLogo: async (logoUrl: string): Promise<{ logoUrl: string }> => {
    const response = await api.post<ApiResponse<{ logoUrl: string }>>('/companies/profile/logo', { logoUrl });
    return extractData(response);
  },

  getCompanySettings: async (): Promise<CompanySettings> => {
    const response = await api.get<ApiResponse<CompanySettings>>('/companies/settings');
    return extractData(response);
  },

  updateCompanySettings: async (settings: CompanySettings): Promise<CompanySettings> => {
    const response = await api.put<ApiResponse<CompanySettings>>('/companies/settings', settings);
    return extractData(response);
  },

  // ============================================
  // Onboarding (backward compatibility)
  // ============================================

  completeOnboarding: async (data: {
    companyDescription?: string;
    companyWebsite?: string;
    companyLogoUrl?: string;
    contactPhone: string;
    contactEmail: string;
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  }): Promise<{ message: string }> => {
    const response = await api.put<ApiResponse<{ message: string }>>('/companies/profile/onboarding', data);
    if (response.data.status === 'error') {
      throw new Error(response.data.message || 'Failed to complete onboarding');
    }
    return { message: response.data.message || 'Onboarding completed successfully' };
  },

  // ============================================
  // Payments
  // ============================================

  getPayments: async (params?: {
    limit?: number;
    offset?: number;
    status?: 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
    dateFrom?: string;
    dateTo?: string;
    bookingId?: string;
    search?: string;
  }): Promise<PaginatedResponse<Payment>> => {
    const response = await api.get<ApiResponse<PaginatedResponse<Payment>>>('/companies/payments', {
      params: {
        limit: params?.limit ?? 20,
        offset: params?.offset ?? 0,
        ...(params?.status && { status: params.status }),
        ...(params?.dateFrom && { dateFrom: params.dateFrom }),
        ...(params?.dateTo && { dateTo: params.dateTo }),
        ...(params?.bookingId && { bookingId: params.bookingId }),
        ...(params?.search && { search: params.search }),
      },
    });
    const data = extractData(response);
    return data;
  },

  getPaymentById: async (paymentId: string): Promise<Payment> => {
    const response = await api.get<ApiResponse<Payment>>(`/companies/payments/${paymentId}`);
    return extractData(response);
  },

  getPaymentStats: async (params?: {
    dateFrom?: string;
    dateTo?: string;
  }): Promise<PaymentStats> => {
    const response = await api.get<ApiResponse<PaymentStats>>('/companies/payments/stats', {
      params: {
        ...(params?.dateFrom && { dateFrom: params.dateFrom }),
        ...(params?.dateTo && { dateTo: params.dateTo }),
      },
    });
    return extractData(response);
  },

  refundPayment: async (paymentId: string, data: {
    amount?: number;
    reason?: string;
  }): Promise<Payment> => {
    const response = await api.post<ApiResponse<Payment>>(`/companies/payments/${paymentId}/refund`, data);
    return extractData(response);
  },

  // ============================================
  // Notifications
  // ============================================

  getNotifications: async (params?: {
    page?: number;
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
    type?: string;
  }): Promise<{ data: Notification[]; pagination: NotificationPagination }> => {
    const limit = params?.limit ?? 20;
    const offset = params?.offset ?? (params?.page ? (params.page - 1) * limit : 0);
    
    const response = await api.get<any>('/companies/notifications', {
      params: {
        limit,
        offset,
        ...(params?.unreadOnly !== undefined && { unreadOnly: params.unreadOnly.toString() }),
        ...(params?.type && { type: params.type }),
      },
    });
    
    // Handle API response structure: { status: "success", data: [...], pagination: {...} }
    const responseData = response.data;
    const paginationData = responseData.pagination || {};
    const notifications = responseData.status === 'success' ? (responseData.data || []) : (responseData.data || responseData || []);
    
    // Calculate page and totalPages for backward compatibility
    const currentPage = Math.floor(offset / limit) + 1;
    const totalPages = Math.ceil((paginationData.total || 0) / limit);
    
    return {
      data: Array.isArray(notifications) ? notifications : [],
      pagination: {
        limit: paginationData.limit || limit,
        offset: paginationData.offset || offset,
        total: paginationData.total || 0,
        hasMore: paginationData.hasMore ?? false,
        page: currentPage,
        totalPages,
      },
    };
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await api.get<UnreadCountResponse>('/companies/notifications/unread-count');
    return response.data.count;
  },

  markNotificationAsRead: async (notificationId: string): Promise<void> => {
    const response = await api.put<ApiResponse<{ message: string }>>(`/companies/notifications/${notificationId}/read`);
    if (response.data.status === 'error') {
      throw new Error(response.data.message || 'Failed to mark notification as read');
    }
  },

  markAllNotificationsAsRead: async (): Promise<void> => {
    const response = await api.put<ApiResponse<{ message: string }>>('/companies/notifications/read-all');
    if (response.data.status === 'error') {
      throw new Error(response.data.message || 'Failed to mark all notifications as read');
    }
  },

  deleteNotification: async (notificationId: string): Promise<void> => {
    const response = await api.delete<ApiResponse<{ message: string }>>(`/companies/notifications/${notificationId}`);
    if (response.data.status === 'error') {
      throw new Error(response.data.message || 'Failed to delete notification');
    }
  },

  deleteAllReadNotifications: async (): Promise<{ count: number }> => {
    const response = await api.delete<ApiResponse<{ message: string; count: number }>>('/companies/notifications/read/all');
    if (response.data.status === 'error') {
      throw new Error(response.data.message || 'Failed to delete read notifications');
    }
    return { count: response.data.data?.count || 0 };
  },

  // ============================================
  // Warehouse Addresses
  // ============================================

  createWarehouseAddress: async (data: CreateWarehouseAddressRequest): Promise<WarehouseAddress> => {
    const response = await api.post<ApiResponse<WarehouseAddress>>('/companies/warehouses', data);
    return extractData(response);
  },

  getWarehouseAddresses: async (): Promise<WarehouseAddress[]> => {
    const response = await api.get<ApiResponse<WarehouseAddress[]>>('/companies/warehouses');
    return extractData(response);
  },

  updateWarehouseAddress: async (id: string, data: UpdateWarehouseAddressRequest): Promise<WarehouseAddress> => {
    const response = await api.patch<ApiResponse<WarehouseAddress>>(`/companies/warehouses/${id}`, data);
    return extractData(response);
  },

  deleteWarehouseAddress: async (id: string): Promise<void> => {
    await api.delete<ApiResponse<{ message: string }>>(`/companies/warehouses/${id}`);
  },

  // ============================================
  // Reviews
  // ============================================

  getCompanyReviews: async (params?: {
    limit?: number;
    offset?: number;
    rating?: number;
  }): Promise<{ data: Review[]; pagination: any }> => {
    const response = await api.get<{ data: Review[]; pagination: any }>('/companies/me/reviews', {
      params,
    });
    // The endpoint returns { data: Review[], pagination: {...} } directly (not wrapped in ApiResponse)
    // axios response.data contains the actual response body
    return response.data;
  },

  getCompanyReviewStats: async (): Promise<ReviewStats> => {
    const response = await api.get<{ averageRating: number | null; reviewCount: number }>('/companies/me/reviews/stats');
    // Backend returns { averageRating, reviewCount } directly (not wrapped in ApiResponse)
    // axios response.data contains the actual response body
    const data = response.data;
    return {
      averageRating: (data.averageRating !== null && data.averageRating !== undefined) ? data.averageRating : 0,
      totalReviews: data.reviewCount || 0,
      ratingDistribution: {}, // Backend doesn't return this, will be calculated from reviews
    };
  },

  replyToReview: async (bookingId: string, reply: string): Promise<any> => {
    const response = await api.post<ApiResponse<any>>(`/companies/bookings/${bookingId}/reviews/reply`, { reply });
    return extractData(response);
  },

  updateReviewReply: async (bookingId: string, reply: string): Promise<any> => {
    const response = await api.put<ApiResponse<any>>(`/companies/bookings/${bookingId}/reviews/reply`, { reply });
    return extractData(response);
  },

  // ============================================
  // Barcode Scanning
  // ============================================

  scanBarcode: async (barcode: string): Promise<Booking> => {
    const response = await api.post<ApiResponse<Booking>>('/bookings/scan', { barcode });
    return extractData(response);
  },

  // ============================================
  // Staff Restrictions
  // ============================================

  // Get current user's restrictions (for frontend layout)
  getMyRestrictions: async (): Promise<{ restrictions: Record<string, boolean>; isAdmin: boolean }> => {
    const response = await api.get<ApiResponse<{ restrictions: Record<string, boolean>; isAdmin: boolean }>>('/companies/me/restrictions');
    return extractData(response);
  },

  // Get restrictions for a specific staff member (admin only)
  getStaffRestrictions: async (memberId: string): Promise<StaffRestrictions> => {
    const response = await api.get<ApiResponse<StaffRestrictions>>(`/companies/team/${memberId}/restrictions`);
    return extractData(response);
  },

  // Update restrictions for a specific staff member (admin only)
  updateStaffRestrictions: async (memberId: string, restrictions: Record<string, boolean>): Promise<StaffRestrictions> => {
    const response = await api.put<ApiResponse<StaffRestrictions>>(`/companies/team/${memberId}/restrictions`, { restrictions });
    return extractData(response);
  },

  // ============================================
  // Stripe Connect / Payouts
  // ============================================

  createOnboardingLink: async (returnUrl: string): Promise<{ url: string }> => {
    const response = await api.post<ApiResponse<{ url: string }>>('/connect/onboarding-link', { returnUrl });
    return extractData(response);
  },

  getConnectStatus: async (): Promise<{
    stripeAccountId: string | null;
    stripeOnboardingStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETE';
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
  }> => {
    const response = await api.get<ApiResponse<{
      stripeAccountId: string | null;
      stripeOnboardingStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETE';
      chargesEnabled: boolean;
      payoutsEnabled: boolean;
    }>>('/connect/status');
    return extractData(response);
  },

  getConnectBalance: async (): Promise<{
    available: number; // in pence
    pending: number;   // in pence
    currency: string;
  }> => {
    const response = await api.get<ApiResponse<{
      available: number;
      pending: number;
      currency: string;
    }>>('/connect/balance');
    return extractData(response);
  },

  requestPayout: async (amount: number): Promise<{
    id: string;
    amount: number; // in pence
    currency: string;
    status: string;
    stripePayoutId: string;
    createdAt: string;
  }> => {
    const response = await api.post<ApiResponse<{
      id: string;
      amount: number;
      currency: string;
      status: string;
      stripePayoutId: string;
      createdAt: string;
    }>>('/connect/request-payout', { amount });
    return extractData(response);
  },

  // ============================================
  // Extra Charges
  // ============================================

  getExtraCharges: async (bookingId: string): Promise<any[]> => {
    const response = await api.get<ApiResponse<any[]>>(`/bookings/${bookingId}/extra-charges`);
    return extractData(response);
  },

  createExtraCharge: async (bookingId: string, data: {
    reason: 'EXCESS_WEIGHT' | 'EXTRA_ITEMS' | 'OVERSIZE' | 'REPACKING' | 'LATE_DROP_OFF' | 'OTHER';
    description?: string | null;
    evidenceUrls?: string[];
    baseAmountMinor: number;
    expiresInHours?: number;
  }): Promise<any> => {
    const response = await api.post<ApiResponse<any>>(
      `/bookings/${bookingId}/extra-charges`,
      data
    );
    return extractData(response);
  },

  cancelExtraCharge: async (bookingId: string, extraChargeId: string): Promise<any> => {
    const response = await api.post<ApiResponse<any>>(
      `/bookings/${bookingId}/extra-charges/${extraChargeId}/cancel`
    );
    return extractData(response);
  },
};

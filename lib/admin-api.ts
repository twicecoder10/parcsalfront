import { api, ApiResponse, extractData } from './api';
import { ParcelType, PickupMethod, DeliveryMethod } from './api-types';

// Helper to extract data and pagination from list responses
// API returns: { status: "success", data: [...], pagination: {...} }
const extractListData = <T>(
  response: { data: ApiResponse<T[]> & { pagination?: PaginationResponse } }
): { data: T[]; pagination: PaginationResponse } => {
  if (response.data.status === 'error') {
    throw new Error(response.data.message || 'An error occurred');
  }
  return {
    data: response.data.data || [],
    pagination: (response.data as any).pagination || { limit: 0, offset: 0, total: 0, hasMore: false },
  };
};

// ============================================================================
// Types
// ============================================================================

export interface PaginationParams {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationResponse {
  limit: number;
  offset: number;
  total: number;
  hasMore: boolean;
}

// Dashboard Types
export interface DashboardSummary {
  users: {
    total: number;
    breakdown: Array<{ role: string; count: number }>;
  };
  companies: {
    total: number;
    verified: number;
    unverified: number;
  };
  shipments: {
    published: number;
  };
  bookings: {
    total: number;
  };
  subscriptions: {
    active: number;
  };
  revenue: {
    total: number;
    currency: string;
  };
}

export interface DashboardStats {
  totalUsers: number;
  totalCompanies: number;
  activeShipments: number;
  bookings: {
    total: number;
    today: number;
    week: number;
    month: number;
  };
  revenue: {
    today: number;
    week: number;
    month: number;
    currency: string;
  };
  pendingVerifications: number;
  pendingBookings: number;
  growth: {
    bookings: number;
    revenue: number;
  };
}

export interface AnalyticsDataPoint {
  period: string;
  value: number;
}

// Company Types
export interface Company {
  id: string;
  name: string;
  slug: string;
  country: string;
  city: string;
  isVerified: boolean;
  activePlan?: {
    id: string;
    name: string;
    priceMonthly: string;
  };
  admin?: {
    id: string;
    email: string;
    fullName: string;
  };
  _count?: {
    staff: number;
    shipmentSlots: number;
    bookings: number;
  };
  createdAt: string;
}

export interface CompanyDetail extends Company {
  description?: string;
  stats?: {
    totalShipments: number;
    activeShipments: number;
    totalBookings: number;
    revenue: number;
    teamSize: number;
  };
}

export interface CompanyListParams extends PaginationParams {
  search?: string;
  verified?: 'true' | 'false' | 'all';
  plan?: string;
}

// Note: API returns { status: "success", data: [...], pagination: {...} }
// So we need to handle the response structure differently
export interface CompanyListResponse {
  data: Company[];
  pagination: PaginationResponse;
}

// User Types
export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  company: {
    id: string;
    name: string;
    slug: string;
  } | null;
  _count?: {
    bookings: number;
  };
  createdAt: string;
}

export interface AdminUserDetail extends AdminUser {
  phoneNumber?: string;
  city?: string;
  country?: string;
  stats?: {
    totalBookings: number;
    activeBookings: number;
    totalSpent: number;
  };
  recentBookings?: Array<{
    id: string;
    shipmentSlot: {
      id: string;
      originCity: string;
      destinationCity: string;
    };
  }>;
}

export interface UserListParams extends PaginationParams {
  search?: string;
  role?: 'CUSTOMER' | 'COMPANY_ADMIN' | 'COMPANY_STAFF' | 'SUPER_ADMIN' | 'all';
  companyId?: string;
  isActive?: 'true' | 'false' | 'all';
}

// Note: API returns { status: "success", data: [...], pagination: {...} }
export interface UserListResponse {
  data: AdminUser[];
  pagination: PaginationResponse;
}

export interface UserStats {
  totalUsers: number;
  byRole: Array<{ role: string; count: number }>;
  newUsersThisWeek: number;
  growth: number;
}

// Shipment Types
export interface AdminShipment {
  id: string;
  originCountry: string;
  originCity: string;
  destinationCountry: string;
  destinationCity: string;
  departureTime: string;
  arrivalTime: string;
  mode: string;
  status: string;
  pricingModel?: string;
  pricePerKg?: string;
  company: {
    id: string;
    name: string;
    slug: string;
    isVerified: boolean;
    logoUrl?: string;
  };
  _count?: {
    bookings: number;
  };
  createdAt: string;
}

export interface AdminShipmentDetail extends AdminShipment {
  totalCapacityKg?: number;
  remainingCapacityKg?: number;
  bookings?: Array<{
    id: string;
    calculatedPrice: string;
    status: string;
    customer: {
      id: string;
      email: string;
      fullName: string;
    };
    payment?: {
      id: string;
      amount: string;
      status: string;
    };
  }>;
}

export interface ShipmentListParams extends PaginationParams {
  search?: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'all';
  mode?: 'AIR' | 'BUS' | 'VAN' | 'TRAIN' | 'SHIP' | 'RIDER' | 'all';
  companyId?: string;
  dateFrom?: string;
  dateTo?: string;
}

// Note: API returns { status: "success", data: [...], pagination: {...} }
export interface ShipmentListResponse {
  data: AdminShipment[];
  pagination: PaginationResponse;
}

export interface ShipmentStats {
  total: number;
  published: number;
  draft: number;
  closed: number;
}

// Booking Types
// Status: PENDING | ACCEPTED | REJECTED | CANCELLED | IN_TRANSIT | DELIVERED
export interface AdminBooking {
  id: string;
  calculatedPrice?: string | number;
  price?: string | number; // API may return 'price' instead of 'calculatedPrice'
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'IN_TRANSIT' | 'DELIVERED';
  paymentStatus: string;
  customer: {
    id: string;
    email?: string;
    fullName?: string;
    name?: string; // API may return 'name' instead of 'fullName'
    phoneNumber?: string;
  };
  shipmentSlot: {
    id: string;
    originCountry: string;
    originCity: string;
    destinationCountry: string;
    destinationCity: string;
    company?: {
      id: string;
      name: string;
      slug: string;
    };
  };
  payment: {
    id: string;
    amount: string;
    status: string;
  } | null;
  createdAt: string;
}

export interface AdminBookingDetail extends AdminBooking {
  requestedWeightKg?: number;
  requestedItemsCount?: number | null;
  notes?: string;
  shipmentSlot: {
    id: string;
    originCountry: string;
    originCity: string;
    destinationCountry: string;
    destinationCity: string;
    departureTime: string;
    arrivalTime: string;
    mode: string;
    company: {
      id: string;
      name: string;
      slug: string;
      isVerified: boolean;
      logoUrl?: string;
    };
  };
  payment: {
    id: string;
    amount: string;
    currency: string;
    status: string;
    stripePaymentIntentId?: string;
  } | null;
  updatedAt: string;
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
}

// Helper functions to handle API response variations for AdminBooking
export function getAdminCustomerName(customer: AdminBooking['customer']): string {
  return customer.fullName || customer.name || 'N/A';
}

export function getAdminCustomerEmail(customer: AdminBooking['customer']): string | undefined {
  return customer.email;
}

export function getAdminBookingPrice(booking: AdminBooking): string {
  // Handle both calculatedPrice and price fields, which may be string or number
  const calculatedPrice = booking.calculatedPrice;
  const price = booking.price;
  const value = calculatedPrice || price || '0';
  
  // Ensure it's always a string (API may return number)
  if (typeof value === 'number') {
    return value.toString();
  }
  return String(value);
}

export interface BookingListParams extends PaginationParams {
  search?: string;
  status?: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'IN_TRANSIT' | 'DELIVERED' | 'all';
  customerId?: string;
  companyId?: string;
  shipmentId?: string;
  dateFrom?: string;
  dateTo?: string;
}

// Booking status type for use in components
export type BookingStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'IN_TRANSIT' | 'DELIVERED';

// Note: API returns { status: "success", data: [...], pagination: {...} }
export interface BookingListResponse {
  data: AdminBooking[];
  pagination: PaginationResponse;
}

export interface BookingStats {
  total: number;
  byStatus: Array<{ status: string; count: number }>;
  revenue: {
    total: number;
    fromConfirmedCompleted: number;
    currency: string;
  };
}

// Settings Types
export interface PlatformSettings {
  platformName: string;
  supportEmail: string;
  commissionRate: number;
  minCommission: number;
  maxCommission: number;
  autoVerifyCompanies: boolean;
  requireEmailVerification: boolean;
  allowCompanyRegistration: boolean;
  allowCustomerRegistration: boolean;
  maintenanceMode: boolean;
}

export interface UpdateSettingsRequest {
  platformName?: string;
  supportEmail?: string;
  commissionRate?: number;
  minCommission?: number;
  maxCommission?: number;
  autoVerifyCompanies?: boolean;
  requireEmailVerification?: boolean;
  allowCompanyRegistration?: boolean;
  allowCustomerRegistration?: boolean;
  maintenanceMode?: boolean;
}

// Report Types
export interface ReportParams {
  dateFrom?: string;
  dateTo?: string;
  format?: 'json' | 'csv';
}

export interface RevenueReportParams extends ReportParams {
  groupBy?: 'day' | 'week' | 'month';
}

// Warehouse Address Types
export interface AdminWarehouseAddress {
  id: string;
  companyId: string;
  name: string;
  address: string;
  city: string;
  state?: string;
  country: string;
  postalCode?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  company?: {
    id: string;
    name: string;
    slug: string;
  };
}

// ============================================================================
// Admin API
// ============================================================================

export const adminApi = {
  // ==========================================================================
  // Dashboard
  // ==========================================================================

  getDashboardSummary: async (): Promise<DashboardSummary> => {
    const response = await api.get<ApiResponse<DashboardSummary>>('/admin/dashboard/summary');
    return extractData(response);
  },

  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await api.get<ApiResponse<DashboardStats>>('/admin/dashboard/stats');
    return extractData(response);
  },

  getDashboardAnalytics: async (params?: {
    period?: 'week' | 'month' | 'year';
    metric?: 'users' | 'bookings' | 'revenue';
  }): Promise<AnalyticsDataPoint[]> => {
    const response = await api.get<ApiResponse<AnalyticsDataPoint[]>>('/admin/dashboard/analytics', {
      params,
    });
    return extractData(response);
  },

  // ==========================================================================
  // Companies
  // ==========================================================================

  getCompanies: async (params?: CompanyListParams): Promise<CompanyListResponse> => {
    const response = await api.get<ApiResponse<Company[]> & { pagination: PaginationResponse }>('/admin/companies', {
      params,
    });
    return extractListData<Company>(response);
  },

  getCompany: async (id: string): Promise<CompanyDetail> => {
    const response = await api.get<ApiResponse<CompanyDetail>>(`/admin/companies/${id}`);
    return extractData(response);
  },

  verifyCompany: async (id: string): Promise<Company> => {
    const response = await api.post<ApiResponse<Company>>(`/admin/companies/${id}/verify`);
    return extractData(response);
  },

  unverifyCompany: async (id: string): Promise<Company> => {
    const response = await api.post<ApiResponse<Company>>(`/admin/companies/${id}/unverify`);
    return extractData(response);
  },

  deactivateCompany: async (id: string, reason?: string): Promise<Company> => {
    const response = await api.post<ApiResponse<Company>>(`/admin/companies/${id}/deactivate`, {
      reason,
    });
    return extractData(response);
  },

  activateCompany: async (id: string): Promise<Company> => {
    const response = await api.post<ApiResponse<Company>>(`/admin/companies/${id}/activate`);
    return extractData(response);
  },

  getCompanyShipments: async (
    id: string,
    params?: PaginationParams & { status?: string }
  ): Promise<{ data: AdminShipment[]; pagination: PaginationResponse }> => {
    const response = await api.get<ApiResponse<AdminShipment[]> & { pagination: PaginationResponse }>(
      `/admin/companies/${id}/shipments`,
      { params }
    );
    return extractListData<AdminShipment>(response);
  },

  getCompanyBookings: async (
    id: string,
    params?: PaginationParams & { status?: string }
  ): Promise<{ data: AdminBooking[]; pagination: PaginationResponse }> => {
    const response = await api.get<ApiResponse<AdminBooking[]> & { pagination: PaginationResponse }>(
      `/admin/companies/${id}/bookings`,
      { params }
    );
    return extractListData<AdminBooking>(response);
  },

  getCompanyStats: async (id: string): Promise<{
    totalShipments: number;
    activeShipments: number;
    totalBookings: number;
    revenue: number;
    teamSize: number;
  }> => {
    const response = await api.get<ApiResponse<{
      totalShipments: number;
      activeShipments: number;
      totalBookings: number;
      revenue: number;
      teamSize: number;
    }>>(`/admin/companies/${id}/stats`);
    return extractData(response);
  },

  // ==========================================================================
  // Users
  // ==========================================================================

  getUsers: async (params?: UserListParams): Promise<UserListResponse> => {
    const response = await api.get<ApiResponse<AdminUser[]> & { pagination: PaginationResponse }>('/admin/users', {
      params,
    });
    return extractListData<AdminUser>(response);
  },

  getUser: async (id: string): Promise<AdminUserDetail> => {
    const response = await api.get<ApiResponse<AdminUserDetail>>(`/admin/users/${id}`);
    return extractData(response);
  },

  activateUser: async (id: string): Promise<AdminUser> => {
    const response = await api.post<ApiResponse<AdminUser>>(`/admin/users/${id}/activate`);
    return extractData(response);
  },

  deactivateUser: async (id: string, reason?: string): Promise<AdminUser> => {
    const response = await api.post<ApiResponse<AdminUser>>(`/admin/users/${id}/deactivate`, {
      reason,
    });
    return extractData(response);
  },

  changeUserRole: async (id: string, role: string): Promise<AdminUser> => {
    const response = await api.post<ApiResponse<AdminUser>>(`/admin/users/${id}/change-role`, {
      role,
    });
    return extractData(response);
  },

  deleteUser: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete<ApiResponse<{ message: string }>>(`/admin/users/${id}`);
    if (response.data.status === 'error') {
      throw new Error(response.data.message || 'Failed to delete user');
    }
    return { message: response.data.message || 'User deleted successfully' };
  },

  getUserBookings: async (
    id: string,
    params?: PaginationParams & { status?: string }
  ): Promise<{ data: AdminBooking[]; pagination: PaginationResponse }> => {
    const response = await api.get<ApiResponse<AdminBooking[]> & { pagination: PaginationResponse }>(
      `/admin/users/${id}/bookings`,
      { params }
    );
    return extractListData<AdminBooking>(response);
  },

  getUserStats: async (): Promise<UserStats> => {
    const response = await api.get<ApiResponse<UserStats>>('/admin/users/stats');
    return extractData(response);
  },

  // ==========================================================================
  // Shipments
  // ==========================================================================

  getShipments: async (params?: ShipmentListParams): Promise<ShipmentListResponse> => {
    const response = await api.get<ApiResponse<AdminShipment[]> & { pagination: PaginationResponse }>('/admin/shipments', {
      params,
    });
    return extractListData<AdminShipment>(response);
  },

  getShipment: async (id: string): Promise<AdminShipmentDetail> => {
    const response = await api.get<ApiResponse<AdminShipmentDetail>>(`/admin/shipments/${id}`);
    return extractData(response);
  },

  getShipmentStats: async (): Promise<ShipmentStats> => {
    const response = await api.get<ApiResponse<ShipmentStats>>('/admin/shipments/stats');
    return extractData(response);
  },

  closeShipment: async (id: string): Promise<AdminShipment> => {
    const response = await api.post<ApiResponse<AdminShipment>>(`/admin/shipments/${id}/close`);
    return extractData(response);
  },

  // ==========================================================================
  // Bookings
  // ==========================================================================

  getBookings: async (params?: BookingListParams): Promise<BookingListResponse> => {
    const response = await api.get<ApiResponse<AdminBooking[]> & { pagination: PaginationResponse }>('/admin/bookings', {
      params,
    });
    return extractListData<AdminBooking>(response);
  },

  getBooking: async (id: string): Promise<AdminBookingDetail> => {
    const response = await api.get<ApiResponse<AdminBookingDetail>>(`/admin/bookings/${id}`);
    return extractData(response);
  },

  getBookingStats: async (): Promise<BookingStats> => {
    const response = await api.get<ApiResponse<BookingStats>>('/admin/bookings/stats');
    return extractData(response);
  },

  confirmBooking: async (id: string): Promise<AdminBooking> => {
    // Note: API endpoint is /confirm but sets status to ACCEPTED
    const response = await api.post<ApiResponse<AdminBooking>>(`/admin/bookings/${id}/confirm`);
    return extractData(response);
  },

  cancelBooking: async (id: string, reason?: string): Promise<AdminBooking> => {
    const response = await api.post<ApiResponse<AdminBooking>>(`/admin/bookings/${id}/cancel`, {
      reason,
    });
    return extractData(response);
  },

  // ==========================================================================
  // Settings
  // ==========================================================================

  getSettings: async (): Promise<PlatformSettings> => {
    const response = await api.get<ApiResponse<PlatformSettings>>('/admin/settings');
    return extractData(response);
  },

  updateSettings: async (settings: UpdateSettingsRequest): Promise<PlatformSettings> => {
    const response = await api.put<ApiResponse<PlatformSettings>>('/admin/settings', settings);
    return extractData(response);
  },

  // ==========================================================================
  // Reports
  // ==========================================================================

  getUserReport: async (params?: ReportParams): Promise<{
    format: string;
    data: any[];
  }> => {
    const response = await api.get<ApiResponse<{ format: string; data: any[] }>>('/admin/reports/users', {
      params,
    });
    return extractData(response);
  },

  getBookingReport: async (params?: ReportParams): Promise<{
    format: string;
    data: any[];
  }> => {
    const response = await api.get<ApiResponse<{ format: string; data: any[] }>>('/admin/reports/bookings', {
      params,
    });
    return extractData(response);
  },

  getRevenueReport: async (params?: RevenueReportParams): Promise<{
    format: string;
    data: AnalyticsDataPoint[];
  }> => {
    const response = await api.get<ApiResponse<{ format: string; data: AnalyticsDataPoint[] }>>(
      '/admin/reports/revenue',
      { params }
    );
    return extractData(response);
  },

  getCompanyReport: async (params?: ReportParams): Promise<{
    format: string;
    data: any[];
  }> => {
    const response = await api.get<ApiResponse<{ format: string; data: any[] }>>('/admin/reports/companies', {
      params,
    });
    return extractData(response);
  },

  // ==========================================================================
  // Warehouse Addresses
  // ==========================================================================

  getCompanyWarehouseAddresses: async (companyId: string): Promise<AdminWarehouseAddress[]> => {
    const response = await api.get<ApiResponse<AdminWarehouseAddress[]>>(`/admin/companies/${companyId}/warehouses`);
    return extractData(response);
  },

  getWarehouseAddress: async (warehouseId: string): Promise<AdminWarehouseAddress> => {
    const response = await api.get<ApiResponse<AdminWarehouseAddress>>(`/admin/warehouses/${warehouseId}`);
    return extractData(response);
  },

  getAllWarehouseAddresses: async (params?: PaginationParams & {
    companyId?: string;
    search?: string;
  }): Promise<{ data: AdminWarehouseAddress[]; pagination: PaginationResponse }> => {
    const response = await api.get<ApiResponse<AdminWarehouseAddress[]> & { pagination: PaginationResponse }>(
      '/admin/warehouses',
      { params }
    );
    return extractListData<AdminWarehouseAddress>(response);
  },
};


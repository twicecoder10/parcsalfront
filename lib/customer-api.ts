import { api, ApiResponse, extractData } from './api';
import { Notification, NotificationListResponse, UnreadCountResponse, NotificationPagination } from './api-types';

// Customer API
export const customerApi = {
  // Onboarding
  completeOnboarding: async (data: {
    phoneNumber: string;
    city: string;
    address?: string;
    country?: string;
    preferredShippingMode?: string;
    notificationEmail?: boolean;
    notificationSMS?: boolean;
  }): Promise<{ message: string }> => {
    const response = await api.put<ApiResponse<{ message: string }>>('/customer/profile/onboarding', data);
    if (response.data.status === 'error') {
      throw new Error(response.data.message || 'Failed to complete onboarding');
    }
    return { message: response.data.message || 'Onboarding completed successfully' };
  },

  // Dashboard
  getDashboardStats: async (): Promise<{
    activeBookings: number;
    pendingBookings: number;
    totalBookings: number;
    upcomingDepartures: number;
  }> => {
    const response = await api.get<ApiResponse<{
      activeBookings: number;
      pendingBookings: number;
      totalBookings: number;
      upcomingDepartures: number;
    }>>('/customer/dashboard/stats');
    return extractData(response);
  },

  getRecentBookings: async (params?: { limit?: number }): Promise<any[]> => {
    const response = await api.get<ApiResponse<any[]>>('/customer/bookings/recent', { params });
    return extractData(response);
  },

  // Bookings
  getBookings: async (params?: {
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: any[]; pagination: any }> => {
    const response = await api.get<{
      status: 'success' | 'error';
      data: any[];
      pagination: any;
      message?: string;
    }>('/customer/bookings', { params });
    
    if (response.data.status === 'error') {
      throw new Error(response.data.message || 'Failed to fetch bookings');
    }
    
    return {
      data: response.data.data || [],
      pagination: response.data.pagination,
    };
  },

  getBookingById: async (bookingId: string): Promise<any> => {
    // Try general /bookings/:id endpoint first (for pending bookings with pricing breakdown)
    // Fall back to /customer/bookings/:id if the general endpoint fails
    try {
      const response = await api.get<ApiResponse<any>>(`/bookings/${bookingId}`);
      return extractData(response);
    } catch (error: any) {
      // If general endpoint fails (404 or other error), try customer-specific endpoint
      if (error.response?.status === 404 || error.response?.status === 403) {
        const response = await api.get<ApiResponse<any>>(`/customer/bookings/${bookingId}`);
        return extractData(response);
      }
      throw error;
    }
  },

  getBookingTrack: async (bookingId: string): Promise<any> => {
    const response = await api.get<ApiResponse<any>>(`/customer/bookings/${bookingId}/track`);
    return extractData(response);
  },

  createBooking: async (data: {
    shipmentSlotId: string;
    requestedWeightKg?: number;
    requestedItemsCount?: number;
    notes?: string;
    parcelType?: 'DOCUMENT' | 'PACKAGE' | 'FRAGILE' | 'ELECTRONICS' | 'CLOTHING' | 'FOOD' | 'MEDICINE' | 'OTHER' | null;
    weight?: number | null;
    value?: number | null;
    length?: number | null;
    width?: number | null;
    height?: number | null;
    description?: string | null;
    images?: string[];
    pickupMethod: 'PICKUP_FROM_SENDER' | 'DROP_OFF_AT_COMPANY';
    deliveryMethod: 'RECEIVER_PICKS_UP' | 'DELIVERED_TO_RECEIVER';
    // Pickup address fields
    pickupAddress?: string | null;
    pickupCity?: string | null;
    pickupState?: string | null;
    pickupCountry?: string | null;
    pickupPostalCode?: string | null;
    pickupContactName?: string | null;
    pickupContactPhone?: string | null;
    pickupWarehouseId?: string | null;
    // Delivery address fields
    deliveryAddress?: string | null;
    deliveryCity?: string | null;
    deliveryState?: string | null;
    deliveryCountry?: string | null;
    deliveryPostalCode?: string | null;
    deliveryContactName?: string | null;
    deliveryContactPhone?: string | null;
    deliveryWarehouseId?: string | null;
  }): Promise<any> => {
    const response = await api.post<ApiResponse<any>>('/customer/bookings', data);
    return extractData(response);
  },

  cancelBooking: async (bookingId: string): Promise<{ message: string }> => {
    const response = await api.post<ApiResponse<{ message: string }>>(`/customer/bookings/${bookingId}/cancel`);
    if (response.data.status === 'error') {
      throw new Error(response.data.message || 'Failed to cancel booking');
    }
    return { message: response.data.message || 'Booking cancelled successfully' };
  },

  // Payment
  createPaymentSession: async (bookingId: string): Promise<{ sessionId: string; url: string }> => {
    const response = await api.post<ApiResponse<{ sessionId: string; url: string }>>(
      `/customer/bookings/${bookingId}/payment`
    );
    return extractData(response);
  },

  syncPaymentStatus: async (bookingId: string, sessionId?: string): Promise<{
    status: string;
    message: string;
    bookingId: string;
    paymentStatus: string;
    stripeStatus?: string;
  }> => {
    const params = sessionId ? { session_id: sessionId } : {};
    const response = await api.post<any>(`/customer/bookings/${bookingId}/payment/sync`, {}, { params });
    
    // Handle error response
    if (response.data.status === 'error') {
      throw new Error((response.data as ApiResponse<any>).message || 'Failed to sync payment status');
    }
    
    // Handle wrapped response format: { status: "success", data: {...} }
    if ('data' in response.data && response.data.data) {
      return response.data.data;
    }
    
    // Handle direct response format: { status: "success", message: "...", bookingId: "...", ... }
    // The response itself contains the sync result
    return response.data as {
      status: string;
      message: string;
      bookingId: string;
      paymentStatus: string;
      stripeStatus?: string;
    };
  },

  // Profile
  getProfile: async (): Promise<any> => {
    const response = await api.get<ApiResponse<any>>('/customer/profile');
    return extractData(response);
  },

  updateProfile: async (data: {
    fullName?: string;
    email?: string;
    phoneNumber?: string;
    city?: string;
    address?: string;
    country?: string;
  }): Promise<{ message: string }> => {
    const response = await api.put<ApiResponse<{ message: string }>>('/customer/profile', data);
    if (response.data.status === 'error') {
      throw new Error(response.data.message || 'Failed to update profile');
    }
    return { message: response.data.message || 'Profile updated successfully' };
  },

  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{ message: string }> => {
    const response = await api.post<ApiResponse<{ message: string }>>('/customer/profile/change-password', data);
    if (response.data.status === 'error') {
      throw new Error(response.data.message || 'Failed to change password');
    }
    return { message: response.data.message || 'Password changed successfully' };
  },

  // Notifications
  getNotifications: async (params?: {
    page?: number;
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
    type?: string;
  }): Promise<{ data: Notification[]; pagination: NotificationPagination }> => {
    const limit = params?.limit ?? 20;
    const offset = params?.offset ?? (params?.page ? (params.page - 1) * limit : 0);
    
    const response = await api.get<any>('/customer/notifications', {
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
    const response = await api.get<UnreadCountResponse>('/customer/notifications/unread-count');
    return response.data.count;
  },

  markNotificationAsRead: async (notificationId: string): Promise<void> => {
    const response = await api.put<ApiResponse<{ message: string }>>(`/customer/notifications/${notificationId}/read`);
    if (response.data.status === 'error') {
      throw new Error(response.data.message || 'Failed to mark notification as read');
    }
  },

  markAllNotificationsAsRead: async (): Promise<void> => {
    const response = await api.put<ApiResponse<{ message: string }>>('/customer/notifications/read-all');
    if (response.data.status === 'error') {
      throw new Error(response.data.message || 'Failed to mark all notifications as read');
    }
  },

  deleteNotification: async (notificationId: string): Promise<void> => {
    const response = await api.delete<ApiResponse<{ message: string }>>(`/customer/notifications/${notificationId}`);
    if (response.data.status === 'error') {
      throw new Error(response.data.message || 'Failed to delete notification');
    }
  },

  deleteAllReadNotifications: async (): Promise<{ count: number }> => {
    const response = await api.delete<ApiResponse<{ message: string; count: number }>>('/customer/notifications/read/all');
    if (response.data.status === 'error') {
      throw new Error(response.data.message || 'Failed to delete read notifications');
    }
    return { count: response.data.data?.count || 0 };
  },

  getNotificationPreferences: async (): Promise<{
    email: boolean;
    sms: boolean;
  }> => {
    const response = await api.get<ApiResponse<{ email: boolean; sms: boolean }>>('/customer/notifications/preferences');
    return extractData(response);
  },

  updateNotificationPreferences: async (data: {
    email?: boolean;
    sms?: boolean;
  }): Promise<{ message: string }> => {
    const response = await api.put<ApiResponse<{ message: string }>>('/customer/notifications/preferences', data);
    if (response.data.status === 'error') {
      throw new Error(response.data.message || 'Failed to update notification preferences');
    }
    return { message: response.data.message || 'Notification preferences updated successfully' };
  },

  // Reviews
  createReview: async (bookingId: string, data: {
    rating: number;
    comment?: string;
  }): Promise<any> => {
    const response = await api.post<any>(`/customer/bookings/${bookingId}/reviews`, data);
    
    // The API returns the review object directly (not wrapped in { status: 'success', data: ... })
    // NEVER use extractData here as it will throw "Invalid response format" error
    const responseData = response?.data;
    
    // If responseData is null/undefined, return empty object
    if (!responseData) {
      return {};
    }
    
    // Check if it's a direct review object (has id or bookingId)
    if (responseData.id || responseData.bookingId) {
      return responseData;
    }
    
    // Handle wrapped response format (if API changes in future)
    if (responseData.status === 'success' && responseData.data) {
      return responseData.data;
    }
    
    // If neither format matches, return the data as-is
    // This prevents "Invalid response format" errors
    return responseData;
  },

  updateReview: async (bookingId: string, data: {
    rating?: number;
    comment?: string | null;
  }): Promise<any> => {
    const response = await api.put<any>(`/customer/bookings/${bookingId}/reviews`, data);
    
    // The API returns the review object directly (not wrapped)
    // Check if response.data is the review object
    if (response.data && (response.data.id || response.data.bookingId)) {
      return response.data;
    }
    
    // Handle wrapped response format (if API changes in future)
    if (response.data?.status === 'success' && response.data.data) {
      return response.data.data;
    }
    
    // If neither format matches, return the data as-is
    // This prevents "Invalid response format" errors
    return response.data || {};
  },

  deleteReview: async (bookingId: string): Promise<{ message: string }> => {
    const response = await api.delete<ApiResponse<{ message: string }>>(`/customer/bookings/${bookingId}/reviews`);
    if (response.data.status === 'error') {
      throw new Error(response.data.message || 'Failed to delete review');
    }
    return { message: response.data.message || 'Review deleted successfully' };
  },

  getReviewByBookingId: async (bookingId: string): Promise<any> => {
    const response = await api.get<any>(`/customer/bookings/${bookingId}/reviews`);
    
    // Handle API response structure
    if (response.data?.status === 'success') {
      return response.data.data || response.data;
    }
    
    // If response.data is already the review object (direct response)
    if (response.data?.id || response.data?.bookingId) {
      return response.data;
    }
    
    // Fallback to extractData for nested structure
    try {
      return extractData(response as { data: ApiResponse<any> });
    } catch (error) {
      // If extraction fails, return the response data as-is
      return response.data;
    }
  },

  // Extra Charges
  getExtraCharges: async (bookingId: string): Promise<any[]> => {
    // Use the new endpoint /bookings/{id}/extra-charges
    const response = await api.get<ApiResponse<any[]>>(`/bookings/${bookingId}/extra-charges`);
    return extractData(response);
  },

  payExtraCharge: async (bookingId: string, extraChargeId: string): Promise<{ sessionId: string; url: string }> => {
    const response = await api.post<ApiResponse<{ sessionId: string; url: string }>>(
      `/bookings/${bookingId}/extra-charges/${extraChargeId}/pay`
    );
    return extractData(response);
  },

  declineExtraCharge: async (bookingId: string, extraChargeId: string): Promise<any> => {
    const response = await api.post<ApiResponse<any>>(
      `/bookings/${bookingId}/extra-charges/${extraChargeId}/decline`
    );
    return extractData(response);
  },
};


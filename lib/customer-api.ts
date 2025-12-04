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
    const response = await api.get<ApiResponse<any>>(`/customer/bookings/${bookingId}`);
    return extractData(response);
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
    unreadOnly?: boolean;
    type?: string;
  }): Promise<{ data: Notification[]; pagination: NotificationPagination }> => {
    const response = await api.get<NotificationListResponse>('/customer/notifications', {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 10,
        ...(params?.unreadOnly !== undefined && { unreadOnly: params.unreadOnly.toString() }),
        ...(params?.type && { type: params.type }),
      },
    });
    
    return {
      data: response.data.data || [],
      pagination: response.data.pagination,
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
};


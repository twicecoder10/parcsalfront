import axios from 'axios';
import { getLoginUrlWithRedirect } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        // Don't redirect if we're already on the login page or during auth requests
        const isAuthRequest = error.config?.url?.includes('/auth/login') || 
                            error.config?.url?.includes('/auth/register');
        const isOnLoginPage = window.location.pathname === '/auth/login';
        
        // Only redirect if not already on login page and not during auth request
        if (!isOnLoginPage && !isAuthRequest) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('token'); // legacy
          localStorage.removeItem('user');
          // Include current path as redirect parameter to return user after login
          window.location.href = getLoginUrlWithRedirect();
        } else {
          // Still clear tokens on auth failure, but don't redirect
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('token'); // legacy
          localStorage.removeItem('user');
        }
      }
    }
    
    // Handle API error format
    if (error.response?.data?.status === 'error') {
      error.response.data.message = error.response.data.message || 'An error occurred';
    }
    
    return Promise.reject(error);
  }
);

// Types
export type UserRole = 'CUSTOMER' | 'COMPANY_ADMIN' | 'COMPANY_STAFF' | 'SUPER_ADMIN';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  companyId: string | null;
  isEmailVerified?: boolean; // ⚠️ Email verification status - MUST be checked first
  onboardingCompleted?: boolean; // Track if onboarding is completed
  // Legacy support - API returns fullName but we keep name for backward compatibility
  name?: string;
  // Additional user fields
  phoneNumber?: string;
  city?: string;
  address?: string;
  country?: string;
  preferredShippingMode?: string;
  notificationEmail?: boolean;
  notificationSMS?: boolean;
  // Company object (for COMPANY_ADMIN and COMPANY_STAFF)
  company?: {
    id: string;
    name: string;
    slug: string;
    isVerified: boolean;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterCustomerRequest {
  email: string;
  password: string;
  fullName: string;
}

export interface RegisterCompanyRequest {
  email: string;
  password: string;
  fullName: string;
  companyName: string;
  companyCountry: string;
  companyCity: string;
  companyDescription?: string;
  companyWebsite?: string;
  companyLogoUrl?: string;
}

// Helper to extract data from API response
export const extractData = <T>(response: { data: ApiResponse<T> }): T => {
  if (response.data.status === 'error') {
    throw new Error(response.data.message || 'An error occurred');
  }
  if (!response.data.data) {
    throw new Error('Invalid response format');
  }
  return response.data.data;
};

// Auth API
export const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', data);
    return extractData(response);
  },
  registerCustomer: async (data: RegisterCustomerRequest): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/register/customer', data);
    return extractData(response);
  },
  registerCompany: async (data: RegisterCompanyRequest): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/register/company', data);
    return extractData(response);
  },
  forgotPassword: async (data: { email: string }): Promise<{ message: string }> => {
    const response = await api.post<ApiResponse<{ message: string }>>('/auth/forgot-password', data);
    if (response.data.status === 'error') {
      throw new Error(response.data.message || 'Failed to send reset email');
    }
    return { message: response.data.message || 'If an account exists with that email, a password reset link has been sent.' };
  },
  resetPassword: async (data: { token: string; password: string }): Promise<{ message: string }> => {
    const response = await api.post<ApiResponse<{ message: string }>>('/auth/reset-password', data);
    if (response.data.status === 'error') {
      throw new Error(response.data.message || 'Failed to reset password');
    }
    return { message: response.data.message || 'Password has been reset successfully.' };
  },
  verifyEmail: async (data: { token: string }): Promise<{ message: string }> => {
    const response = await api.post<ApiResponse<{ message: string }>>('/auth/verify-email', data);
    if (response.data.status === 'error') {
      throw new Error(response.data.message || 'Failed to verify email');
    }
    return { message: response.data.message || 'Email verified successfully.' };
  },
  resendVerificationEmail: async (data: { email: string }): Promise<{ message: string }> => {
    const response = await api.post<ApiResponse<{ message: string }>>('/auth/resend-verification', data);
    if (response.data.status === 'error') {
      throw new Error(response.data.message || 'Failed to resend verification email');
    }
    return { message: response.data.message || 'If an account exists with that email, a verification link has been sent.' };
  },
  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<ApiResponse<{ user: User }>>('/auth/me');
    return extractData(response).user;
  },
  acceptInvitation: async (token: string, data: { password: string; fullName: string }): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>(`/auth/accept-invitation?token=${token}`, data);
    return extractData(response);
  },
};

// Onboarding status types
export interface OnboardingStepStatus {
  completed: boolean;
  completedAt?: string;
}

export interface OnboardingStatusResponse {
  steps: {
    email_verification?: OnboardingStepStatus;
    profile_completion?: OnboardingStepStatus;
    first_booking?: OnboardingStepStatus;
    [key: string]: OnboardingStepStatus | undefined;
  };
  completed: boolean;
  progress: number; // percentage
}

// Onboarding API
export const onboardingApi = {
  getStatus: async (type: 'user' | 'company'): Promise<OnboardingStatusResponse> => {
    const response = await api.get<ApiResponse<OnboardingStatusResponse> | OnboardingStatusResponse>('/onboarding/status', {
      params: { type },
    });
    
    // Handle both response formats:
    // 1. Wrapped: { status: "success", data: {...} }
    // 2. Direct: { steps: {...}, completed: false, progress: 33 }
    if ('status' in response.data) {
      // Wrapped format
      return extractData(response as { data: ApiResponse<OnboardingStatusResponse> });
    } else {
      // Direct format - return as is
      return response.data as OnboardingStatusResponse;
    }
  },
};

// Public shipment APIs
export const shipmentApi = {
  search: async (params: {
    originCity?: string;
    originCountry?: string;
    destinationCity?: string;
    destinationCountry?: string;
    dateFrom?: string;
    dateTo?: string;
    mode?: string;
    minPrice?: number;
    maxPrice?: number;
    limit?: number;
    offset?: number;
  }) => {
    const response = await api.get<{
      status: 'success' | 'error';
      data: any[];
      pagination: {
        limit: number;
        offset: number;
        total: number;
        hasMore: boolean;
      };
      message?: string;
    }>('/shipments/search', { params });
    
    if (response.data.status === 'error') {
      throw new Error(response.data.message || 'An error occurred');
    }
    
    return {
      data: response.data.data,
      pagination: response.data.pagination,
    };
  },
  getById: async (id: string) => {
    const response = await api.get<ApiResponse<any>>(`/shipments/${id}`);
    return extractData(response);
  },
};

// Contact API
export const contactApi = {
  submit: async (data: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }) => {
    const response = await api.post<ApiResponse<{ message: string }>>('/contact', data);
    if (response.data.status === 'error') {
      throw new Error(response.data.message || 'Failed to submit contact form');
    }
    return { message: response.data.message || 'Your message has been received. We will get back to you soon.' };
  },
};

// Public API instance (no authentication required)
const publicApiInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Public API (no authentication required)
export const publicApi = {
  // Public tracking endpoint - doesn't require authentication
  getBookingTrack: async (bookingId: string): Promise<any> => {
    const response = await publicApiInstance.get<ApiResponse<any>>(
      `/shipments/track/${bookingId}`
    );
    if (response.data.status === 'error') {
      throw new Error(response.data.message || 'Failed to fetch tracking information');
    }
    if (!response.data.data) {
      throw new Error('Invalid response format');
    }
    return response.data.data;
  },
  
  // Get warehouse addresses for a company (public endpoint)
  getWarehouseAddresses: async (companyIdOrSlug: string): Promise<any[]> => {
    const response = await publicApiInstance.get<ApiResponse<any[]>>(
      `/companies/${companyIdOrSlug}/warehouses`
    );
    if (response.data.status === 'error') {
      throw new Error(response.data.message || 'Failed to fetch warehouse addresses');
    }
    if (!response.data.data) {
      throw new Error('Invalid response format');
    }
    return response.data.data;
  },

  // Get public company profile (limited information)
  getCompanyProfile: async (companyIdOrSlug: string): Promise<{
    id: string;
    name: string;
    slug: string;
    description?: string;
    country: string;
    city: string;
    website?: string;
    logoUrl?: string;
    isVerified: boolean;
    rating?: number | null;
    reviewCount: number;
  }> => {
    const response = await publicApiInstance.get<ApiResponse<{
      id: string;
      name: string;
      slug: string;
      description?: string;
      country: string;
      city: string;
      website?: string;
      logoUrl?: string;
      isVerified: boolean;
      rating?: number | null;
      reviewCount: number;
    }>>(`/companies/${companyIdOrSlug}`);
    if (response.data.status === 'error') {
      throw new Error(response.data.message || 'Failed to fetch company profile');
    }
    if (!response.data.data) {
      throw new Error('Invalid response format');
    }
    return response.data.data;
  },

  // Get company reviews (public endpoint)
  getCompanyReviews: async (companyIdOrSlug: string, params?: {
    limit?: number;
    offset?: number;
    rating?: number;
  }): Promise<any> => {
    const response = await publicApiInstance.get(`/companies/${companyIdOrSlug}/reviews`, { params });
    
    // The reviews endpoint doesn't wrap in ApiResponse format
    return response.data;
  },
};


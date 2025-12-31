import { api, ApiResponse, extractData } from './api';
import type {
  MarketingCampaign,
  MarketingConsent,
  CampaignPreviewResponse,
  CreateCampaignRequest,
  ScheduleCampaignRequest,
  UpdateCampaignRequest,
  PaginationResponse,
  CampaignChannel,
  CampaignStatus,
} from './api-types';
export type { CampaignStatus } from './api-types';

// Helper to extract data and pagination from list responses
const extractListData = <T>(
  response: { data: ApiResponse<T[]> & { pagination?: PaginationResponse } }
): { data: T[]; pagination: PaginationResponse } => {
  const responseData = response.data;
  
  // Handle error responses
  if (responseData.status === 'error' || (responseData as any).success === false) {
    const errorMessage = responseData.message || (responseData as any).error?.message || 'An error occurred';
    throw new Error(errorMessage);
  }
  
  // Handle success response with success: true and data.campaigns structure
  if ((responseData as any).success === true && (responseData as any).data) {
    const dataObj = (responseData as any).data;
    
    // Check if campaigns array exists (for marketing campaigns)
    if (dataObj.campaigns && Array.isArray(dataObj.campaigns)) {
      const limit = dataObj.limit || 20;
      const page = dataObj.page || 1;
      const offset = (page - 1) * limit;
      const total = dataObj.total || 0;
      const totalPages = dataObj.totalPages || 1;
      
      return {
        data: dataObj.campaigns,
        pagination: {
          limit,
          offset,
          total,
          hasMore: page < totalPages,
        },
      };
    }
    
    // Check if data is directly an array
    if (Array.isArray(dataObj)) {
      return {
        data: dataObj,
        pagination: { limit: 0, offset: 0, total: 0, hasMore: false },
      };
    }
  }
  
  // Handle success response with status: 'success'
  if (responseData.status === 'success' && Array.isArray(responseData.data)) {
    return {
      data: responseData.data,
      pagination: (responseData as any).pagination || { limit: 0, offset: 0, total: 0, hasMore: false },
    };
  }
  
  // If data is directly an array (unwrapped)
  if (Array.isArray(responseData)) {
    return {
      data: responseData,
      pagination: { limit: 0, offset: 0, total: 0, hasMore: false },
    };
  }
  
  // Fallback: return empty array if structure is unexpected
  console.warn('Unexpected API response structure:', responseData);
  return {
    data: [],
    pagination: { limit: 0, offset: 0, total: 0, hasMore: false },
  };
};

// ============================================================================
// Admin Marketing API
// ============================================================================

export const adminMarketingApi = {
  // List campaigns
  getCampaigns: async (params?: {
    page?: number;
    limit?: number;
    status?: CampaignStatus;
    channel?: CampaignChannel;
  }): Promise<{ data: MarketingCampaign[]; pagination: PaginationResponse }> => {
    const limit = params?.limit ?? 20;
    const offset = params?.page ? (params.page - 1) * limit : 0;
    
    const response = await api.get<ApiResponse<MarketingCampaign[]> & { pagination: PaginationResponse }>(
      '/admin/marketing/campaigns',
      {
        params: {
          limit,
          offset,
          ...(params?.status && { status: params.status }),
          ...(params?.channel && { channel: params.channel }),
        },
      }
    );
    return extractListData<MarketingCampaign>(response);
  },

  // Get campaign details
  getCampaign: async (id: string): Promise<MarketingCampaign> => {
    const response = await api.get<ApiResponse<MarketingCampaign>>(`/admin/marketing/campaigns/${id}`);
    return extractData(response);
  },

  // Create campaign
  createCampaign: async (data: CreateCampaignRequest): Promise<MarketingCampaign> => {
    const response = await api.post<ApiResponse<MarketingCampaign>>('/admin/marketing/campaigns', data);
    return extractData(response);
  },

  // Preview recipients
  previewRecipients: async (id: string): Promise<CampaignPreviewResponse> => {
    const response = await api.get<ApiResponse<CampaignPreviewResponse>>(
      `/admin/marketing/campaigns/${id}/preview`
    );
    return extractData(response);
  },

  // Send campaign immediately
  sendCampaign: async (id: string): Promise<MarketingCampaign> => {
    const response = await api.post<ApiResponse<MarketingCampaign>>(
      `/admin/marketing/campaigns/${id}/send`
    );
    return extractData(response);
  },

  // Schedule campaign
  scheduleCampaign: async (id: string, data: ScheduleCampaignRequest): Promise<MarketingCampaign> => {
    const response = await api.post<ApiResponse<MarketingCampaign>>(
      `/admin/marketing/campaigns/${id}/schedule`,
      data
    );
    return extractData(response);
  },

  // Cancel campaign
  cancelCampaign: async (id: string): Promise<MarketingCampaign> => {
    const response = await api.post<ApiResponse<MarketingCampaign>>(
      `/admin/marketing/campaigns/${id}/cancel`
    );
    return extractData(response);
  },

  // Delete campaign
  deleteCampaign: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete<ApiResponse<{ message: string }>>(
      `/admin/marketing/campaigns/${id}`
    );
    if (response.data.status === 'error') {
      throw new Error(response.data.message || 'Failed to delete campaign');
    }
    return { message: response.data.message || 'Campaign deleted successfully' };
  },

  // Update campaign
  updateCampaign: async (id: string, data: UpdateCampaignRequest): Promise<MarketingCampaign> => {
    const response = await api.put<ApiResponse<MarketingCampaign>>(
      `/admin/marketing/campaigns/${id}`,
      data
    );
    return extractData(response);
  },
};

// ============================================================================
// Company Marketing API
// ============================================================================

export const companyMarketingApi = {
  // List campaigns
  getCampaigns: async (params?: {
    page?: number;
    limit?: number;
    status?: CampaignStatus;
    channel?: CampaignChannel;
  }): Promise<{ data: MarketingCampaign[]; pagination: PaginationResponse }> => {
    const limit = params?.limit ?? 20;
    const offset = params?.page ? (params.page - 1) * limit : 0;
    
    const response = await api.get<ApiResponse<MarketingCampaign[]> & { pagination: PaginationResponse }>(
      '/companies/marketing/campaigns',
      {
        params: {
          limit,
          offset,
          ...(params?.status && { status: params.status }),
          ...(params?.channel && { channel: params.channel }),
        },
      }
    );
    return extractListData<MarketingCampaign>(response);
  },

  // Get campaign details
  getCampaign: async (id: string): Promise<MarketingCampaign> => {
    const response = await api.get<ApiResponse<MarketingCampaign>>(`/companies/marketing/campaigns/${id}`);
    return extractData(response);
  },

  // Create campaign
  createCampaign: async (data: CreateCampaignRequest): Promise<MarketingCampaign> => {
    const response = await api.post<ApiResponse<MarketingCampaign>>('/companies/marketing/campaigns', data);
    return extractData(response);
  },

  // Preview recipients (count only for companies)
  previewRecipients: async (id: string): Promise<CampaignPreviewResponse> => {
    const response = await api.get<ApiResponse<CampaignPreviewResponse>>(
      `/companies/marketing/campaigns/${id}/preview`
    );
    return extractData(response);
  },

  // Send campaign immediately
  sendCampaign: async (id: string): Promise<MarketingCampaign> => {
    const response = await api.post<ApiResponse<MarketingCampaign>>(
      `/companies/marketing/campaigns/${id}/send`
    );
    return extractData(response);
  },

  // Schedule campaign
  scheduleCampaign: async (id: string, data: ScheduleCampaignRequest): Promise<MarketingCampaign> => {
    const response = await api.post<ApiResponse<MarketingCampaign>>(
      `/companies/marketing/campaigns/${id}/schedule`,
      data
    );
    return extractData(response);
  },

  // Cancel campaign
  cancelCampaign: async (id: string): Promise<MarketingCampaign> => {
    const response = await api.post<ApiResponse<MarketingCampaign>>(
      `/companies/marketing/campaigns/${id}/cancel`
    );
    return extractData(response);
  },

  // Delete campaign
  deleteCampaign: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete<ApiResponse<{ message: string }>>(
      `/companies/marketing/campaigns/${id}`
    );
    if (response.data.status === 'error') {
      throw new Error(response.data.message || 'Failed to delete campaign');
    }
    return { message: response.data.message || 'Campaign deleted successfully' };
  },

  // Update campaign
  updateCampaign: async (id: string, data: UpdateCampaignRequest): Promise<MarketingCampaign> => {
    const response = await api.put<ApiResponse<MarketingCampaign>>(
      `/companies/marketing/campaigns/${id}`,
      data
    );
    return extractData(response);
  },
};

// ============================================================================
// User Marketing Consent API
// ============================================================================

export const userMarketingApi = {
  // Get user's marketing consent preferences
  getConsent: async (): Promise<MarketingConsent> => {
    const response = await api.get<ApiResponse<MarketingConsent>>('/me/marketing-consent');
    return extractData(response);
  },

  // Update user's marketing consent preferences
  updateConsent: async (data: {
    emailMarketingOptIn?: boolean;
    whatsappMarketingOptIn?: boolean;
    carrierMarketingOptIn?: boolean;
  }): Promise<MarketingConsent> => {
    const response = await api.put<ApiResponse<MarketingConsent>>('/me/marketing-consent', data);
    return extractData(response);
  },
};


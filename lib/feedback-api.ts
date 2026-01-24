import { api, ApiResponse } from './api';

export type FeedbackType = 'Bug' | 'Feature' | 'Complaint' | 'General';

export interface FeedbackPayload {
  type: FeedbackType;
  message: string;
  rating?: number;
  attachments?: string[];
  pageUrl: string;
  app: 'WEB' | string;
}

export async function submitFeedback(payload: FeedbackPayload): Promise<void> {
  const response = await api.post<ApiResponse<unknown>>('/feedback', payload);

  if (response.data.status === 'error') {
    throw new Error(response.data.message || 'Failed to submit feedback.');
  }
}


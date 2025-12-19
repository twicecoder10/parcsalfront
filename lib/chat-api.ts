import { api, ApiResponse, extractData } from './api';

export interface ChatRoom {
  id: string;
  customerId: string;
  companyId: string;
  bookingId?: string | null;
  lastMessageAt?: string | null;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: string;
    email: string;
    fullName: string;
  };
  company: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string | null;
  };
  booking?: {
    id: string;
    status: string;
  } | null;
  messages?: Message[];
}

export interface Message {
  id: string;
  chatRoomId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
  updatedAt: string;
  sender?: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  };
}

export interface CreateChatRoomRequest {
  companyId: string;
  bookingId?: string | null;
}

export interface SendMessageRequest {
  chatRoomId: string;
  content: string;
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

export const chatApi = {
  // Create a chat room
  createChatRoom: async (data: CreateChatRoomRequest): Promise<ChatRoom> => {
    const response = await api.post<ApiResponse<ChatRoom>>('/chat/rooms', data);
    return extractData(response);
  },

  // Get all chat rooms for the current user
  getChatRooms: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<ChatRoom>> => {
    const response = await api.get<ApiResponse<PaginatedResponse<ChatRoom>>>('/chat/rooms', { params });
    return extractData(response);
  },

  // Get a specific chat room
  getChatRoom: async (chatRoomId: string): Promise<ChatRoom> => {
    const response = await api.get<ApiResponse<ChatRoom>>(`/chat/rooms/${chatRoomId}`);
    return extractData(response);
  },

  // Get messages in a chat room
  getMessages: async (
    chatRoomId: string,
    params?: {
      page?: number;
      limit?: number;
    }
  ): Promise<PaginatedResponse<Message>> => {
    const response = await api.get<ApiResponse<PaginatedResponse<Message>>>(
      `/chat/rooms/${chatRoomId}/messages`,
      { params }
    );
    return extractData(response);
  },

  // Send a message (via REST API - Socket.IO is preferred for real-time)
  sendMessage: async (data: SendMessageRequest): Promise<Message> => {
    const response = await api.post<ApiResponse<Message>>('/chat/messages', data);
    return extractData(response);
  },

  // Mark messages as read
  markMessagesAsRead: async (chatRoomId: string): Promise<{ count: number }> => {
    const response = await api.put<ApiResponse<{ count: number }>>(`/chat/rooms/${chatRoomId}/read`);
    return extractData(response);
  },
};


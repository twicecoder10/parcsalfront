'use client';

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { Message, ChatRoom } from './chat-api';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  currentChatRoom: string | null;
  messages: Map<string, Message[]>;
  unreadCounts: Map<string, number>;
  joinChatRoom: (chatRoomId: string) => void;
  leaveChatRoom: (chatRoomId: string) => void;
  sendMessage: (chatRoomId: string | undefined, content: string, companyId?: string, bookingId?: string | null, customerId?: string) => void;
  onChatRoomCreated: (callback: (data: { chatRoomId: string; companyId?: string; customerId?: string; bookingId?: string | null }) => void) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentChatRoom, setCurrentChatRoom] = useState<string | null>(null);
  const [messages, setMessages] = useState<Map<string, Message[]>>(new Map());
  const [unreadCounts, setUnreadCounts] = useState<Map<string, number>>(new Map());
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Only connect if we have a token
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    if (!token) return;

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const socketInstance = io(API_BASE_URL, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socketInstance;
    setSocket(socketInstance);

    // Connection events
    socketInstance.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    // Chat room events
    socketInstance.on('joined:chatRoom', (data: { chatRoomId: string }) => {
      console.log('Joined chat room:', data.chatRoomId);
      setCurrentChatRoom(data.chatRoomId);
    });

    socketInstance.on('left:chatRoom', (data: { chatRoomId: string }) => {
      console.log('Left chat room:', data.chatRoomId);
      if (currentChatRoom === data.chatRoomId) {
        setCurrentChatRoom(null);
      }
    });

    // Message events
    socketInstance.on('message:new', (message: Message) => {
      console.log('New message received:', message);
      setMessages((prev) => {
        const newMessages = new Map(prev);
        const roomMessages = newMessages.get(message.chatRoomId) || [];
        // Check if message already exists (avoid duplicates)
        if (!roomMessages.find((m) => m.id === message.id && m.id !== '')) {
          newMessages.set(message.chatRoomId, [...roomMessages, message]);
        }
        return newMessages;
      });

      // Update unread count if not in this chat room
      if (currentChatRoom !== message.chatRoomId) {
        setUnreadCounts((prev) => {
          const newCounts = new Map(prev);
          const current = newCounts.get(message.chatRoomId) || 0;
          newCounts.set(message.chatRoomId, current + 1);
          return newCounts;
        });
      }
    });

    // New message notification (when not in the room)
    socketInstance.on('chatRoom:newMessage', (data: {
      chatRoomId: string;
      message: {
        id: string;
        content: string;
        createdAt: string;
      };
    }) => {
      console.log('New message notification:', data);
      // Update unread count
      setUnreadCounts((prev) => {
        const newCounts = new Map(prev);
        const current = newCounts.get(data.chatRoomId) || 0;
        newCounts.set(data.chatRoomId, current + 1);
        return newCounts;
      });
    });

    // Messages read event
    socketInstance.on('messages:read', (data: { chatRoomId: string; readBy: string }) => {
      console.log('Messages read:', data);
      // Update message read status
      setMessages((prev) => {
        const newMessages = new Map(prev);
        const roomMessages = newMessages.get(data.chatRoomId) || [];
        const updated = roomMessages.map((msg) =>
          msg.senderId !== data.readBy && !msg.isRead
            ? { ...msg, isRead: true, readAt: new Date().toISOString() }
            : msg
        );
        newMessages.set(data.chatRoomId, updated);
        return newMessages;
      });
    });

    // Error handling
    socketInstance.on('error', (error: { message: string }) => {
      console.error('Socket error:', error);
    });

    // Cleanup on unmount
    return () => {
      socketInstance.disconnect();
      socketRef.current = null;
    };
  }, []);

  // Update token when it changes
  useEffect(() => {
    if (socket && typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      if (token) {
        socket.auth = { token };
        if (!socket.connected) {
          socket.connect();
        }
      }
    }
  }, [socket]);

  const joinChatRoom = (chatRoomId: string) => {
    if (socket && isConnected) {
      socket.emit('join:chatRoom', { chatRoomId });
      // Clear unread count when joining
      setUnreadCounts((prev) => {
        const newCounts = new Map(prev);
        newCounts.set(chatRoomId, 0);
        return newCounts;
      });
    }
  };

  const leaveChatRoom = (chatRoomId: string) => {
    if (socket && isConnected) {
      socket.emit('leave:chatRoom', { chatRoomId });
    }
  };

  const chatRoomCreatedCallbacksRef = useRef<Array<(data: { chatRoomId: string; companyId?: string; customerId?: string; bookingId?: string | null }) => void>>([]);

  // Listen for chat room created event
  useEffect(() => {
    if (socket) {
      const handleChatRoomCreated = (data: { chatRoomId: string; companyId?: string; customerId?: string; bookingId?: string | null }) => {
        console.log('Chat room created:', data);
        chatRoomCreatedCallbacksRef.current.forEach((callback) => callback(data));
      };

      socket.on('chatRoom:created', handleChatRoomCreated);

      return () => {
        socket.off('chatRoom:created', handleChatRoomCreated);
      };
    }
  }, [socket]);

  const sendMessage = (chatRoomId: string | undefined, content: string, companyId?: string, bookingId?: string | null, customerId?: string) => {
    if (socket && isConnected) {
      if (chatRoomId) {
        // Existing chat room
        socket.emit('message:send', { chatRoomId, content });
      } else if (companyId) {
        // New conversation - create chat room on first message (customer to company)
        socket.emit('message:send', { companyId, bookingId: bookingId || null, content });
      } else if (customerId) {
        // New conversation - create chat room on first message (company to customer with customerId)
        socket.emit('message:send', { customerId, bookingId: bookingId || null, content });
      } else if (bookingId) {
        // New conversation - create chat room on first message (company to customer, backend infers customerId from bookingId)
        socket.emit('message:send', { bookingId, content });
      } else {
        console.error('Either chatRoomId, companyId, customerId, or bookingId must be provided');
      }
    }
  };

  const onChatRoomCreated = (callback: (data: { chatRoomId: string; companyId?: string; customerId?: string; bookingId?: string | null }) => void) => {
    chatRoomCreatedCallbacksRef.current.push(callback);
    return () => {
      chatRoomCreatedCallbacksRef.current = chatRoomCreatedCallbacksRef.current.filter((cb) => cb !== callback);
    };
  };

  // Note: markAsRead is removed - use REST API instead via chatApi.markMessagesAsRead
  // This prevents database connection pool exhaustion

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        currentChatRoom,
        messages,
        unreadCounts,
        joinChatRoom,
        leaveChatRoom,
        sendMessage,
        onChatRoomCreated,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}


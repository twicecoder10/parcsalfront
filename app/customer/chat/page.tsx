'use client';

import { useState, useEffect, Suspense, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { chatApi, ChatRoom, Message } from '@/lib/chat-api';
import { publicApi } from '@/lib/api';
import { useSocket } from '@/lib/use-socket';
import { getStoredUser } from '@/lib/auth';
import { ChatList } from '@/components/chat/chat-list';
import { MessageList } from '@/components/chat/message-list';
import { MessageInput } from '@/components/chat/message-input';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft, Menu, Loader2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import Link from 'next/link';

function CustomerChatContent() {
  const searchParams = useSearchParams();
  const [selectedChatRoomId, setSelectedChatRoomId] = useState<string | null>(null);
  const [pendingCompanyId, setPendingCompanyId] = useState<string | null>(null);
  const [pendingBookingId, setPendingBookingId] = useState<string | null>(null);
  const [showChatList, setShowChatList] = useState(true);
  const user = getStoredUser();
  const { socket, isConnected, messages, joinChatRoom, leaveChatRoom, sendMessage: socketSendMessage, onChatRoomCreated } = useSocket();
  const queryClient = useQueryClient();
  const previousChatRoomIdRef = useRef<string | null>(null);

  // Check for companyId/bookingId/roomId in URL params (for new conversations)
  useEffect(() => {
    const companyId = searchParams.get('companyId');
    const bookingId = searchParams.get('bookingId');
    const roomId = searchParams.get('roomId');
    
    if (roomId) {
      // Direct room ID - select it immediately
      setSelectedChatRoomId(roomId);
      setPendingCompanyId(null);
      setPendingBookingId(null);
      // Clean URL
      window.history.replaceState({}, '', '/customer/chat');
    } else if (companyId) {
      setPendingCompanyId(companyId);
      setPendingBookingId(bookingId);
      // Check if chat room already exists for this company/booking
      chatApi.getChatRooms({ limit: 100 }).then((result) => {
        const existingRoom = result.data.find((room) => {
          if (room.companyId !== companyId) return false;
          if (bookingId && room.bookingId !== bookingId) return false;
          if (!bookingId && room.bookingId !== null) return false;
          return true;
        });
        
        if (existingRoom) {
          setSelectedChatRoomId(existingRoom.id);
          setPendingCompanyId(null);
          setPendingBookingId(null);
        }
        // Clean URL
        window.history.replaceState({}, '', '/customer/chat');
      }).catch(() => {
        // Ignore errors, will create room on first message
        window.history.replaceState({}, '', '/customer/chat');
      });
    }
  }, [searchParams]);

  // Listen for chat room creation
  useEffect(() => {
    if (!onChatRoomCreated) return;
    
    const unsubscribe = onChatRoomCreated((data) => {
      // Match by companyId and bookingId (if provided)
      const matchesCompany = data.companyId === pendingCompanyId;
      const matchesBooking = 
        (data.bookingId === pendingBookingId) || 
        (!data.bookingId && !pendingBookingId);
      
      if (matchesCompany && matchesBooking) {
        setSelectedChatRoomId(data.chatRoomId);
        setPendingCompanyId(null);
        setPendingBookingId(null);
        // Invalidate chat rooms to refresh list
        queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
        // Fetch messages for the new chat room
        queryClient.invalidateQueries({ queryKey: ['chatMessages', data.chatRoomId] });
      }
    });

    return unsubscribe;
  }, [onChatRoomCreated, pendingCompanyId, pendingBookingId, queryClient]);

  // Fetch chat rooms
  const { data: chatRoomsData, isLoading: isLoadingRooms } = useQuery({
    queryKey: ['chatRooms'],
    queryFn: () => chatApi.getChatRooms({ limit: 50 }),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch messages for selected chat room
  const { data: messagesData, isLoading: isLoadingMessages } = useQuery({
    queryKey: ['chatMessages', selectedChatRoomId],
    queryFn: () => {
      if (!selectedChatRoomId) throw new Error('No chat room selected');
      return chatApi.getMessages(selectedChatRoomId, { limit: 100 });
    },
    enabled: !!selectedChatRoomId,
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  // Get selected chat room details
  const selectedChatRoom = chatRoomsData?.data.find((room) => room.id === selectedChatRoomId);

  // Combine API messages with socket messages
  const allMessages = selectedChatRoomId
    ? [
        ...(messagesData?.data || []),
        ...(messages.get(selectedChatRoomId) || []),
      ]
        .filter((msg, index, self) => {
          // Remove duplicates based on message ID
          if (msg.id === '') {
            // Keep placeholder messages only if no real message with same content exists
            return !self.some((m) => m.id !== '' && m.content === msg.content && 
              Math.abs(new Date(m.createdAt).getTime() - new Date(msg.createdAt).getTime()) < 1000);
          }
          // For messages with IDs, keep only the first occurrence
          return index === self.findIndex((m) => m.id === msg.id);
        })
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    : [];

  // Join chat room when selected
  useEffect(() => {
    // Only join/leave if the chat room ID actually changed
    if (selectedChatRoomId === previousChatRoomIdRef.current) {
      return;
    }

    // Leave previous chat room if there was one
    if (previousChatRoomIdRef.current && isConnected) {
      leaveChatRoom(previousChatRoomIdRef.current);
    }

    // Join new chat room if selected and connected
    if (selectedChatRoomId && isConnected) {
      joinChatRoom(selectedChatRoomId);
      // On mobile, hide chat list when a chat is selected
      if (window.innerWidth < 768) {
        setShowChatList(false);
      }
    }

    // Update ref to current chat room ID
    previousChatRoomIdRef.current = selectedChatRoomId;

    // Cleanup: leave chat room when component unmounts or chat room changes
    return () => {
      if (selectedChatRoomId && isConnected) {
        leaveChatRoom(selectedChatRoomId);
      }
    };
  }, [selectedChatRoomId, isConnected, joinChatRoom, leaveChatRoom]);

  // Mark messages as read when chat room is selected (via REST API)
  useEffect(() => {
    if (selectedChatRoomId && messagesData?.data) {
      const unreadMessages = messagesData.data.filter(
        (msg) => !msg.isRead && msg.senderId !== user?.id
      );
      if (unreadMessages.length > 0) {
        // Mark as read via REST API (not socket to avoid DB connection pool issues)
        chatApi.markMessagesAsRead(selectedChatRoomId).catch((error) => {
          console.error('Failed to mark messages as read:', error);
        });
      }
    }
  }, [selectedChatRoomId, messagesData, user?.id]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setShowChatList(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch company info if starting new conversation
  const { data: companyInfo } = useQuery({
    queryKey: ['company', pendingCompanyId],
    queryFn: () => {
      if (!pendingCompanyId) throw new Error('No company ID');
      return publicApi.getCompanyProfile(pendingCompanyId);
    },
    enabled: !!pendingCompanyId && !selectedChatRoomId,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string): Promise<Message> => {
      // Use socket if connected
      if (isConnected && socket) {
        if (selectedChatRoomId) {
          // Existing chat room
          socketSendMessage(selectedChatRoomId, content);
        } else if (pendingCompanyId) {
          // New conversation - create chat room on first message
          socketSendMessage(undefined, content, pendingCompanyId, pendingBookingId || null);
        } else {
          throw new Error('No chat room or company selected');
        }
        
        // Return a placeholder - the real message will come via socket
        if (!user) throw new Error('User not found');
        return {
          id: '',
          chatRoomId: selectedChatRoomId || '',
          senderId: user.id,
          content,
          isRead: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      } else {
        // Fallback to REST API (requires existing chat room)
        if (!selectedChatRoomId) {
          throw new Error('Socket not connected and no existing chat room');
        }
        return chatApi.sendMessage({ chatRoomId: selectedChatRoomId, content });
      }
    },
    onSuccess: () => {
      // Invalidate messages query to refetch
      if (selectedChatRoomId) {
        queryClient.invalidateQueries({ queryKey: ['chatMessages', selectedChatRoomId] });
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send message');
    },
  });

  const handleSendMessage = (content: string) => {
    sendMessageMutation.mutate(content);
  };

  if (!user) {
    return <div>Please log in to access chat</div>;
  }

  const handleBackToList = () => {
    setSelectedChatRoomId(null);
    setShowChatList(true);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header - Desktop only, Mobile shows in chat header */}
      <div className="hidden md:block mb-4 pb-4 border-b">
        <h1 className="text-2xl font-bold">Messages</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {isConnected ? (
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Connected
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
              Connecting...
            </span>
          )}
        </p>
      </div>

      <div className="flex-1 flex rounded-lg overflow-hidden bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800 min-h-0">
        {/* Chat List - Full screen on mobile, sidebar on desktop */}
        <div
          className={`
            ${showChatList || !selectedChatRoomId ? 'flex' : 'hidden md:flex'}
            md:flex flex-col
            w-full md:w-80 lg:w-96
            border-r-0 md:border-r border-gray-200 dark:border-gray-800
            bg-white dark:bg-gray-900
            flex-shrink-0
          `}
        >
          {isLoadingRooms ? (
            <div className="p-4 text-center flex items-center justify-center flex-1">
              <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
            </div>
          ) : (
            <ChatList
              chatRooms={chatRoomsData?.data || []}
              selectedChatRoomId={selectedChatRoomId || undefined}
              onSelectChatRoom={(id) => {
                setSelectedChatRoomId(id);
                setShowChatList(false);
              }}
            />
          )}
        </div>

        {/* Chat Window - Full screen on mobile when chat selected */}
        <div className={`
          ${!showChatList && selectedChatRoomId ? 'flex' : 'hidden md:flex'}
          md:flex flex-col flex-1 min-w-0 bg-gray-50 dark:bg-gray-900
        `}>
          {selectedChatRoom || pendingCompanyId ? (
            <>
              {/* Chat Header */}
              <div className="px-3 py-3 md:px-4 md:py-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3 bg-white dark:bg-gray-900">
                {/* Back button for mobile */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBackToList}
                  className="md:hidden flex-shrink-0"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                {(selectedChatRoom?.company.logoUrl || companyInfo?.logoUrl) ? (
                  <Image
                    src={(selectedChatRoom?.company.logoUrl || companyInfo?.logoUrl)!}
                    alt={(selectedChatRoom?.company.name || companyInfo?.name)!}
                    width={44}
                    height={44}
                    className="rounded-full object-cover flex-shrink-0 w-10 h-10 md:w-11 md:h-11"
                  />
                ) : (
                  <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-base md:text-lg">
                      {(selectedChatRoom?.company.name || companyInfo?.name || 'C').charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold text-sm md:text-base truncate">
                    {selectedChatRoom?.company.name || companyInfo?.name}
                  </h2>
                  {(selectedChatRoom?.booking || pendingBookingId) && (
                    <Link 
                      href={`/customer/bookings/${selectedChatRoom?.bookingId || selectedChatRoom?.booking?.id || pendingBookingId}`}
                      className="text-xs text-gray-500 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 truncate transition-colors block"
                    >
                      Booking #{(selectedChatRoom?.bookingId || selectedChatRoom?.booking?.id || pendingBookingId || '').slice(0, 8)}
                    </Link>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 min-h-0 overflow-hidden">
                {selectedChatRoomId ? (
                  <MessageList
                    messages={allMessages}
                    currentUser={user}
                    chatRoomId={selectedChatRoomId}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400 p-4">
                    <p className="text-center text-sm">Start the conversation by sending a message</p>
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="bg-white dark:bg-gray-900">
                <MessageInput
                  onSendMessage={handleSendMessage}
                  disabled={!isConnected || sendMessageMutation.isPending}
                  placeholder={selectedChatRoomId ? 'Type a message...' : 'Send your first message...'}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400 p-4">
              <div className="text-center">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="h-8 w-8 md:h-10 md:w-10 text-gray-400" />
                </div>
                <p className="text-base md:text-lg font-medium mb-2">No conversation selected</p>
                <p className="text-xs md:text-sm text-gray-400">Choose a conversation from the list to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CustomerChatPage() {
  return (
    <Suspense fallback={
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-600 mx-auto mb-4" />
          <p className="text-sm text-gray-600">Loading chat...</p>
        </div>
      </div>
    }>
      <CustomerChatContent />
    </Suspense>
  );
}


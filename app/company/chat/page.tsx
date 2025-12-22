'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { chatApi, ChatRoom, Message } from '@/lib/chat-api';
import { useSocket } from '@/lib/use-socket';
import { getStoredUser } from '@/lib/auth';
import { usePermissions, canPerformAction } from '@/lib/permissions';
import { ChatList } from '@/components/chat/chat-list';
import { MessageList } from '@/components/chat/message-list';
import { MessageInput } from '@/components/chat/message-input';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Menu, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';

export default function CompanyChatPage() {
  const searchParams = useSearchParams();
  const [selectedChatRoomId, setSelectedChatRoomId] = useState<string | null>(null);
  const [pendingBookingId, setPendingBookingId] = useState<string | null>(null);
  const [pendingCustomerId, setPendingCustomerId] = useState<string | null>(null);
  const [showChatList, setShowChatList] = useState(true);
  const user = getStoredUser();
  const permissions = usePermissions();
  const { socket, isConnected, messages, joinChatRoom, leaveChatRoom, sendMessage: socketSendMessage, onChatRoomCreated } = useSocket();
  const queryClient = useQueryClient();
  const previousChatRoomIdRef = useRef<string | null>(null);
  
  // Check permissions
  const canViewMessages = canPerformAction(permissions, 'viewMessages');
  const canReplyToMessage = canPerformAction(permissions, 'replyToMessage');

  // Check for bookingId, customerId, or roomId in URL params
  useEffect(() => {
    const bookingId = searchParams.get('bookingId');
    const customerId = searchParams.get('customerId');
    const roomId = searchParams.get('roomId');
    
    if (roomId) {
      // Direct room ID - select it immediately
      setSelectedChatRoomId(roomId);
      setPendingBookingId(null);
      setPendingCustomerId(null);
      // Clean URL
      window.history.replaceState({}, '', '/company/chat');
    } else if (bookingId) {
      // Find chat room for this booking
      chatApi.getChatRooms({ limit: 100 }).then((result) => {
        const existingRoom = result.data.find((room) => room.bookingId === bookingId);
        
        if (existingRoom) {
          setSelectedChatRoomId(existingRoom.id);
          setPendingBookingId(null);
          setPendingCustomerId(null);
        } else {
          // No room exists - set up pending state to create one on first message
          setPendingBookingId(bookingId);
          setPendingCustomerId(customerId);
        }
        // Clean URL
        window.history.replaceState({}, '', '/company/chat');
      }).catch(() => {
        // Ignore errors, set up pending state anyway
        setPendingBookingId(bookingId);
        setPendingCustomerId(customerId);
        window.history.replaceState({}, '', '/company/chat');
      });
    }
  }, [searchParams]);

  // Listen for chat room creation
  useEffect(() => {
    if (!onChatRoomCreated) return;
    
    const unsubscribe = onChatRoomCreated((data) => {
      // Match by customerId and bookingId (as per guide)
      const matchesCustomer = !pendingCustomerId || data.customerId === pendingCustomerId;
      const matchesBooking = data.bookingId === pendingBookingId;
      
      if (matchesCustomer && matchesBooking && pendingBookingId) {
        setSelectedChatRoomId(data.chatRoomId);
        setPendingBookingId(null);
        setPendingCustomerId(null);
        // Invalidate chat rooms to refresh list
        queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
        // Fetch messages for the new chat room
        queryClient.invalidateQueries({ queryKey: ['chatMessages', data.chatRoomId] });
      }
    });

    return unsubscribe;
  }, [onChatRoomCreated, pendingBookingId, pendingCustomerId, queryClient]);

  // Fetch chat rooms (only if user can view messages)
  const { data: chatRoomsData, isLoading: isLoadingRooms } = useQuery({
    queryKey: ['chatRooms'],
    queryFn: () => chatApi.getChatRooms({ limit: 50 }),
    refetchInterval: 30000, // Refetch every 30 seconds
    enabled: canViewMessages,
  });

  // Fetch messages for selected chat room (only if user can view messages)
  const { data: messagesData, isLoading: isLoadingMessages } = useQuery({
    queryKey: ['chatMessages', selectedChatRoomId],
    queryFn: () => {
      if (!selectedChatRoomId) throw new Error('No chat room selected');
      return chatApi.getMessages(selectedChatRoomId, { limit: 100 });
    },
    enabled: !!selectedChatRoomId && canViewMessages,
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
  }, [selectedChatRoomId, isConnected]);

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

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string): Promise<Message> => {
      // Use socket if connected
      if (isConnected && socket) {
        if (selectedChatRoomId) {
          // Existing chat room
          socketSendMessage(selectedChatRoomId, content);
        } else if (pendingBookingId) {
          // New conversation - create chat room on first message
          // Pass customerId if available, otherwise backend will infer from bookingId
          socketSendMessage(undefined, content, undefined, pendingBookingId, pendingCustomerId || undefined);
        } else {
          throw new Error('No chat room or booking selected');
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
          // Try to create room via REST API if we have pending booking
          if (pendingBookingId && user?.companyId) {
            try {
              const newRoom = await chatApi.createChatRoom({
                companyId: user.companyId,
                bookingId: pendingBookingId,
              });
              setSelectedChatRoomId(newRoom.id);
              setPendingBookingId(null);
              setPendingCustomerId(null);
              return await chatApi.sendMessage({ chatRoomId: newRoom.id, content });
            } catch (error: any) {
              console.error('Failed to create chat room or send message:', error);
              const errorMessage = error?.response?.data?.message || error?.message || 'Failed to create chat room or send message';
              throw new Error(errorMessage);
            }
          }
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
      // Invalidate chat rooms to refresh list (in case we created a new room)
      queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
    },
    onError: (error: any) => {
      console.error('Send message error:', error);
      const errorMessage = error?.message || error?.response?.data?.message || 'Failed to send message';
      toast.error(errorMessage);
    },
  });

  const handleSendMessage = (content: string) => {
    if (!canReplyToMessage) {
      toast.error('You do not have permission to reply to messages');
      return;
    }
    sendMessageMutation.mutate(content);
  };

  if (!user) {
    return <div>Please log in to access chat</div>;
  }

  // Show permission error if user cannot view messages
  if (!canViewMessages) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="text-center p-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg max-w-md">
          <AlertCircle className="h-12 w-12 text-red-600 dark:text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-900 dark:text-red-100 mb-2">
            Access Restricted
          </h2>
          <p className="text-red-700 dark:text-red-300">
            You do not have permission to view messages. Please contact your administrator to grant access.
          </p>
        </div>
      </div>
    );
  }

  const handleBackToList = () => {
    setSelectedChatRoomId(null);
    setShowChatList(true);
  };

  return (
    <div className="h-[calc(100vh-8rem)] md:h-[calc(100vh-8rem)] flex flex-col">
      {/* Header - Mobile: Show menu button, Desktop: Show title */}
      <div className="mb-4 flex items-center justify-between md:block">
        <div className="flex items-center gap-2 md:block">
          {!showChatList && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToList}
              className="md:hidden"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Messages</h1>
            <p className="text-gray-600 dark:text-gray-400 text-xs md:text-sm">
              {isConnected ? 'Connected' : 'Connecting...'}
            </p>
          </div>
        </div>
        {showChatList && !selectedChatRoomId && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowChatList(!showChatList)}
            className="md:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
      </div>

      <div className="flex-1 flex border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden bg-white dark:bg-gray-900 relative">
        {/* Chat List */}
        <div
          className={`
            absolute md:relative inset-0 md:inset-auto
            w-full md:w-1/3
            border-r border-gray-200 dark:border-gray-800
            bg-white dark:bg-gray-900
            z-10 md:z-auto
            ${showChatList ? 'block' : 'hidden md:block'}
          `}
        >
          {isLoadingRooms ? (
            <div className="p-4 text-center">Loading conversations...</div>
          ) : (
            <ChatList
              chatRooms={chatRoomsData?.data || []}
              selectedChatRoomId={selectedChatRoomId || undefined}
              onSelectChatRoom={(id) => {
                setSelectedChatRoomId(id);
                // On mobile, hide chat list after selection
                if (window.innerWidth < 768) {
                  setShowChatList(false);
                }
              }}
              perspective="company"
            />
          )}
        </div>

        {/* Chat Window */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedChatRoom || pendingCustomerId ? (
            <>
              {/* Chat Header */}
              <div className="p-3 md:p-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2 md:gap-3">
                {/* Back button for mobile */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToList}
                  className="md:hidden -ml-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                {selectedChatRoom?.customer && (
                  <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold flex-shrink-0 text-sm">
                    {selectedChatRoom.customer.fullName.charAt(0).toUpperCase()}
                  </div>
                )}
                {pendingCustomerId && !selectedChatRoom && (
                  <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold flex-shrink-0 text-sm">
                    C
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold text-sm md:text-base truncate">
                    {selectedChatRoom?.customer?.fullName || 'Customer'}
                  </h2>
                  {selectedChatRoom?.booking && (
                    <Link 
                      href={`/company/bookings/${selectedChatRoom.bookingId || selectedChatRoom.booking.id}`}
                      className="text-xs md:text-sm text-gray-500 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 truncate transition-colors"
                    >
                      Booking #{(selectedChatRoom.bookingId || selectedChatRoom.booking.id).slice(0, 8)}
                    </Link>
                  )}
                  {pendingBookingId && !selectedChatRoom && (
                    <Link 
                      href={`/company/bookings/${pendingBookingId}`}
                      className="text-xs md:text-sm text-gray-500 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 truncate transition-colors"
                    >
                      Booking #{pendingBookingId.slice(0, 8)}
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
                    <p className="text-center">Start the conversation by sending a message</p>
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="border-t border-gray-200 dark:border-gray-800">
                <MessageInput
                  onSendMessage={handleSendMessage}
                  disabled={(!isConnected && !pendingBookingId) || sendMessageMutation.isPending || !canReplyToMessage}
                  placeholder={!canReplyToMessage ? 'You do not have permission to reply to messages' : pendingBookingId ? 'Send your first message...' : 'Type a message...'}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400 p-4">
              <div className="text-center">
                <p className="text-base md:text-lg mb-2">Select a conversation to start messaging</p>
                <p className="text-xs md:text-sm">Messages from customers will appear here</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


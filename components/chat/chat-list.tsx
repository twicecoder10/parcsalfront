'use client';

import { ChatRoom } from '@/lib/chat-api';
import { useSocket } from '@/lib/use-socket';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';

interface ChatListProps {
  chatRooms: ChatRoom[];
  selectedChatRoomId?: string;
  onSelectChatRoom: (chatRoomId: string) => void;
  perspective?: 'company' | 'customer'; // 'company' shows customer info, 'customer' shows company info
}

export function ChatList({ chatRooms, selectedChatRoomId, onSelectChatRoom, perspective = 'customer' }: ChatListProps) {
  const { unreadCounts } = useSocket();

  const getLastMessage = (chatRoom: ChatRoom) => {
    if (chatRoom.messages && chatRoom.messages.length > 0) {
      return chatRoom.messages[0];
    }
    return null;
  };

  const getUnreadCount = (chatRoomId: string) => {
    return unreadCounts.get(chatRoomId) || 0;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 md:p-4 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
        <h2 className="text-base md:text-lg font-semibold">Conversations</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 md:hidden">
          {chatRooms.length} {chatRooms.length === 1 ? 'chat' : 'chats'}
        </p>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0">
        {chatRooms.length === 0 ? (
          <div className="flex items-center justify-center h-full p-4 text-center text-gray-500 dark:text-gray-400">
            <div>
              <p className="text-sm mb-2">No conversations yet</p>
              <p className="text-xs">Start chatting with a company about your booking</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {chatRooms.map((chatRoom) => {
              const lastMessage = getLastMessage(chatRoom);
              const unreadCount = getUnreadCount(chatRoom.id);
              const isSelected = selectedChatRoomId === chatRoom.id;

              // Determine what to display based on perspective
              const displayInfo = perspective === 'company' 
                ? {
                    name: chatRoom.customer?.fullName || 'Customer',
                    avatar: null, // Customers don't have logoUrl, use initial
                    initial: chatRoom.customer?.fullName?.charAt(0).toUpperCase() || 'C',
                  }
                : {
                    name: chatRoom.company.name,
                    avatar: chatRoom.company.logoUrl,
                    initial: chatRoom.company.name.charAt(0).toUpperCase(),
                  };

              return (
                <button
                  key={chatRoom.id}
                  onClick={() => onSelectChatRoom(chatRoom.id)}
                  className={`w-full p-3 md:p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors active:bg-gray-100 dark:active:bg-gray-700 ${
                    isSelected ? 'bg-orange-50 dark:bg-gray-800 border-l-4 border-orange-500' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative flex-shrink-0">
                      {displayInfo.avatar ? (
                        <Image
                          src={displayInfo.avatar}
                          alt={displayInfo.name}
                          width={48}
                          height={48}
                          className="rounded-full object-cover w-11 h-11 md:w-12 md:h-12"
                        />
                      ) : (
                        <div className="w-11 h-11 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center">
                          <span className="font-semibold text-base">
                            {displayInfo.initial}
                          </span>
                        </div>
                      )}
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold shadow-sm">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`font-semibold text-sm truncate ${isSelected ? 'text-orange-600' : ''}`}>
                          {displayInfo.name}
                        </h3>
                        {lastMessage && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                            {formatDistanceToNow(new Date(lastMessage.createdAt), { addSuffix: true })}
                          </span>
                        )}
                      </div>
                      {lastMessage ? (
                        <p className={`text-xs md:text-sm truncate ${unreadCount > 0 ? 'text-gray-900 dark:text-gray-100 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                          {lastMessage.content}
                        </p>
                      ) : (
                        <p className="text-xs md:text-sm text-gray-400 dark:text-gray-500 italic">
                          No messages yet
                        </p>
                      )}
                      {chatRoom.booking && (
                        <span className="inline-block mt-1.5 text-xs text-orange-600 dark:text-orange-400 font-medium">
                          Booking #{chatRoom.booking.id.slice(0, 8)}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}


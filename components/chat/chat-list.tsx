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
    <div className="flex flex-col h-full border-r border-gray-200 dark:border-gray-800">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-lg font-semibold">Messages</h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {chatRooms.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            <p>No conversations yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
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
                  className={`w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                    isSelected ? 'bg-gray-100 dark:bg-gray-800' : ''
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
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center">
                          <span className="font-semibold">
                            {displayInfo.initial}
                          </span>
                        </div>
                      )}
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-sm truncate">
                          {displayInfo.name}
                        </h3>
                        {lastMessage && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                            {formatDistanceToNow(new Date(lastMessage.createdAt), { addSuffix: true })}
                          </span>
                        )}
                      </div>
                      {lastMessage ? (
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {lastMessage.content}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                          No messages yet
                        </p>
                      )}
                      {chatRoom.booking && (
                        <span className="inline-block mt-1 text-xs text-blue-600 dark:text-blue-400">
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


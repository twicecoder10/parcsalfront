'use client';

import { Message, chatApi } from '@/lib/chat-api';
import { format } from 'date-fns';
import { User } from '@/lib/api';
import { useEffect, useRef } from 'react';

interface MessageListProps {
  messages: Message[];
  currentUser: User;
  chatRoomId: string;
}

export function MessageList({ messages, currentUser, chatRoomId }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasMarkedAsReadRef = useRef<string | null>(null);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Reset ref when chat room changes
    if (hasMarkedAsReadRef.current !== chatRoomId) {
      hasMarkedAsReadRef.current = null;
    }
  }, [chatRoomId]);

  useEffect(() => {
    // Mark messages as read when viewing (via REST API to avoid DB connection pool issues)
    if (messages.length > 0 && chatRoomId && hasMarkedAsReadRef.current !== chatRoomId) {
      const unreadMessages = messages.filter(
        (msg) => !msg.isRead && msg.senderId !== currentUser.id
      );
      if (unreadMessages.length > 0) {
        hasMarkedAsReadRef.current = chatRoomId;
        chatApi.markMessagesAsRead(chatRoomId)
          .then(() => {
            // Successfully marked as read
          })
          .catch((error) => {
            console.error('Failed to mark messages as read:', error);
            // Reset ref to allow retry
            if (hasMarkedAsReadRef.current === chatRoomId) {
              hasMarkedAsReadRef.current = null;
            }
          });
      } else {
        // No unread messages, mark as processed
        hasMarkedAsReadRef.current = chatRoomId;
      }
    }
  }, [messages, currentUser.id, chatRoomId]);

  const isOwnMessage = (message: Message) => {
    return message.senderId === currentUser.id;
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
          <p>No messages yet. Start the conversation!</p>
        </div>
      ) : (
        messages.map((message) => {
          const isOwn = isOwnMessage(message);
          const messageDate = new Date(message.createdAt);
          const showDate = true; // You can add logic to show date only for new days

          return (
            <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex flex-col max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
                {!isOwn && message.sender && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {message.sender.fullName}
                  </span>
                )}
                <div
                  className={`rounded-lg px-4 py-2 ${
                    isOwn
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {format(messageDate, 'HH:mm')}
                  </span>
                  {isOwn && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {message.isRead ? 'seen' : 'sent'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}


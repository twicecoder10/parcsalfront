'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Check, CheckCheck, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { customerApi } from '@/lib/customer-api';
import { companyApi } from '@/lib/company-api';
import { getStoredUser } from '@/lib/auth';
import { Notification } from '@/lib/api-types';
import { formatDistanceToNow } from 'date-fns';
import { useSocket } from '@/lib/use-socket';

interface NotificationDropdownProps {
  userRole: 'CUSTOMER' | 'COMPANY_ADMIN' | 'COMPANY_STAFF';
}

export function NotificationDropdown({ userRole }: NotificationDropdownProps) {
  const router = useRouter();
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const isCustomer = userRole === 'CUSTOMER';
  const api = isCustomer ? customerApi : companyApi;

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await api.getNotifications({ limit: 5, unreadOnly: false });
      setNotifications(response.data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }, [api]);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const count = await api.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }, [api]);

  // Real-time Socket.IO listeners for notifications
  useEffect(() => {
    if (!socket) return;

    // Handle new notification
    const handleNewNotification = (notification: Notification) => {
      setNotifications((prev) => {
        // Check if notification already exists (avoid duplicates)
        if (prev.some((n) => n.id === notification.id)) {
          return prev;
        }
        // Add new notification to the top of the list
        return [notification, ...prev];
      });
    };

    // Handle notification updated (e.g., marked as read)
    const handleNotificationUpdate = (notification: Notification) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? notification : n))
      );
    };

    // Handle notification deleted
    const handleNotificationDelete = ({ id }: { id: string }) => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    };

    // Handle unread count update
    const handleUnreadCount = ({ count }: { count: number }) => {
      setUnreadCount(count);
    };

    // Register event listeners
    socket.on('notification:new', handleNewNotification);
    socket.on('notification:updated', handleNotificationUpdate);
    socket.on('notification:deleted', handleNotificationDelete);
    socket.on('notification:unreadCount', handleUnreadCount);

    // Cleanup listeners on unmount or socket change
    return () => {
      socket.off('notification:new', handleNewNotification);
      socket.off('notification:updated', handleNotificationUpdate);
      socket.off('notification:deleted', handleNotificationDelete);
      socket.off('notification:unreadCount', handleUnreadCount);
    };
  }, [socket]);

  // Reduced polling frequency (5 minutes instead of 30 seconds)
  // Real-time updates via Socket.IO handle instant notifications
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 5 * 60 * 1000); // Poll every 5 minutes as fallback

    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open, fetchNotifications]);

  const handleMarkAsRead = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    try {
      await api.markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.deleteNotification(notificationId);
      const notification = notifications.find((n) => n.id === notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      if (notification && !notification.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read if unread
    if (!notification.isRead) {
      api.markNotificationAsRead(notification.id).catch(console.error);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    // Navigate based on notification type and metadata
    if (notification.metadata) {
      if (notification.metadata.bookingId) {
        const basePath = isCustomer ? '/customer/bookings' : '/company/bookings';
        router.push(`${basePath}/${notification.metadata.bookingId}`);
      } else if (notification.metadata.shipmentSlotId) {
        const basePath = isCustomer ? '/customer/shipments' : '/company/shipments';
        router.push(`${basePath}/${notification.metadata.shipmentSlotId}`);
      }
    }
    setOpen(false);
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Recently';
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-orange-600 hover:bg-orange-200 transition-colors">
            <Bell className="h-5 w-5" />
          </div>
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs font-bold"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={loading}
              className="h-7 text-xs"
            >
              {loading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <>
                  <CheckCheck className="mr-1 h-3 w-3" />
                  Mark all read
                </>
              )}
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-6 text-center text-sm text-gray-500">
              No notifications
            </div>
          ) : (
            notifications.map((notification) => (
              <div key={notification.id} className="relative">
                <DropdownMenuItem
                  className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex w-full items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p
                          className={`text-sm font-medium ${
                            !notification.isRead ? 'text-gray-900' : 'text-gray-600'
                          }`}
                        >
                          {notification.title}
                        </p>
                        {!notification.isRead && (
                          <span className="h-2 w-2 rounded-full bg-orange-600" />
                        )}
                      </div>
                      <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                        {notification.body}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => handleMarkAsRead(notification.id, e)}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => handleDelete(notification.id, e)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </DropdownMenuItem>
              </div>
            ))
          )}
        </div>
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer justify-center"
              onClick={() => {
                setOpen(false);
                const basePath = isCustomer ? '/customer' : '/company';
                router.push(`${basePath}/notifications`);
              }}
            >
              View all notifications
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


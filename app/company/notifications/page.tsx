'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCheck, Trash2, Loader2, Filter, Bell, Check } from 'lucide-react';
import { companyApi } from '@/lib/company-api';
import { Notification, NotificationType } from '@/lib/api-types';
import { formatDistanceToNow } from 'date-fns';
import { useConfirm } from '@/lib/use-confirm';
import { useSocket } from '@/lib/use-socket';

const notificationTypeLabels: Record<NotificationType, string> = {
  BOOKING_CREATED: 'Booking Created',
  BOOKING_ACCEPTED: 'Booking Accepted',
  BOOKING_REJECTED: 'Booking Rejected',
  BOOKING_CANCELLED: 'Booking Cancelled',
  BOOKING_IN_TRANSIT: 'In Transit',
  BOOKING_DELIVERED: 'Delivered',
  PAYMENT_SUCCESS: 'Payment Success',
  PAYMENT_FAILED: 'Payment Failed',
  PAYMENT_REFUNDED: 'Payment Refunded',
  SHIPMENT_PUBLISHED: 'Shipment Published',
  SHIPMENT_CLOSED: 'Shipment Closed',
  SHIPMENT_TRACKING_UPDATE: 'Tracking Update',
  TEAM_INVITATION: 'Team Invitation',
  TEAM_MEMBER_ADDED: 'Team Member Added',
  TEAM_MEMBER_REMOVED: 'Team Member Removed',
  SUBSCRIPTION_ACTIVE: 'Subscription Active',
  SUBSCRIPTION_CANCELLED: 'Subscription Cancelled',
  SUBSCRIPTION_PAST_DUE: 'Subscription Past Due',
  EXTRA_CHARGE_REQUESTED: 'Extra Charge Requested',
  EXTRA_CHARGE_PAID: 'Extra Charge Paid',
  EXTRA_CHARGE_DECLINED: 'Extra Charge Declined',
  EXTRA_CHARGE_CANCELLED: 'Extra Charge Cancelled',
  MARKETING_MESSAGE: 'Marketing Message',
};

export default function CompanyNotificationsPage() {
  const router = useRouter();
  const { confirm, ConfirmDialog } = useConfirm();
  const { socket } = useSocket();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [processing, setProcessing] = useState<string | null>(null);

  // Real-time Socket.IO listeners for notifications
  useEffect(() => {
    if (!socket) return;

    // Handle new notification
    const handleNewNotification = (notification: Notification) => {
      // Only add if it matches current filters
      if (unreadOnly && notification.isRead) return;
      if (typeFilter !== 'all' && notification.type !== typeFilter) return;
      
      setNotifications((prev) => {
        // Check if notification already exists (avoid duplicates)
        if (prev.some((n) => n.id === notification.id)) {
          return prev;
        }
        // Add new notification to the top of the list
        return [notification, ...prev].slice(0, 20); // Keep only first 20 to match page limit
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
  }, [socket, unreadOnly, typeFilter]);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await companyApi.getNotifications({
        page,
        limit: 20,
        unreadOnly,
        type: typeFilter !== 'all' ? typeFilter : undefined,
      });
      setNotifications(response.data);
      // Use totalPages if available, otherwise calculate from total and limit
      const calculatedTotalPages = response.pagination.totalPages ?? 
        Math.ceil((response.pagination.total || 0) / (response.pagination.limit || 20));
      setTotalPages(calculatedTotalPages || 1);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [page, unreadOnly, typeFilter]);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [fetchNotifications]);

  const fetchUnreadCount = async () => {
    try {
      const count = await companyApi.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    setProcessing(notificationId);
    try {
      await companyApi.markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    } finally {
      setProcessing(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    setProcessing('all');
    try {
      await companyApi.markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    } finally {
      setProcessing(null);
    }
  };

  const handleDelete = async (notificationId: string) => {
    setProcessing(notificationId);
    try {
      await companyApi.deleteNotification(notificationId);
      const notification = notifications.find((n) => n.id === notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      if (notification && !notification.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      if (notifications.length === 1 && page > 1) {
        setPage(page - 1);
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    } finally {
      setProcessing(null);
    }
  };

  const handleDeleteAllRead = async () => {
    const confirmed = await confirm({
      title: 'Delete All Read Notifications',
      description: 'Are you sure you want to delete all read notifications?',
      variant: 'destructive',
      confirmText: 'Delete All',
    });
    if (!confirmed) return;
    setProcessing('delete-all');
    try {
      await companyApi.deleteAllReadNotifications();
      await fetchNotifications();
      await fetchUnreadCount();
    } catch (error) {
      console.error('Failed to delete read notifications:', error);
    } finally {
      setProcessing(null);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }
    if (notification.metadata) {
      if (notification.metadata.bookingId) {
        router.push(`/company/bookings/${notification.metadata.bookingId}`);
      } else if (notification.metadata.shipmentSlotId) {
        router.push(`/company/shipments/${notification.metadata.shipmentSlotId}`);
      }
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Notifications</h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">Manage your notifications and stay updated</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={handleMarkAllAsRead}
              disabled={processing === 'all'}
              className="w-full sm:w-auto"
            >
              {processing === 'all' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCheck className="mr-2 h-4 w-4" />
              )}
              Mark all read
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleDeleteAllRead}
            disabled={processing === 'delete-all'}
            className="w-full sm:w-auto"
          >
            {processing === 'delete-all' ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Delete read
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <CardTitle>Filters</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="unread-only"
                checked={unreadOnly}
                onChange={(e) => {
                  setUnreadOnly(e.target.checked);
                  setPage(1);
                }}
                className="h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor="unread-only" className="text-sm font-medium">
                Unread only
              </label>
            </div>
            <Select value={typeFilter} onValueChange={(value) => { setTypeFilter(value); setPage(1); }}>
              <SelectTrigger className="w-full sm:max-w-md">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(notificationTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {unreadOnly ? 'Unread Notifications' : 'All Notifications'}
            {unreadCount > 0 && (
              <Badge variant="destructive">{unreadCount} unread</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No notifications</p>
              <p className="text-sm mt-2">
                {unreadOnly ? 'You have no unread notifications' : 'You have no notifications yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex flex-col gap-3 p-4 rounded-lg border transition-colors sm:flex-row sm:items-start sm:gap-4 ${
                    !notification.isRead
                      ? 'bg-orange-50 border-orange-200 cursor-pointer hover:bg-orange-100'
                      : 'bg-white border-gray-200 cursor-pointer hover:bg-gray-50'
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3
                        className={`text-sm font-medium ${
                          !notification.isRead ? 'text-gray-900' : 'text-gray-600'
                        }`}
                      >
                        {notification.title}
                      </h3>
                      {!notification.isRead && (
                        <span className="h-2 w-2 rounded-full bg-orange-600 flex-shrink-0" />
                      )}
                      <Badge variant="outline" className="text-xs">
                        {notificationTypeLabels[notification.type] || notification.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{notification.body}</p>
                    <p className="text-xs text-gray-400">{formatTime(notification.createdAt)}</p>
                  </div>
                  <div className="flex gap-2 sm:self-start" onClick={(e) => e.stopPropagation()}>
                    {!notification.isRead && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleMarkAsRead(notification.id)}
                        disabled={processing === notification.id}
                      >
                        {processing === notification.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDelete(notification.id)}
                      disabled={processing === notification.id}
                    >
                      {processing === notification.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && notifications.length > 0 && totalPages > 1 && (
            <div className="flex flex-col gap-3 mt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <ConfirmDialog />
    </div>
  );
}


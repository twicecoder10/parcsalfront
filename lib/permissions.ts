import { useState, useEffect } from 'react';
import { companyApi } from './company-api';
import { getStoredUser } from './auth';

export type PermissionAction =
  | 'createShipment'
  | 'updateShipment'
  | 'deleteShipment'
  | 'updateShipmentStatus'
  | 'updateShipmentTrackingStatus'
  | 'acceptBooking'
  | 'rejectBooking'
  | 'updateBookingStatus'
  | 'addProofImages'
  | 'regenerateLabel'
  | 'replyToReview'
  | 'viewAnalytics'
  | 'viewBookings'
  | 'viewShipments'
  | 'viewPayments'
  | 'viewPaymentStats'
  | 'processRefund';

export interface UserPermissions {
  restrictions: Record<PermissionAction, boolean>;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
}

/**
 * React hook to get current user's permissions
 * Returns permissions object with restrictions, isAdmin flag, loading state, and error
 */
export function usePermissions(): UserPermissions {
  const [permissions, setPermissions] = useState<{
    restrictions: Record<string, boolean>;
    isAdmin: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const user = getStoredUser();
    
    // If user is not a company user, set default permissions
    if (!user || (user.role !== 'COMPANY_ADMIN' && user.role !== 'COMPANY_STAFF' && user.role !== 'SUPER_ADMIN')) {
      setPermissions({
        restrictions: {},
        isAdmin: false,
      });
      setLoading(false);
      return;
    }

    // For admins, we can set permissions immediately without API call
    if (user.role === 'COMPANY_ADMIN' || user.role === 'SUPER_ADMIN') {
      const allActionsEnabled: Record<string, boolean> = {
        createShipment: true,
        updateShipment: true,
        deleteShipment: true,
        updateShipmentStatus: true,
        updateShipmentTrackingStatus: true,
        acceptBooking: true,
        rejectBooking: true,
        updateBookingStatus: true,
        addProofImages: true,
        regenerateLabel: true,
        replyToReview: true,
        viewAnalytics: true,
        viewBookings: true,
        viewShipments: true,
        viewPayments: true,
        viewPaymentStats: true,
        processRefund: true,
      };
      setPermissions({
        restrictions: allActionsEnabled,
        isAdmin: true,
      });
      setLoading(false);
      return;
    }

    // For staff, fetch permissions from API
    const fetchPermissions = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await companyApi.getMyRestrictions();
        setPermissions(data);
      } catch (err: any) {
        console.error('Failed to fetch permissions:', err);
        setError(err.message || 'Failed to load permissions');
        // Set default permissions on error (all enabled)
        setPermissions({
          restrictions: {
            createShipment: true,
            updateShipment: true,
            deleteShipment: true,
            updateShipmentStatus: true,
            updateShipmentTrackingStatus: true,
            acceptBooking: true,
            rejectBooking: true,
            updateBookingStatus: true,
            addProofImages: true,
            regenerateLabel: true,
            replyToReview: true,
            viewAnalytics: true,
            viewBookings: true,
            viewShipments: true,
            viewPayments: true,
            viewPaymentStats: true,
            processRefund: true,
          },
          isAdmin: false,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, []);

  // Default permissions (all enabled) while loading or if permissions is null
  const defaultRestrictions: Record<PermissionAction, boolean> = {
    createShipment: true,
    updateShipment: true,
    deleteShipment: true,
    updateShipmentStatus: true,
    updateShipmentTrackingStatus: true,
    acceptBooking: true,
    rejectBooking: true,
    updateBookingStatus: true,
    addProofImages: true,
    regenerateLabel: true,
    replyToReview: true,
    viewAnalytics: true,
    viewBookings: true,
    viewShipments: true,
    viewPayments: true,
    viewPaymentStats: true,
    processRefund: true,
  };

  return {
    restrictions: (permissions?.restrictions as Record<PermissionAction, boolean>) || defaultRestrictions,
    isAdmin: permissions?.isAdmin ?? false,
    loading,
    error,
  };
}

/**
 * Check if current user can perform a specific action
 * @param permissions - The permissions object from usePermissions hook
 * @param action - The action to check
 * @returns true if user can perform the action, false otherwise
 */
export function canPerformAction(
  permissions: UserPermissions,
  action: PermissionAction
): boolean {
  // Admins can always perform all actions
  if (permissions.isAdmin) {
    return true;
  }

  // For staff, check if the action is enabled
  return permissions.restrictions[action] !== false;
}

/**
 * Utility function to check multiple actions at once
 * @param permissions - The permissions object from usePermissions hook
 * @param actions - Array of actions to check
 * @returns Object mapping each action to whether it's allowed
 */
export function checkMultipleActions(
  permissions: UserPermissions,
  actions: PermissionAction[]
): Record<PermissionAction, boolean> {
  const result: Partial<Record<PermissionAction, boolean>> = {};
  
  actions.forEach((action) => {
    result[action] = canPerformAction(permissions, action);
  });

  return result as Record<PermissionAction, boolean>;
}


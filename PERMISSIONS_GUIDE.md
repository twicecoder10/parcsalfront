# Staff Permissions System - Frontend Guide

This guide explains how to use the permissions system to conditionally show/hide UI elements based on staff restrictions.

## Overview

The permissions system allows the frontend to:
- Fetch the current user's restrictions from the backend
- Conditionally show/hide navigation items, buttons, and other UI elements
- Provide a consistent user experience based on what actions staff can perform

## API Endpoint

**GET `/companies/me/restrictions`**

Returns the current authenticated user's restrictions:
- For **admins**: All actions are enabled (no restrictions)
- For **staff**: Returns their specific restrictions (per user)
- For **other roles**: Returns empty restrictions

**Response:**
```json
{
  "status": "success",
  "data": {
    "restrictions": {
      "createShipment": true,
      "updateShipment": false,
      "deleteShipment": true,
      // ... other actions
    },
    "isAdmin": false
  }
}
```

## Using the Permissions Hook

### Basic Usage

```tsx
import { usePermissions, canPerformAction } from '@/lib/permissions';

function MyComponent() {
  const permissions = usePermissions();

  if (permissions.loading) {
    return <div>Loading...</div>;
  }

  // Check if user can perform a specific action
  if (canPerformAction(permissions, 'createShipment')) {
    return <Button>Create Shipment</Button>;
  }

  return null;
}
```

### Conditionally Show Navigation Items

The company layout automatically filters navigation items based on permissions:

```tsx
// In app/company/layout.tsx
const permissions = usePermissions();
const navItems = getNavItems(permissions); // Only shows items user can access
```

### Conditionally Show Buttons

```tsx
function BookingActions({ bookingId }: { bookingId: string }) {
  const permissions = usePermissions();

  return (
    <div className="flex gap-2">
      {canPerformAction(permissions, 'acceptBooking') && (
        <Button onClick={handleAccept}>Accept</Button>
      )}
      {canPerformAction(permissions, 'rejectBooking') && (
        <Button onClick={handleReject}>Reject</Button>
      )}
    </div>
  );
}
```

### Disable Instead of Hide

Sometimes you may want to show a button but disable it:

```tsx
function UpdateButton() {
  const permissions = usePermissions();
  const canUpdate = canPerformAction(permissions, 'updateShipment');

  return (
    <Button
      disabled={!canUpdate}
      title={!canUpdate ? 'You do not have permission to update shipments' : ''}
    >
      Update Shipment
    </Button>
  );
}
```

## Available Actions

All restrictable actions:

- **Shipment Management:**
  - `createShipment`
  - `updateShipment`
  - `deleteShipment`
  - `updateShipmentStatus`
  - `updateShipmentTrackingStatus`

- **Booking Management:**
  - `acceptBooking`
  - `rejectBooking`
  - `updateBookingStatus`
  - `addProofImages`
  - `regenerateLabel`

- **Reviews:**
  - `replyToReview`

- **Viewing Permissions:**
  - `viewAnalytics`
  - `viewBookings`
  - `viewShipments`
  - `viewPayments`
  - `viewPaymentStats`

- **Payment Management:**
  - `processRefund`

## Permission Object Structure

```typescript
interface UserPermissions {
  restrictions: Record<PermissionAction, boolean>;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
}
```

- `restrictions`: Object mapping each action to whether it's enabled (true) or disabled (false)
- `isAdmin`: Boolean indicating if user is an admin (admins have no restrictions)
- `loading`: Boolean indicating if permissions are being fetched
- `error`: Error message if fetching permissions failed

## Best Practices

1. **Always check loading state** before using permissions
2. **Use `isAdmin` flag** to show admin-only features
3. **Hide restricted actions** rather than showing disabled buttons (better UX)
4. **Cache permissions** - the hook automatically caches and only fetches once
5. **Handle errors gracefully** - the hook provides default permissions on error

## Example: Complete Component

```tsx
'use client';

import { usePermissions, canPerformAction } from '@/lib/permissions';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export function ShipmentActions({ shipmentId }: { shipmentId: string }) {
  const permissions = usePermissions();

  if (permissions.loading) {
    return <Loader2 className="h-4 w-4 animate-spin" />;
  }

  if (permissions.error) {
    console.error('Failed to load permissions:', permissions.error);
  }

  return (
    <div className="flex gap-2">
      {canPerformAction(permissions, 'updateShipment') && (
        <Button onClick={() => handleUpdate(shipmentId)}>Edit</Button>
      )}
      {canPerformAction(permissions, 'deleteShipment') && (
        <Button variant="destructive" onClick={() => handleDelete(shipmentId)}>
          Delete
        </Button>
      )}
      {canPerformAction(permissions, 'updateShipmentStatus') && (
        <Button variant="outline" onClick={() => handleStatusChange(shipmentId)}>
          Change Status
        </Button>
      )}
    </div>
  );
}
```

## Navigation Filtering

The company layout automatically filters navigation items. Navigation items are shown/hidden based on:

- **Overview**: Always visible
- **Slots (Shipments)**: Only if `viewShipments` is enabled
- **Bookings**: Only if `viewBookings` is enabled
- **Analytics**: Only if `viewAnalytics` is enabled
- **Reviews, Payments, Subscription, Team, Warehouses, Settings**: Always visible

This ensures staff only see navigation items for features they can access.


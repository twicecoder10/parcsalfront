# Barcode Scanning Feature - Frontend Implementation

## Overview

The barcode scanning feature has been implemented in the company dashboard, allowing companies to scan shipping label barcodes to quickly retrieve booking information.

## What's Been Added

### 1. Navigation
- ✅ Added "Scan" tab to company sidebar navigation
- ✅ Icon: `ScanLine` from lucide-react
- ✅ Route: `/company/scan`

### 2. API Integration
- ✅ Added `scanBarcode()` function to `lib/company-api.ts`
- ✅ Endpoint: `POST /bookings/scan`
- ✅ Returns full booking object

### 3. Scan Page Component
- ✅ Created `/app/company/scan/page.tsx`
- ✅ Camera-based barcode scanning using `html5-qrcode`
- ✅ Manual entry option for booking IDs
- ✅ Real-time booking display
- ✅ Error handling and loading states
- ✅ Navigation to booking details

## Dependencies

### Installed
- `html5-qrcode` - For camera-based barcode scanning

## Features

### Camera Scanner
- Uses device camera (back camera preferred)
- Real-time barcode detection
- Auto-stops after successful scan
- Manual start/stop controls

### Manual Entry
- Text input for booking ID
- Enter key support
- Format: `BKG-2025-0000007`

### Results Display
- Booking ID
- Status badge
- Customer information
- Route information
- Price
- Quick navigation to full booking details

## Usage

1. Navigate to **Scan** in the company sidebar
2. Choose scanning mode:
   - **Camera**: Click "Start Camera Scanner" and point at barcode
   - **Manual**: Enter booking ID and click "Scan Barcode"
3. View results in the right panel
4. Click "View Full Booking Details" to navigate to booking page

## Error Handling

- Invalid barcode format
- Booking not found
- Booking belongs to different company
- Camera permission denied
- Network errors

All errors are displayed with clear messages to the user.

## UI Components Used

- `Button` - Actions and mode switching
- `Card` - Container for scanner and results
- `Input` - Manual barcode entry
- `Label` - Form labels
- Icons from `lucide-react`

## Styling

- Uses Tailwind CSS classes
- Consistent with existing design system
- Orange accent color for primary actions
- Responsive grid layout (2 columns on large screens)

## Testing

### Manual Testing
1. Start the dev server: `npm run dev`
2. Login as company admin/staff
3. Navigate to `/company/scan`
4. Test camera scanner with a printed label
5. Test manual entry with a booking ID
6. Verify error handling with invalid IDs

### Test Cases
- ✅ Camera scanner starts and stops correctly
- ✅ Manual entry works with valid booking IDs
- ✅ Results display correctly
- ✅ Error messages show for invalid scans
- ✅ Navigation to booking details works
- ✅ "Scan Another" resets the form

## Future Enhancements

Potential improvements:
- Scan history/log
- Batch scanning
- Print scanned booking labels
- Quick actions (accept/reject) from scan results
- Sound/vibration feedback on successful scan

## Notes

- Camera permissions are required for camera scanning
- Works best with Code128 barcodes (standard shipping label format)
- Scanner automatically stops after successful scan to prevent duplicate scans
- Manual entry is useful when camera is unavailable or barcode is damaged


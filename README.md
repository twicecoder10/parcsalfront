# Parcsal Frontend

A Next.js 14 frontend application for Parcsal, a marketplace for shipment slots.

## Tech Stack

- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **TanStack Query** (React Query) for data fetching
- **Axios** for API calls

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env.local` file:
```
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

3. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
app/
  (public)/          # Public routes (landing, pricing, auth)
  (customer)/        # Customer dashboard routes
  (company)/         # Company dashboard routes
  (admin)/           # Admin dashboard routes
components/          # Reusable components
lib/                 # Utilities and API clients
```

## Features

### Public Pages
- Landing page with hero, search, and features
- Pricing page with plan comparison
- Authentication (login, register customer, register company)

### Customer Dashboard
- Browse available shipments
- View shipment details and book slots
- Manage bookings and track status
- Account settings

### Company Dashboard
- Overview with KPIs and charts
- Create and manage shipment slots
- Handle booking requests
- Subscription management
- Team management
- Company settings

### Admin Dashboard
- Platform overview and statistics
- Manage companies (verify, deactivate)
- Manage users
- View all shipments and bookings

## Role-Based Access

The application implements role-based access control:

- **CUSTOMER**: Access to customer dashboard only
- **COMPANY_ADMIN**: Access to company dashboard with full permissions
- **COMPANY_STAFF**: Access to company dashboard with limited permissions
- **SUPER_ADMIN**: Access to admin dashboard

## API Integration

API utilities are set up in `lib/api.ts`. Currently using mock data - replace with actual API endpoints when backend is ready.

Authentication tokens are stored in localStorage and automatically added to API requests via axios interceptors.

## Styling

Primary color is **orange** (Tailwind's `orange-500`/`orange-600`) used for:
- Primary buttons and CTAs
- Brand elements
- Active states

## Next Steps

1. Wire up API endpoints when backend is ready
2. Implement actual data fetching with React Query
3. Add form validation
4. Implement payment integration
5. Add chart visualizations (using recharts)
6. Add error boundaries
7. Add loading states and skeletons


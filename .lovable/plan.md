# Show driver profile on the booking page

Right now `/book/$tripId` only shows the driver's name and vehicle as a single line of text. Passengers can't see who they're about to ride with until after they complete the booking.

## What to build

Add a "Your driver" card to the left column of `src/routes/book.$tripId.tsx`, above (or below) the trip summary, showing:

- Driver photo (first photo, fallback to initial)
- Full name + link to full `/driver/$driverId` profile
- Vehicle name + plate number badge
- Star rating + review count (if any)
- Up to 2 most recent reviews (collapsed snippet)
- "View full profile" button → `/driver/$driverId`

Visual style matches the existing trip-summary card (same `rounded-2xl border bg-card` treatment).

## How it works (technical)

Drivers table RLS only lets a user see their own row, so we can't query `drivers` directly from a passenger session. We need a SECURITY DEFINER RPC that resolves the driver from a trip ID.

1. **New migration** — add RPC `get_trip_driver_public(p_trip_id uuid) returns jsonb`:
   - Look up `trips.owner_id` for the given trip
   - Find the matching approved row in `drivers` (by `user_id`)
   - Compute rating avg/count from `ratings` and grab the 2 most recent reviews
   - Return `{ driver: { id, full_name, vehicle_name, plate_number, photos }, rating: { avg, count }, reviews: [...] }`
   - Returns `null` if trip has no owner or driver not approved (card simply hides)

2. **`src/routes/book.$tripId.tsx`** — add a `useQuery` that calls the new RPC keyed by `tripId`, render a new `DriverCard` component inline in the left column. Hide the card when the RPC returns null. The existing "driver_name · vehicle_name" line stays as a compact fallback when no profile exists.

No changes to seat picker, reservation flow, or WhatsApp notification.

## Files

- New migration: `get_trip_driver_public` RPC
- Edit: `src/routes/book.$tripId.tsx` (add query + driver card UI)

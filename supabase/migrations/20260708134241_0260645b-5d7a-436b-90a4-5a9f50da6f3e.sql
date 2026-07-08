
-- ============================================================
-- 1) TRIPS: hide driver_phone from anonymous visitors
-- ============================================================
-- Column-level privilege: anon cannot SELECT driver_phone directly.
REVOKE SELECT ON public.trips FROM anon;
GRANT SELECT (
  id, route, departure_time, pickup_point, total_seats, available_seats,
  vehicle_name, driver_name, price, status, owner_id, created_at, updated_at
) ON public.trips TO anon;

-- Ensure authenticated users (admins, drivers, booked customers) still see everything.
GRANT SELECT ON public.trips TO authenticated;

-- Mask driver_phone in the public listing RPC.
CREATE OR REPLACE FUNCTION public.list_upcoming_trips_public()
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(jsonb_agg(row ORDER BY row->>'departure_time'), '[]'::jsonb)
  FROM (
    SELECT jsonb_build_object(
      'id', t.id,
      'route', t.route,
      'departure_time', t.departure_time,
      'pickup_point', t.pickup_point,
      'total_seats', t.total_seats,
      'available_seats', t.available_seats,
      'vehicle_name', t.vehicle_name,
      'driver_name', t.driver_name,
      'driver_phone', NULL,
      'price', t.price,
      'status', t.status,
      'plate_number', d.plate_number,
      'rating_avg', COALESCE(r.avg, 0),
      'rating_count', COALESCE(r.count, 0)
    ) AS row
    FROM public.trips t
    LEFT JOIN public.drivers d
      ON d.user_id = t.owner_id AND d.status = 'approved'
    LEFT JOIN LATERAL (
      SELECT ROUND(AVG(stars)::numeric, 1) AS avg, COUNT(*)::int AS count
      FROM public.ratings
      WHERE driver_id = d.id
    ) r ON true
    WHERE t.status = 'scheduled'
      AND t.departure_time >= now() - interval '24 hours'
  ) s;
$$;

-- ============================================================
-- 2) PROMO_CODES: remove public read access
-- ============================================================
DROP POLICY IF EXISTS "Anyone can view active promo codes" ON public.promo_codes;
REVOKE SELECT ON public.promo_codes FROM anon;
-- apply_promo() and reserve_seats_with_promo() are SECURITY DEFINER and
-- continue to validate/redeem codes server-side.

-- ============================================================
-- 3) RATINGS: allow public read of non-sensitive fields
-- ============================================================
-- Grant column-level SELECT so raw customer_name is not exposed
-- (get_top_reviews / get_driver_public RPCs still mask names).
REVOKE SELECT ON public.ratings FROM anon;
GRANT SELECT (id, driver_id, trip_id, stars, comment, created_at)
  ON public.ratings TO anon;
GRANT SELECT (id, driver_id, trip_id, stars, comment, created_at)
  ON public.ratings TO authenticated;

CREATE POLICY "Public can view ratings"
  ON public.ratings
  FOR SELECT
  TO anon, authenticated
  USING (true);

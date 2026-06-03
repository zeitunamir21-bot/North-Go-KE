
-- 1) Bookings: link to user (optional) + status
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'confirmed';

CREATE INDEX IF NOT EXISTS bookings_user_id_idx ON public.bookings(user_id);

-- 2) RLS: authenticated users can read their own bookings
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
CREATE POLICY "Users can view their own bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 3) reserve_seats overload that records user_id
CREATE OR REPLACE FUNCTION public.reserve_seats(
  p_trip_id uuid,
  p_customer_name text,
  p_phone text,
  p_seats integer,
  p_pickup_location text,
  p_destination text,
  p_seat_numbers integer[],
  p_user_id uuid
)
RETURNS public.bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking public.bookings;
BEGIN
  v_booking := public.reserve_seats(
    p_trip_id, p_customer_name, p_phone, p_seats,
    p_pickup_location, p_destination, p_seat_numbers
  );
  IF p_user_id IS NOT NULL THEN
    UPDATE public.bookings SET user_id = p_user_id WHERE id = v_booking.id RETURNING * INTO v_booking;
  END IF;
  RETURN v_booking;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reserve_seats(uuid, text, text, integer, text, text, integer[], uuid) TO anon, authenticated;

-- 4) get_my_bookings RPC – returns user's bookings joined with trip info
CREATE OR REPLACE FUNCTION public.get_my_bookings()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RETURN '[]'::jsonb; END IF;
  RETURN COALESCE((
    SELECT jsonb_agg(jsonb_build_object(
      'id', b.id,
      'customer_name', b.customer_name,
      'phone', b.phone,
      'seats', b.seats,
      'seat_numbers', b.seat_numbers,
      'pickup_location', b.pickup_location,
      'destination', b.destination,
      'status', b.status,
      'booking_status', b.booking_status,
      'created_at', b.created_at,
      'trip', jsonb_build_object(
        'id', t.id,
        'route', t.route,
        'departure_time', t.departure_time,
        'pickup_point', t.pickup_point,
        'price', t.price,
        'driver_name', t.driver_name,
        'driver_phone', t.driver_phone,
        'vehicle_name', t.vehicle_name
      )
    ) ORDER BY t.departure_time DESC)
    FROM public.bookings b
    JOIN public.trips t ON t.id = b.trip_id
    WHERE b.user_id = v_uid
  ), '[]'::jsonb);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_bookings() TO authenticated;

-- 5) cancel_booking: owner cancels and seats are restored
CREATE OR REPLACE FUNCTION public.cancel_booking(p_booking_id uuid)
RETURNS public.bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_b public.bookings;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  SELECT * INTO v_b FROM public.bookings WHERE id = p_booking_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Booking not found'; END IF;
  IF v_b.user_id IS DISTINCT FROM v_uid THEN RAISE EXCEPTION 'Not your booking'; END IF;
  IF v_b.status = 'cancelled' THEN RETURN v_b; END IF;
  IF v_b.booking_status = 'boarded' THEN RAISE EXCEPTION 'Cannot cancel a boarded trip'; END IF;

  UPDATE public.trips
    SET available_seats = LEAST(total_seats, available_seats + v_b.seats),
        updated_at = now()
    WHERE id = v_b.trip_id;

  UPDATE public.bookings
    SET status = 'cancelled', seat_numbers = '{}', updated_at = now()
    WHERE id = p_booking_id
    RETURNING * INTO v_b;
  RETURN v_b;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cancel_booking(uuid) TO authenticated;

-- 6) Platform stats RPC (for homepage trust section)
CREATE OR REPLACE FUNCTION public.get_platform_stats()
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'passengers_served', COALESCE((SELECT SUM(seats) FROM public.bookings WHERE status <> 'cancelled'), 0),
    'completed_trips', COALESCE((SELECT COUNT(*) FROM public.trips WHERE departure_time < now()), 0),
    'approved_drivers', COALESCE((SELECT COUNT(*) FROM public.drivers WHERE status = 'approved'), 0),
    'avg_rating', COALESCE((SELECT ROUND(AVG(stars)::numeric, 1) FROM public.ratings), 0)
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_platform_stats() TO anon, authenticated;

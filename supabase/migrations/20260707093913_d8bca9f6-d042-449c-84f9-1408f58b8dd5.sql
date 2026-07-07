
-- Remove permissive direct INSERT policies; SECURITY DEFINER RPCs remain the only write path
DROP POLICY IF EXISTS "Anyone can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Anyone can create ratings" ON public.ratings;

-- New RPC: submit_rating validates that a booking exists for this driver/trip
CREATE OR REPLACE FUNCTION public.submit_rating(
  p_booking_id uuid,
  p_driver_id uuid,
  p_trip_id uuid,
  p_stars integer,
  p_comment text,
  p_customer_name text
) RETURNS public.ratings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking public.bookings;
  v_trip public.trips;
  v_driver public.drivers;
  v_rating public.ratings;
  v_uid uuid := auth.uid();
BEGIN
  IF p_stars < 1 OR p_stars > 5 THEN
    RAISE EXCEPTION 'Stars must be between 1 and 5';
  END IF;
  IF length(coalesce(p_comment, '')) > 500 THEN
    RAISE EXCEPTION 'Comment too long';
  END IF;
  IF length(trim(coalesce(p_customer_name, ''))) = 0 THEN
    RAISE EXCEPTION 'Customer name required';
  END IF;

  SELECT * INTO v_booking FROM public.bookings WHERE id = p_booking_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Booking not found'; END IF;
  IF v_booking.trip_id <> p_trip_id THEN
    RAISE EXCEPTION 'Booking does not match trip';
  END IF;
  IF v_booking.status = 'cancelled' THEN
    RAISE EXCEPTION 'Cannot rate a cancelled booking';
  END IF;

  -- If the booking is owned by a signed-in user, require it to be that user
  IF v_booking.user_id IS NOT NULL AND v_uid IS DISTINCT FROM v_booking.user_id THEN
    RAISE EXCEPTION 'Not your booking';
  END IF;

  -- Verify driver owns this trip
  SELECT * INTO v_trip FROM public.trips WHERE id = p_trip_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Trip not found'; END IF;

  SELECT * INTO v_driver FROM public.drivers
    WHERE id = p_driver_id AND user_id = v_trip.owner_id AND status = 'approved';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Driver does not match trip';
  END IF;

  INSERT INTO public.ratings (driver_id, trip_id, customer_name, stars, comment)
  VALUES (p_driver_id, p_trip_id, trim(p_customer_name), p_stars, NULLIF(trim(coalesce(p_comment, '')), ''))
  RETURNING * INTO v_rating;

  RETURN v_rating;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_rating(uuid, uuid, uuid, integer, text, text) TO anon, authenticated;

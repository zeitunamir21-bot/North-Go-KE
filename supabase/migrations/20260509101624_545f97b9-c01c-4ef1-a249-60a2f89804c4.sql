
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS seat_numbers integer[] NOT NULL DEFAULT '{}';

CREATE OR REPLACE FUNCTION public.reserve_seats(
  p_trip_id uuid,
  p_customer_name text,
  p_phone text,
  p_seats integer,
  p_pickup_location text,
  p_destination text
)
RETURNS public.bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_trip public.trips;
  v_booking public.bookings;
  v_taken integer[];
  v_assigned integer[] := '{}';
  i integer;
BEGIN
  IF p_seats < 1 OR p_seats > 10 THEN
    RAISE EXCEPTION 'Invalid seat count';
  END IF;
  IF length(trim(p_customer_name)) = 0 OR length(trim(p_phone)) = 0 THEN
    RAISE EXCEPTION 'Name and phone required';
  END IF;

  SELECT * INTO v_trip FROM public.trips WHERE id = p_trip_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Trip not found'; END IF;
  IF v_trip.available_seats < p_seats THEN
    RAISE EXCEPTION 'Not enough seats available';
  END IF;

  -- Gather already taken seat numbers for this trip
  SELECT COALESCE(array_agg(s), '{}')
    INTO v_taken
    FROM (
      SELECT unnest(seat_numbers) AS s
      FROM public.bookings
      WHERE trip_id = p_trip_id
    ) t;

  -- Pick the lowest available seat numbers
  FOR i IN 1..v_trip.total_seats LOOP
    IF NOT (i = ANY(v_taken)) THEN
      v_assigned := array_append(v_assigned, i);
      EXIT WHEN array_length(v_assigned, 1) = p_seats;
    END IF;
  END LOOP;

  IF array_length(v_assigned, 1) IS DISTINCT FROM p_seats THEN
    RAISE EXCEPTION 'Not enough seats available';
  END IF;

  UPDATE public.trips
    SET available_seats = available_seats - p_seats,
        updated_at = now()
    WHERE id = p_trip_id;

  INSERT INTO public.bookings (trip_id, customer_name, phone, seats, pickup_location, destination, seat_numbers)
  VALUES (p_trip_id, trim(p_customer_name), trim(p_phone), p_seats, trim(p_pickup_location), trim(p_destination), v_assigned)
  RETURNING * INTO v_booking;

  RETURN v_booking;
END;
$function$;

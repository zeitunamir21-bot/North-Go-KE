
-- 1) Plate number on drivers
ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS plate_number text;

-- 2) Public RPC: taken seats for a trip (so anon picker can grey out occupied seats)
CREATE OR REPLACE FUNCTION public.get_taken_seats(p_trip_id uuid)
RETURNS integer[]
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(array_agg(s ORDER BY s), '{}')::integer[]
  FROM (
    SELECT unnest(seat_numbers) AS s
    FROM public.bookings
    WHERE trip_id = p_trip_id
  ) t;
$$;

GRANT EXECUTE ON FUNCTION public.get_taken_seats(uuid) TO anon, authenticated;

-- 3) Extend reserve_seats to support explicit seat selection (backward compatible)
CREATE OR REPLACE FUNCTION public.reserve_seats(
  p_trip_id uuid,
  p_customer_name text,
  p_phone text,
  p_seats integer,
  p_pickup_location text,
  p_destination text,
  p_seat_numbers integer[] DEFAULT NULL
)
RETURNS public.bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_trip public.trips;
  v_booking public.bookings;
  v_taken integer[];
  v_assigned integer[] := '{}';
  i integer;
  v_n integer;
BEGIN
  IF p_seats < 1 OR p_seats > 10 THEN
    RAISE EXCEPTION 'Invalid seat count';
  END IF;
  IF length(trim(p_customer_name)) = 0 OR length(trim(p_phone)) = 0 THEN
    RAISE EXCEPTION 'Name and phone required';
  END IF;
  IF length(trim(p_customer_name)) > 100
     OR length(trim(p_phone)) > 20
     OR length(trim(coalesce(p_pickup_location, ''))) > 120
     OR length(trim(coalesce(p_destination, ''))) > 120 THEN
    RAISE EXCEPTION 'Input exceeds maximum allowed length';
  END IF;

  SELECT * INTO v_trip FROM public.trips WHERE id = p_trip_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Trip not found'; END IF;
  IF v_trip.available_seats < p_seats THEN
    RAISE EXCEPTION 'Not enough seats available';
  END IF;

  SELECT COALESCE(array_agg(s), '{}')
    INTO v_taken
    FROM (
      SELECT unnest(seat_numbers) AS s
      FROM public.bookings
      WHERE trip_id = p_trip_id
    ) t;

  IF p_seat_numbers IS NOT NULL AND array_length(p_seat_numbers, 1) IS NOT NULL THEN
    IF array_length(p_seat_numbers, 1) <> p_seats THEN
      RAISE EXCEPTION 'Selected seats must match seat count';
    END IF;
    FOREACH v_n IN ARRAY p_seat_numbers LOOP
      IF v_n < 1 OR v_n > v_trip.total_seats THEN
        RAISE EXCEPTION 'Seat % is out of range', v_n;
      END IF;
      IF v_n = ANY(v_taken) THEN
        RAISE EXCEPTION 'Seat % is already taken', v_n;
      END IF;
      IF v_n = ANY(v_assigned) THEN
        RAISE EXCEPTION 'Duplicate seat %', v_n;
      END IF;
      v_assigned := array_append(v_assigned, v_n);
    END LOOP;
  ELSE
    FOR i IN 1..v_trip.total_seats LOOP
      IF NOT (i = ANY(v_taken)) THEN
        v_assigned := array_append(v_assigned, i);
        EXIT WHEN array_length(v_assigned, 1) = p_seats;
      END IF;
    END LOOP;
    IF array_length(v_assigned, 1) IS DISTINCT FROM p_seats THEN
      RAISE EXCEPTION 'Not enough seats available';
    END IF;
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

-- 4) Public driver profile RPC (returns safe fields + rating aggregates + recent reviews)
CREATE OR REPLACE FUNCTION public.get_driver_public(p_driver_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_driver public.drivers;
  v_avg numeric;
  v_count integer;
  v_reviews jsonb;
  v_upcoming jsonb;
BEGIN
  SELECT * INTO v_driver FROM public.drivers WHERE id = p_driver_id AND status = 'approved';
  IF NOT FOUND THEN RETURN NULL; END IF;

  SELECT COALESCE(AVG(stars), 0), COUNT(*) INTO v_avg, v_count
  FROM public.ratings WHERE driver_id = v_driver.id;

  SELECT COALESCE(jsonb_agg(to_jsonb(r) ORDER BY r.created_at DESC), '[]'::jsonb)
  INTO v_reviews
  FROM (
    SELECT id, customer_name, stars, comment, created_at
    FROM public.ratings
    WHERE driver_id = v_driver.id
    ORDER BY created_at DESC
    LIMIT 20
  ) r;

  SELECT COALESCE(jsonb_agg(to_jsonb(t) ORDER BY t.departure_time), '[]'::jsonb)
  INTO v_upcoming
  FROM (
    SELECT id, route, departure_time, pickup_point, available_seats, total_seats, price, vehicle_name
    FROM public.trips
    WHERE owner_id = v_driver.user_id
      AND status = 'scheduled'
      AND departure_time >= now()
    ORDER BY departure_time
    LIMIT 10
  ) t;

  RETURN jsonb_build_object(
    'driver', jsonb_build_object(
      'id', v_driver.id,
      'full_name', v_driver.full_name,
      'vehicle_name', v_driver.vehicle_name,
      'plate_number', v_driver.plate_number,
      'photos', v_driver.photos
    ),
    'rating', jsonb_build_object('avg', round(v_avg, 2), 'count', v_count),
    'reviews', v_reviews,
    'upcoming_trips', v_upcoming
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_driver_public(uuid) TO anon, authenticated;

-- 5) Public top reviews RPC for landing page testimonials
CREATE OR REPLACE FUNCTION public.get_top_reviews(p_limit integer DEFAULT 6)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(jsonb_agg(row), '[]'::jsonb) FROM (
    SELECT jsonb_build_object(
      'id', r.id,
      'customer_name', r.customer_name,
      'stars', r.stars,
      'comment', r.comment,
      'created_at', r.created_at,
      'driver_id', d.id,
      'driver_name', d.full_name
    ) AS row
    FROM public.ratings r
    JOIN public.drivers d ON d.id = r.driver_id
    WHERE r.stars >= 4 AND r.comment IS NOT NULL AND length(trim(r.comment)) > 0
    ORDER BY r.created_at DESC
    LIMIT GREATEST(1, LEAST(p_limit, 24))
  ) s;
$$;

GRANT EXECUTE ON FUNCTION public.get_top_reviews(integer) TO anon, authenticated;

-- 6) Enable realtime for trips so seat availability updates broadcast
ALTER TABLE public.trips REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'trips'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.trips';
  END IF;
END $$;

-- 7) Update get_booking_details to include plate_number for the driver
CREATE OR REPLACE FUNCTION public.get_booking_details(p_booking_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
declare
  v_booking public.bookings%rowtype;
  v_trip public.trips%rowtype;
  v_driver jsonb;
  v_booking_json jsonb;
  v_trip_json jsonb;
  v_is_auth boolean := auth.uid() IS NOT NULL;
begin
  select * into v_booking from public.bookings where id = p_booking_id;
  if not found then return null; end if;
  select * into v_trip from public.trips where id = v_booking.trip_id;

  v_booking_json := to_jsonb(v_booking);
  v_trip_json := to_jsonb(v_trip);

  if not v_is_auth then
    v_booking_json := v_booking_json || jsonb_build_object(
      'phone', CASE WHEN length(v_booking.phone) > 3
                    THEN repeat('•', greatest(length(v_booking.phone) - 3, 1)) || right(v_booking.phone, 3)
                    ELSE '•••' END
    );
  end if;

  if v_trip.owner_id is not null then
    select to_jsonb(d) - 'user_id' into v_driver
    from (
      select id, full_name, photos, vehicle_name, plate_number
      from public.drivers
      where user_id = v_trip.owner_id
      limit 1
    ) d;
  end if;

  return jsonb_build_object(
    'booking', v_booking_json,
    'trip', v_trip_json,
    'driver', v_driver
  );
end;
$function$;

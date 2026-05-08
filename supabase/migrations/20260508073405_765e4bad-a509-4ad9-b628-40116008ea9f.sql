
CREATE TABLE public.trips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  route TEXT NOT NULL,
  departure_time TIMESTAMPTZ NOT NULL,
  pickup_point TEXT NOT NULL,
  total_seats INT NOT NULL DEFAULT 7,
  available_seats INT NOT NULL DEFAULT 7,
  vehicle_name TEXT NOT NULL DEFAULT 'Toyota Noah',
  driver_name TEXT NOT NULL DEFAULT 'NorthGo Driver',
  driver_phone TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 1500,
  status TEXT NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  seats INT NOT NULL DEFAULT 1,
  pickup_location TEXT NOT NULL,
  destination TEXT NOT NULL,
  booking_status TEXT NOT NULL DEFAULT 'reserved',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_trips_departure ON public.trips(departure_time);
CREATE INDEX idx_bookings_trip ON public.bookings(trip_id);

ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Trips: public can read; authenticated (owner) can write
CREATE POLICY "Anyone can view trips" ON public.trips FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert trips" ON public.trips FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update trips" ON public.trips FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete trips" ON public.trips FOR DELETE TO authenticated USING (true);

-- Bookings: anyone can create; only authenticated can read/update
CREATE POLICY "Anyone can create bookings" ON public.bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated can view bookings" ON public.bookings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can update bookings" ON public.bookings FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete bookings" ON public.bookings FOR DELETE TO authenticated USING (true);

-- Function to atomically reserve seats and create booking
CREATE OR REPLACE FUNCTION public.reserve_seats(
  p_trip_id UUID,
  p_customer_name TEXT,
  p_phone TEXT,
  p_seats INT,
  p_pickup_location TEXT,
  p_destination TEXT
) RETURNS public.bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trip public.trips;
  v_booking public.bookings;
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

  UPDATE public.trips
    SET available_seats = available_seats - p_seats,
        updated_at = now()
    WHERE id = p_trip_id;

  INSERT INTO public.bookings (trip_id, customer_name, phone, seats, pickup_location, destination)
  VALUES (p_trip_id, trim(p_customer_name), trim(p_phone), p_seats, trim(p_pickup_location), trim(p_destination))
  RETURNING * INTO v_booking;

  RETURN v_booking;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reserve_seats(UUID, TEXT, TEXT, INT, TEXT, TEXT) TO anon, authenticated;

-- Seed a few demo trips
INSERT INTO public.trips (route, departure_time, pickup_point, driver_phone, price) VALUES
('Isiolo → Nairobi', (now()::date + interval '1 day' + interval '6 hours'), 'Total Petrol Station, Isiolo', '+254712345678', 1500),
('Nairobi → Isiolo', (now()::date + interval '1 day' + interval '14 hours'), 'Eastleigh Bus Stage, Nairobi', '+254712345678', 1500),
('Isiolo → Nairobi', (now()::date + interval '2 day' + interval '6 hours'), 'Total Petrol Station, Isiolo', '+254712345678', 1500);

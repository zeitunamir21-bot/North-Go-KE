
-- Drivers table
CREATE TABLE public.drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  full_name text NOT NULL,
  phone text NOT NULL,
  vehicle_name text NOT NULL DEFAULT 'Toyota Noah',
  status text NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  created_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz
);

ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own driver application"
  ON public.drivers FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own driver row"
  ON public.drivers FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update drivers"
  ON public.drivers FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete drivers"
  ON public.drivers FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Helper: is this user an approved driver?
CREATE OR REPLACE FUNCTION public.is_approved_driver(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.drivers
    WHERE user_id = _user_id AND status = 'approved'
  )
$$;

-- Trigger: when driver row is set to approved, grant 'driver' role
CREATE OR REPLACE FUNCTION public.sync_driver_role()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    NEW.approved_at := now();
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'driver'::app_role)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_drivers_sync_role
BEFORE UPDATE ON public.drivers
FOR EACH ROW EXECUTE FUNCTION public.sync_driver_role();

-- trips: add owner_id
ALTER TABLE public.trips ADD COLUMN owner_id uuid;

-- Replace insert/update/delete policies on trips to include owner-driver
DROP POLICY IF EXISTS "Admins insert trips" ON public.trips;
DROP POLICY IF EXISTS "Admins update trips" ON public.trips;
DROP POLICY IF EXISTS "Admins delete trips" ON public.trips;

CREATE POLICY "Admins or approved drivers insert trips"
  ON public.trips FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR (is_approved_driver(auth.uid()) AND owner_id = auth.uid())
  );

CREATE POLICY "Admins or trip owner update trips"
  ON public.trips FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (is_approved_driver(auth.uid()) AND owner_id = auth.uid())
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR (is_approved_driver(auth.uid()) AND owner_id = auth.uid())
  );

CREATE POLICY "Admins or trip owner delete trips"
  ON public.trips FOR DELETE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (is_approved_driver(auth.uid()) AND owner_id = auth.uid())
  );

-- Bookings: drivers can view bookings on their trips
CREATE POLICY "Drivers view bookings on own trips"
  ON public.bookings FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.trips t
      WHERE t.id = bookings.trip_id AND t.owner_id = auth.uid()
    )
  );

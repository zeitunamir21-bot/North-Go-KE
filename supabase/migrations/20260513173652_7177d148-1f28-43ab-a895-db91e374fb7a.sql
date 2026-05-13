
-- 1. Driver photos
ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS photos text[] NOT NULL DEFAULT '{}';

-- 2. Ratings table
CREATE TABLE IF NOT EXISTS public.ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  trip_id uuid REFERENCES public.trips(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  stars integer NOT NULL CHECK (stars BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ratings_driver_idx ON public.ratings(driver_id);

ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view ratings"
  ON public.ratings FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create ratings"
  ON public.ratings FOR INSERT
  WITH CHECK (
    stars BETWEEN 1 AND 5
    AND length(trim(customer_name)) > 0
    AND length(coalesce(comment,'')) <= 500
  );

CREATE POLICY "Admins delete ratings"
  ON public.ratings FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 3. Storage bucket for driver profile photos (public read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('driver-photos', 'driver-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Public read
CREATE POLICY "Driver photos are publicly viewable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'driver-photos');

-- Driver uploads to a folder named after their user_id
CREATE POLICY "Drivers upload own photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'driver-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Drivers update own photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'driver-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Drivers delete own photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'driver-photos'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR public.has_role(auth.uid(), 'admin')
    )
  );

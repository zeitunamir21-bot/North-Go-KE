
-- Drop public read access on ratings
DROP POLICY IF EXISTS "Anyone can view ratings" ON public.ratings;

-- Allow the rater (booking creator) or admin/driver to view their own ratings; other reads via RPCs
CREATE POLICY "Admins can view ratings" ON public.ratings
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
REVOKE SELECT ON public.ratings FROM anon;

-- Name masking helper
CREATE OR REPLACE FUNCTION public.mask_name(p_name text)
RETURNS text
LANGUAGE sql IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_name IS NULL OR length(trim(p_name)) = 0 THEN 'Anonymous'
    WHEN position(' ' in trim(p_name)) = 0 THEN initcap(trim(p_name))
    ELSE initcap(split_part(trim(p_name), ' ', 1)) || ' ' ||
         upper(left(split_part(trim(p_name), ' ', 2), 1)) || '.'
  END
$$;

-- Public reviews for a driver (masked)
CREATE OR REPLACE FUNCTION public.get_driver_ratings_public(p_driver_id uuid)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(jsonb_agg(row ORDER BY row->>'created_at' DESC), '[]'::jsonb) FROM (
    SELECT jsonb_build_object(
      'id', id,
      'stars', stars,
      'comment', comment,
      'created_at', created_at,
      'customer_name', public.mask_name(customer_name)
    ) AS row
    FROM public.ratings
    WHERE driver_id = p_driver_id
  ) s;
$$;

-- Update existing public RPCs to mask names
CREATE OR REPLACE FUNCTION public.get_top_reviews(p_limit integer DEFAULT 6)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(jsonb_agg(row), '[]'::jsonb) FROM (
    SELECT jsonb_build_object(
      'id', r.id,
      'customer_name', public.mask_name(r.customer_name),
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

CREATE OR REPLACE FUNCTION public.get_driver_public(p_driver_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
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

  SELECT COALESCE(jsonb_agg(row ORDER BY row->>'created_at' DESC), '[]'::jsonb)
  INTO v_reviews
  FROM (
    SELECT jsonb_build_object(
      'id', id, 'stars', stars, 'comment', comment, 'created_at', created_at,
      'customer_name', public.mask_name(customer_name)
    ) AS row
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

CREATE OR REPLACE FUNCTION public.get_trip_driver_public(p_trip_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_owner uuid;
  v_driver public.drivers;
  v_avg numeric;
  v_count integer;
  v_reviews jsonb;
BEGIN
  SELECT owner_id INTO v_owner FROM public.trips WHERE id = p_trip_id;
  IF v_owner IS NULL THEN RETURN NULL; END IF;

  SELECT * INTO v_driver FROM public.drivers
    WHERE user_id = v_owner AND status = 'approved'
    LIMIT 1;
  IF NOT FOUND THEN RETURN NULL; END IF;

  SELECT COALESCE(AVG(stars), 0), COUNT(*) INTO v_avg, v_count
    FROM public.ratings WHERE driver_id = v_driver.id;

  SELECT COALESCE(jsonb_agg(row ORDER BY row->>'created_at' DESC), '[]'::jsonb)
  INTO v_reviews
  FROM (
    SELECT jsonb_build_object(
      'id', id, 'stars', stars, 'comment', comment, 'created_at', created_at,
      'customer_name', public.mask_name(customer_name)
    ) AS row
    FROM public.ratings
    WHERE driver_id = v_driver.id
    ORDER BY created_at DESC
    LIMIT 3
  ) r;

  RETURN jsonb_build_object(
    'driver', jsonb_build_object(
      'id', v_driver.id,
      'full_name', v_driver.full_name,
      'vehicle_name', v_driver.vehicle_name,
      'plate_number', v_driver.plate_number,
      'photos', v_driver.photos
    ),
    'rating', jsonb_build_object('avg', round(v_avg, 2), 'count', v_count),
    'reviews', v_reviews
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_driver_ratings_public(uuid) TO anon, authenticated;

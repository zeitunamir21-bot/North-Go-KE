CREATE OR REPLACE FUNCTION public.get_trip_driver_public(p_trip_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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

  SELECT COALESCE(jsonb_agg(to_jsonb(r) ORDER BY r.created_at DESC), '[]'::jsonb)
  INTO v_reviews
  FROM (
    SELECT id, customer_name, stars, comment, created_at
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
$function$;

GRANT EXECUTE ON FUNCTION public.get_trip_driver_public(uuid) TO anon, authenticated;
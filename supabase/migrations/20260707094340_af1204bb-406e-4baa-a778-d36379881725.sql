
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
      'driver_phone', t.driver_phone,
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

GRANT EXECUTE ON FUNCTION public.list_upcoming_trips_public() TO anon, authenticated;

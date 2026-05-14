
create or replace function public.get_booking_details(p_booking_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_booking public.bookings%rowtype;
  v_trip public.trips%rowtype;
  v_driver jsonb;
begin
  select * into v_booking from public.bookings where id = p_booking_id;
  if not found then
    return null;
  end if;
  select * into v_trip from public.trips where id = v_booking.trip_id;
  if v_trip.owner_id is not null then
    select to_jsonb(d) - 'user_id' into v_driver
    from (
      select id, full_name, photos
      from public.drivers
      where user_id = v_trip.owner_id
      limit 1
    ) d;
  end if;
  return jsonb_build_object(
    'booking', to_jsonb(v_booking),
    'trip', to_jsonb(v_trip),
    'driver', v_driver
  );
end;
$$;

grant execute on function public.get_booking_details(uuid) to anon, authenticated;

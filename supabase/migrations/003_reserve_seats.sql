create or replace function public.reserve_seats(
  p_flight_id uuid,
  p_bookings jsonb
)
returns table (booking_id uuid, pnr_code text, total_price numeric)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_flight public.flights%rowtype;
  v_entry jsonb;
  v_seat_id uuid;
  v_seat public.seats%rowtype;
  v_booking_id uuid;
  v_total numeric(10,2);
  v_pnr text;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;

  if p_bookings is null or jsonb_typeof(p_bookings) <> 'array' or jsonb_array_length(p_bookings) = 0 then
    raise exception 'at least one seat is required' using errcode = 'P0001';
  end if;

  if jsonb_array_length(p_bookings) > 6 then
    raise exception 'cannot book more than 6 seats at once' using errcode = 'P0001';
  end if;

  select * into v_flight
  from public.flights
  where id = p_flight_id and status = 'scheduled'
  for update;

  if not found then
    raise exception 'flight is unavailable' using errcode = 'P0001';
  end if;

  if v_flight.departs_at <= now() then
    raise exception 'flight has departed' using errcode = 'P0001';
  end if;

  for v_entry in select value from jsonb_array_elements(p_bookings) loop
    v_seat_id := (v_entry ->> 'seat_id')::uuid;

    select * into v_seat
    from public.seats
    where id = v_seat_id and flight_id = p_flight_id
    for update;

    if not found or not v_seat.is_available then
      raise exception 'seat is unavailable' using errcode = 'P0001';
    end if;

    update public.seats
    set is_available = false
    where id = v_seat_id;

    v_total := v_flight.base_price + v_seat.extra_fee;
    v_pnr := public.generate_pnr();

    insert into public.bookings (user_id, flight_id, seat_id, total_price, pnr_code)
    values (v_user_id, p_flight_id, v_seat_id, v_total, v_pnr)
    returning id into v_booking_id;

    insert into public.passengers (booking_id, full_name, passport_no, nationality, dob)
    values (
      v_booking_id,
      v_entry ->> 'full_name',
      v_entry ->> 'passport_no',
      v_entry ->> 'nationality',
      (v_entry ->> 'dob')::date
    );

    booking_id := v_booking_id;
    pnr_code := v_pnr;
    total_price := v_total;
    return next;
  end loop;
end;
$$;

grant execute on function public.reserve_seats(uuid, jsonb) to authenticated;

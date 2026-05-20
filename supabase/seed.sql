insert into public.flights (flight_no, origin, destination, departs_at, arrives_at, aircraft_type, base_price)
values
  ('AD101', 'Delhi', 'Mumbai', now() + interval '1 day 08 hours', now() + interval '1 day 10 hours 10 minutes', 'Airbus A320', 5200),
  ('AD102', 'Delhi', 'Mumbai', now() + interval '1 day 16 hours', now() + interval '1 day 18 hours 10 minutes', 'Airbus A320', 6100),
  ('AD201', 'Mumbai', 'Bengaluru', now() + interval '2 days 07 hours', now() + interval '2 days 08 hours 45 minutes', 'Boeing 737', 4800),
  ('AD202', 'Mumbai', 'Bengaluru', now() + interval '2 days 18 hours', now() + interval '2 days 19 hours 45 minutes', 'Boeing 737', 5400),
  ('AD301', 'Bengaluru', 'Chennai', now() + interval '3 days 09 hours', now() + interval '3 days 10 hours', 'ATR 72', 3200),
  ('AD302', 'Bengaluru', 'Chennai', now() + interval '3 days 20 hours', now() + interval '3 days 21 hours', 'ATR 72', 3600),
  ('AD401', 'Hyderabad', 'Delhi', now() + interval '4 days 06 hours', now() + interval '4 days 08 hours 20 minutes', 'Airbus A321', 6900),
  ('AD402', 'Hyderabad', 'Delhi', now() + interval '4 days 19 hours', now() + interval '4 days 21 hours 20 minutes', 'Airbus A321', 7400)
on conflict (flight_no) do nothing;

insert into public.seats (flight_id, seat_number, class, extra_fee)
select
  f.id,
  row_no::text || col,
  case
    when row_no <= 2 then 'first'::public.seat_class
    when row_no <= 6 then 'business'::public.seat_class
    else 'economy'::public.seat_class
  end,
  case
    when row_no <= 2 then 8500
    when row_no <= 6 then 3200
    when row_no in (7, 14) then 900
    else 0
  end
from public.flights f
cross join generate_series(1, 24) as row_no
cross join unnest(array['A', 'B', 'C', 'D', 'E', 'F']) as col
on conflict (flight_id, seat_number) do nothing;

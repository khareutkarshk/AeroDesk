create extension if not exists "pgcrypto" with schema extensions;

create type public.flight_status as enum ('scheduled', 'delayed', 'cancelled');
create type public.seat_class as enum ('economy', 'business', 'first');
create type public.booking_status as enum ('confirmed', 'rescheduled', 'cancelled');

create table public.flights (
  id uuid primary key default gen_random_uuid(),
  flight_no text not null unique check (flight_no ~ '^[A-Z]{2}[0-9]{3,4}$'),
  origin text not null check (char_length(origin) between 3 and 80),
  destination text not null check (char_length(destination) between 3 and 80),
  departs_at timestamptz not null,
  arrives_at timestamptz not null,
  aircraft_type text not null,
  status public.flight_status not null default 'scheduled',
  base_price numeric(10,2) not null check (base_price >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint flights_time_check check (arrives_at > departs_at),
  constraint flights_route_check check (origin <> destination)
);

create table public.seats (
  id uuid primary key default gen_random_uuid(),
  flight_id uuid not null references public.flights(id) on delete cascade,
  seat_number text not null check (seat_number ~ '^[0-9]{1,2}[A-F]$'),
  class public.seat_class not null,
  is_available boolean not null default true,
  extra_fee numeric(10,2) not null default 0 check (extra_fee >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (flight_id, seat_number)
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  flight_id uuid not null references public.flights(id) on delete restrict,
  seat_id uuid not null references public.seats(id) on delete restrict,
  status public.booking_status not null default 'confirmed',
  booked_at timestamptz not null default now(),
  total_price numeric(10,2) not null check (total_price >= 0),
  pnr_code text not null unique check (pnr_code ~ '^[A-Z0-9]{6}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.passengers (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 120),
  passport_no text not null check (char_length(passport_no) between 6 and 20),
  nationality text not null check (char_length(nationality) between 2 and 80),
  dob date not null check (dob < current_date),
  created_at timestamptz not null default now()
);

create table public.reschedules (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  old_flight_id uuid not null references public.flights(id) on delete restrict,
  new_flight_id uuid not null references public.flights(id) on delete restrict,
  requested_at timestamptz not null default now(),
  fee_charged numeric(10,2) not null default 0 check (fee_charged >= 0),
  constraint reschedules_flight_check check (old_flight_id <> new_flight_id)
);

create index flights_search_idx on public.flights (origin, destination, departs_at) where status = 'scheduled';
create index seats_flight_class_idx on public.seats (flight_id, class, is_available);
create index bookings_user_status_idx on public.bookings (user_id, status, booked_at desc);
create index bookings_flight_idx on public.bookings (flight_id);
create unique index bookings_active_seat_uidx on public.bookings (seat_id)
where status in ('confirmed', 'rescheduled');
create index reschedules_booking_idx on public.reschedules (booking_id, requested_at desc);

alter table public.seats replica identity full;
alter publication supabase_realtime add table public.seats;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger flights_set_updated_at before update on public.flights
for each row execute function public.set_updated_at();

create trigger seats_set_updated_at before update on public.seats
for each row execute function public.set_updated_at();

create trigger bookings_set_updated_at before update on public.bookings
for each row execute function public.set_updated_at();

create or replace function public.assert_cancel_allowed()
returns trigger
language plpgsql
as $$
declare
  departure timestamptz;
begin
  if old.status <> 'cancelled' and new.status = 'cancelled' then
    select departs_at into departure from public.flights where id = old.flight_id;
    if departure <= now() + interval '2 hours' then
      raise exception 'cancellations are blocked within 2 hours of departure'
        using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;

create trigger bookings_cancel_window before update of status on public.bookings
for each row execute function public.assert_cancel_allowed();

create or replace function public.generate_pnr()
returns text
language plpgsql
as $$
declare
  candidate text;
begin
  loop
    candidate := upper(substr(encode(extensions.gen_random_bytes(6), 'base64'), 1, 6));
    candidate := regexp_replace(candidate, '[^A-Z0-9]', '7', 'g');
    exit when not exists (select 1 from public.bookings where pnr_code = candidate);
  end loop;
  return candidate;
end;
$$;

create or replace function public.reserve_seat(
  p_flight_id uuid,
  p_seat_id uuid,
  p_passenger_full_name text,
  p_passport_no text,
  p_nationality text,
  p_dob date
)
returns table (booking_id uuid, pnr_code text, total_price numeric)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_flight public.flights%rowtype;
  v_seat public.seats%rowtype;
  v_booking_id uuid;
  v_total numeric(10,2);
  v_pnr text;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '28000';
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

  select * into v_seat
  from public.seats
  where id = p_seat_id and flight_id = p_flight_id
  for update;

  if not found or not v_seat.is_available then
    raise exception 'seat is unavailable' using errcode = 'P0001';
  end if;

  update public.seats
  set is_available = false
  where id = p_seat_id;

  v_total := v_flight.base_price + v_seat.extra_fee;
  v_pnr := public.generate_pnr();

  insert into public.bookings (user_id, flight_id, seat_id, total_price, pnr_code)
  values (v_user_id, p_flight_id, p_seat_id, v_total, v_pnr)
  returning id into v_booking_id;

  insert into public.passengers (booking_id, full_name, passport_no, nationality, dob)
  values (v_booking_id, p_passenger_full_name, p_passport_no, p_nationality, p_dob);

  return query select v_booking_id, v_pnr, v_total;
end;
$$;

create or replace function public.cancel_booking(p_booking_id uuid)
returns table (booking_id uuid, status public.booking_status)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_booking public.bookings%rowtype;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;

  select * into v_booking
  from public.bookings
  where id = p_booking_id and user_id = v_user_id
  for update;

  if not found then
    raise exception 'booking not found' using errcode = 'P0001';
  end if;

  update public.bookings
  set status = 'cancelled'
  where id = p_booking_id;

  update public.seats
  set is_available = true
  where id = v_booking.seat_id;

  return query select p_booking_id, 'cancelled'::public.booking_status;
end;
$$;

create or replace function public.reschedule_booking(
  p_booking_id uuid,
  p_new_flight_id uuid,
  p_new_seat_id uuid
)
returns table (booking_id uuid, status public.booking_status, fee_charged numeric)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_booking public.bookings%rowtype;
  v_old_flight public.flights%rowtype;
  v_new_flight public.flights%rowtype;
  v_new_seat public.seats%rowtype;
  v_fee numeric(10,2);
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;

  select * into v_booking from public.bookings
  where id = p_booking_id and user_id = v_user_id and status <> 'cancelled'
  for update;

  if not found then
    raise exception 'booking not found' using errcode = 'P0001';
  end if;

  select * into v_old_flight from public.flights where id = v_booking.flight_id;
  select * into v_new_flight from public.flights where id = p_new_flight_id and status = 'scheduled' for update;

  if not found or v_old_flight.origin <> v_new_flight.origin or v_old_flight.destination <> v_new_flight.destination then
    raise exception 'new flight must be on the same route' using errcode = 'P0001';
  end if;

  select * into v_new_seat from public.seats
  where id = p_new_seat_id and flight_id = p_new_flight_id
  for update;

  if not found or not v_new_seat.is_available then
    raise exception 'new seat is unavailable' using errcode = 'P0001';
  end if;

  v_fee := greatest((v_new_flight.base_price + v_new_seat.extra_fee) - v_booking.total_price, 0);

  update public.seats set is_available = true where id = v_booking.seat_id;
  update public.seats set is_available = false where id = p_new_seat_id;

  insert into public.reschedules (booking_id, old_flight_id, new_flight_id, fee_charged)
  values (p_booking_id, v_booking.flight_id, p_new_flight_id, v_fee);

  update public.bookings
  set flight_id = p_new_flight_id,
      seat_id = p_new_seat_id,
      total_price = v_booking.total_price + v_fee,
      status = 'rescheduled'
  where id = p_booking_id;

  return query select p_booking_id, 'rescheduled'::public.booking_status, v_fee;
end;
$$;

alter table public.flights enable row level security;
alter table public.seats enable row level security;
alter table public.bookings enable row level security;
alter table public.passengers enable row level security;
alter table public.reschedules enable row level security;

create policy "scheduled flights are readable" on public.flights
for select using (status = 'scheduled' or exists (
  select 1 from public.bookings b where b.flight_id = flights.id and b.user_id = auth.uid()
));

create policy "seats are readable for visible flights" on public.seats
for select using (exists (
  select 1 from public.flights f where f.id = seats.flight_id and f.status = 'scheduled'
));

create policy "users read own bookings" on public.bookings
for select using (user_id = auth.uid());

create policy "users read own passengers" on public.passengers
for select using (exists (
  select 1 from public.bookings b where b.id = passengers.booking_id and b.user_id = auth.uid()
));

create policy "users read own reschedules" on public.reschedules
for select using (exists (
  select 1 from public.bookings b where b.id = reschedules.booking_id and b.user_id = auth.uid()
));

grant execute on function public.reserve_seat(uuid, uuid, text, text, text, date) to authenticated;
grant execute on function public.cancel_booking(uuid) to authenticated;
grant execute on function public.reschedule_booking(uuid, uuid, uuid) to authenticated;

notify pgrst, 'reload schema';

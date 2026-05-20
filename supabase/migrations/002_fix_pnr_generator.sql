create extension if not exists "pgcrypto" with schema extensions;

create or replace function public.generate_pnr()
returns text
language plpgsql
set search_path = public, extensions
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

notify pgrst, 'reload schema';

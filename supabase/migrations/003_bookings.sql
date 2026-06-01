create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pet_id uuid not null references public.pets(id) on delete cascade,
  service_type text not null check (service_type in ('daycare', 'hotel')),
  daycare_format text check (
    daycare_format in ('hour', 'half_day', 'full_day') or daycare_format is null
  ),
  start_date date not null,
  end_date date,
  notes text,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  price_total integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger bookings_updated_at
  before update on public.bookings
  for each row execute procedure public.set_updated_at();

alter table public.bookings enable row level security;

create policy "bookings_owner_select" on public.bookings
  for select using (auth.uid() = user_id);

create policy "bookings_owner_insert" on public.bookings
  for insert with check (auth.uid() = user_id);

create policy "bookings_owner_cancel" on public.bookings
  for update using (auth.uid() = user_id and status = 'pending')
  with check (status = 'cancelled');

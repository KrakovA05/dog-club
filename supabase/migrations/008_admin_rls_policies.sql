-- Вспомогательная функция: проверить is_admin
create or replace function public.is_admin()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_admin = true
  );
$$;

-- Вспомогательная функция: проверить is_staff или is_admin
create or replace function public.is_staff_or_admin()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and (is_admin = true or is_staff = true)
  );
$$;

-- === BOOKINGS ===
create policy "bookings_admin_select" on public.bookings
  for select using (public.is_staff_or_admin());

create policy "bookings_admin_update" on public.bookings
  for update using (public.is_admin());

-- === PROFILES ===
create policy "profiles_admin_select" on public.profiles
  for select using (public.is_admin());

-- === PETS ===
create policy "pets_admin_select" on public.pets
  for select using (public.is_staff_or_admin());

alter table public.profiles
  add column if not exists is_staff boolean default false;

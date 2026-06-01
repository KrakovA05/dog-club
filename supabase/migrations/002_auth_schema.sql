-- Профили пользователей (расширяет auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  is_admin boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Питомцы
create table public.pets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('dog', 'cat')),
  breed text,
  birth_year integer,
  weight_kg numeric(4,1),
  special_needs text,
  created_at timestamptz default now()
);

-- RLS
alter table public.profiles enable row level security;
alter table public.pets enable row level security;

create policy "profiles_owner" on public.profiles
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "pets_owner" on public.pets
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- Автоматически создавать профиль при регистрации
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

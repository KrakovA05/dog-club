create table if not exists public.telegram_bot_users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  added_at timestamptz default now()
);

alter table public.telegram_bot_users enable row level security;

-- Только сервисный клиент (server-side) имеет доступ
create policy "Service role only"
  on public.telegram_bot_users
  using (false);

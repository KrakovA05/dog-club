alter table public.telegram_bot_users
  add column if not exists is_admin boolean default false;

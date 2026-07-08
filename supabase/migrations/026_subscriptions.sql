-- Абонементы детсада: 6 посещений (6480 ₽, 60 дней) и 12 посещений (11520 ₽,
-- 90 дней), посещение = полный день. Продажа очно/по телефону, вносит админ.
--
-- Модель: subscriptions (абонемент, привязан к ВЛАДЕЛЬЦУ — любой его питомец,
-- pet_id опционален) + subscription_visits (журнал отметок, не счётчик —
-- отмена ошибочной отметки = DELETE строки).
-- Статусы: used_up ставится приложением при отметке последнего посещения;
-- expired вычисляется на лету при показе (expires_at < now), фонового джоба нет.

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  -- Зарегистрированный владелец ИЛИ гость (симметрично bookings)
  user_id uuid references public.profiles(id) on delete set null,
  guest_name text,
  guest_phone text,
  -- Опциональная пометка «на какого питомца» (не ограничение)
  pet_id uuid references public.pets(id) on delete set null,
  type text not null check (type in ('visits_6', 'visits_12')),
  total_visits integer not null check (total_visits > 0),
  price integer not null,          -- цена на момент покупки
  purchased_at timestamptz not null default now(),
  expires_at timestamptz not null, -- purchased_at + 60/90 дней, считает приложение
  status text not null default 'active'
    check (status in ('active', 'expired', 'used_up', 'frozen')),
  frozen_at timestamptz,
  notes text,
  created_at timestamptz default now(),
  -- Владелец обязателен: либо аккаунт, либо имя гостя.
  -- ВНИМАНИЕ: телефон гостя сознательно НЕ в констрейнте (в отличие от
  -- bookings_client_check) — при удалении аккаунта обезличивание ставит
  -- guest_name='Удалённый пользователь', guest_phone=NULL, и жёсткий
  -- констрейнт сделал бы удаление невозможным. Обязательность телефона
  -- для живых гостей обеспечивает форма админки.
  constraint subscriptions_owner_check
    check (user_id is not null or guest_name is not null)
);

create table public.subscription_visits (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions(id) on delete cascade,
  visit_date date not null default current_date,
  marked_by uuid references auth.users(id) on delete set null, -- админ, поставивший отметку
  booking_id uuid references public.bookings(id) on delete set null,
  notes text,
  created_at timestamptz default now()
);

create index subscriptions_user_idx on public.subscriptions (user_id);
create index subscription_visits_sub_idx on public.subscription_visits (subscription_id);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
alter table public.subscriptions enable row level security;
alter table public.subscription_visits enable row level security;

-- Владелец видит свои; staff/admin — все (гостевые видны только staff/admin)
create policy "subscriptions_owner_select" on public.subscriptions
  for select using (user_id = auth.uid() or public.is_staff_or_admin());

create policy "subscriptions_staff_insert" on public.subscriptions
  for insert with check (public.is_staff_or_admin());

create policy "subscriptions_staff_update" on public.subscriptions
  for update using (public.is_staff_or_admin());

create policy "subscriptions_admin_delete" on public.subscriptions
  for delete using (public.is_admin());

-- Журнал: владелец абонемента читает, пишет staff/admin, удаляет только admin
create policy "sub_visits_owner_select" on public.subscription_visits
  for select using (
    public.is_staff_or_admin()
    or exists (
      select 1 from public.subscriptions s
      where s.id = subscription_id and s.user_id = auth.uid()
    )
  );

create policy "sub_visits_staff_insert" on public.subscription_visits
  for insert with check (public.is_staff_or_admin());

create policy "sub_visits_admin_delete" on public.subscription_visits
  for delete using (public.is_admin());

-- ─── Обезличивание при удалении аккаунта (расширение функции из 025) ─────────
-- Абонементы обезличиваются как брони: user_id→NULL, имя-заглушка, pet_id→NULL.
create or replace function public.anonymize_user_bookings(target_uid uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer := 0;
begin
  -- Брони: копируем данные питомца в guest_* ДО обнуления pet_id
  -- (check bookings_client_check), см. миграцию 025.
  update public.bookings b set
    guest_name       = 'Удалённый пользователь',
    guest_phone      = null,
    guest_pet_name   = coalesce(p.name, b.guest_pet_name, 'не указано'),
    guest_pet_type   = coalesce(p.type, b.guest_pet_type, 'dog'),
    guest_pet_breed  = p.breed,
    guest_pet_weight = p.weight_kg,
    user_id          = null,
    pet_id           = null
  from public.pets p
  where b.user_id = target_uid
    and p.id = b.pet_id;

  get diagnostics v_count = row_count;

  -- Страховка: брони без строки питомца
  update public.bookings set
    guest_name     = 'Удалённый пользователь',
    guest_phone    = null,
    guest_pet_name = coalesce(guest_pet_name, 'не указано'),
    guest_pet_type = coalesce(guest_pet_type, 'dog'),
    user_id        = null,
    pet_id         = null
  where user_id = target_uid;

  -- Абонементы (миграция 026): та же схема обезличивания
  update public.subscriptions set
    guest_name  = 'Удалённый пользователь',
    guest_phone = null,
    user_id     = null,
    pet_id      = null
  where user_id = target_uid;

  return v_count;
end;
$$;

revoke all on function public.anonymize_user_bookings(uuid) from public;
revoke all on function public.anonymize_user_bookings(uuid) from anon;
revoke all on function public.anonymize_user_bookings(uuid) from authenticated;
grant execute on function public.anonymize_user_bookings(uuid) to service_role;

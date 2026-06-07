-- Вместимость по зонам (3 этажа) + жёсткая проверка занятости на уровне БД.
-- Зоны: dog_daycare (этаж 1), dog_hotel (этаж 2), cats (этаж 3 — все кошки).
-- Гарантия «без косяков»: триггер с advisory-lock не даёт подтвердить бронь сверх лимита.

-- 1. Таблица лимитов
create table public.capacity_zones (
  zone text primary key,
  label text not null,
  capacity integer not null check (capacity >= 0)
);

alter table public.capacity_zones enable row level security;

-- Читать может кто угодно (вместимость не секрет, нужна для расчёта доступности)
create policy "capacity_zones_read" on public.capacity_zones
  for select using (true);

-- Менять — только админ
create policy "capacity_zones_admin_write" on public.capacity_zones
  for all using (public.is_admin()) with check (public.is_admin());

insert into public.capacity_zones (zone, label, capacity) values
  ('dog_daycare', 'Детский сад (собаки)', 12),
  ('dog_hotel',   'Гостиница (собаки)',   12),
  ('cats',        'Кошки (этаж)',         12);

-- 2. Классификатор зоны: кошки всегда в зоне cats; собаки — по услуге
create or replace function public.booking_zone(p_service text, p_pet_type text)
returns text language sql immutable as $$
  select case
    when p_pet_type = 'cat' then 'cats'
    when p_service = 'daycare' then 'dog_daycare'
    else 'dog_hotel'
  end;
$$;

-- 3. Доступность по датам (для UI). Детсад — одна дата; гостиница — ночи [start, end).
create or replace function public.get_availability(
  p_service text,
  p_pet_type text,
  p_start date,
  p_end date
) returns table(d date, capacity integer, occupied integer, remaining integer)
language plpgsql stable security definer set search_path = public as $$
declare
  v_zone text := public.booking_zone(p_service, p_pet_type);
  v_cap integer;
  v_last date;
begin
  select c.capacity into v_cap from public.capacity_zones c where c.zone = v_zone;
  v_cap := coalesce(v_cap, 0);

  if p_service = 'daycare' then
    v_last := p_start;
  else
    v_last := coalesce(p_end, p_start + 1) - 1; -- ночи, день выезда не считаем
  end if;

  return query
  select
    gs::date,
    v_cap,
    occ.cnt::integer,
    (v_cap - occ.cnt)::integer
  from generate_series(p_start, v_last, interval '1 day') gs
  cross join lateral (
    select count(*) as cnt
    from public.bookings b
    join public.pets p on p.id = b.pet_id
    where b.status = 'confirmed'
      and public.booking_zone(b.service_type, p.type) = v_zone
      and case
            when b.service_type = 'daycare' then b.start_date = gs::date
            else gs::date >= b.start_date and gs::date < coalesce(b.end_date, b.start_date + 1)
          end
  ) occ
  order by gs;
end;
$$;

grant execute on function public.get_availability(text, text, date, date) to anon, authenticated;

-- 4. Триггер-гарант: при подтверждении брони проверяем каждую покрываемую дату.
create or replace function public.enforce_capacity()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_pet_type text;
  v_zone text;
  v_cap integer;
  v_last date;
  v_day date;
  v_count integer;
begin
  -- Место занимают только подтверждённые брони
  if NEW.status <> 'confirmed' then
    return NEW;
  end if;

  -- На UPDATE: если бронь уже была confirmed и существенные поля не менялись — не перепроверяем
  if TG_OP = 'UPDATE'
     and OLD.status = 'confirmed'
     and OLD.start_date = NEW.start_date
     and OLD.end_date is not distinct from NEW.end_date
     and OLD.pet_id = NEW.pet_id
     and OLD.service_type = NEW.service_type then
    return NEW;
  end if;

  select type into v_pet_type from public.pets where id = NEW.pet_id;
  v_zone := public.booking_zone(NEW.service_type, v_pet_type);

  select capacity into v_cap from public.capacity_zones where zone = v_zone;
  v_cap := coalesce(v_cap, 0);

  -- Сериализуем параллельные подтверждения в одной зоне (защита от гонки за последнее место)
  perform pg_advisory_xact_lock(hashtext(v_zone));

  if NEW.service_type = 'daycare' then
    v_last := NEW.start_date;
  else
    v_last := coalesce(NEW.end_date, NEW.start_date + 1) - 1;
  end if;

  for v_day in select generate_series(NEW.start_date, v_last, interval '1 day')::date loop
    select count(*) into v_count
    from public.bookings b
    join public.pets p on p.id = b.pet_id
    where b.status = 'confirmed'
      and b.id <> NEW.id
      and public.booking_zone(b.service_type, p.type) = v_zone
      and case
            when b.service_type = 'daycare' then b.start_date = v_day
            else v_day >= b.start_date and v_day < coalesce(b.end_date, b.start_date + 1)
          end;

    if v_count + 1 > v_cap then
      raise exception 'CAPACITY_FULL|%|%', to_char(v_day, 'YYYY-MM-DD'), v_zone
        using errcode = 'check_violation';
    end if;
  end loop;

  return NEW;
end;
$$;

create trigger bookings_enforce_capacity
  before insert or update on public.bookings
  for each row execute function public.enforce_capacity();

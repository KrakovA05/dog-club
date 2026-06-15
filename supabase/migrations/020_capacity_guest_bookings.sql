-- Делаем систему вместимости гость-совместимой.
-- Гостевые брони (миграция 019) имеют pet_id = NULL и хранят тип в guest_pet_type.
-- INNER JOIN с pets их отбрасывал → они не резервировали место (риск переполнения),
-- а в триггере pet_type выходил NULL → неверная зона.
-- Чиним: LEFT JOIN + COALESCE(pets.type, guest_pet_type) везде.

-- 1. Доступность на даты брони
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
    v_last := coalesce(p_end, p_start + 1) - 1;
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
    left join public.pets p on p.id = b.pet_id
    where b.status = 'confirmed'
      and public.booking_zone(b.service_type, coalesce(p.type, b.guest_pet_type)) = v_zone
      and case
            when b.service_type = 'daycare' then b.start_date = gs::date
            else gs::date >= b.start_date and gs::date < coalesce(b.end_date, b.start_date + 1)
          end
  ) occ
  order by gs;
end;
$$;

grant execute on function public.get_availability(text, text, date, date) to anon, authenticated;

-- 2. Доступность по диапазону (календарь в форме)
create or replace function public.get_range_availability(
  p_service text,
  p_pet_type text,
  p_start date,
  p_end date
) returns table(d date, capacity integer, occupied integer, remaining integer)
language plpgsql stable security definer set search_path = public as $$
declare
  v_zone text := public.booking_zone(p_service, p_pet_type);
  v_cap integer;
begin
  select c.capacity into v_cap from public.capacity_zones c where c.zone = v_zone;
  v_cap := coalesce(v_cap, 0);

  return query
  select
    gs::date,
    v_cap,
    occ.cnt::integer,
    (v_cap - occ.cnt)::integer
  from generate_series(p_start, p_end, interval '1 day') gs
  cross join lateral (
    select count(*) as cnt
    from public.bookings b
    left join public.pets p on p.id = b.pet_id
    where b.status = 'confirmed'
      and public.booking_zone(b.service_type, coalesce(p.type, b.guest_pet_type)) = v_zone
      and case
            when b.service_type = 'daycare' then b.start_date = gs::date
            else gs::date >= b.start_date and gs::date < coalesce(b.end_date, b.start_date + 1)
          end
  ) occ
  order by gs;
end;
$$;

grant execute on function public.get_range_availability(text, text, date, date) to anon, authenticated;

-- 3. Триггер-гарант: тип питомца берём из pets ИЛИ из guest_pet_type
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
  if NEW.status <> 'confirmed' then
    return NEW;
  end if;

  -- На UPDATE: если бронь уже была confirmed и существенные поля не менялись — не перепроверяем
  if TG_OP = 'UPDATE'
     and OLD.status = 'confirmed'
     and OLD.start_date = NEW.start_date
     and OLD.end_date is not distinct from NEW.end_date
     and OLD.pet_id is not distinct from NEW.pet_id
     and OLD.guest_pet_type is not distinct from NEW.guest_pet_type
     and OLD.service_type = NEW.service_type then
    return NEW;
  end if;

  -- Тип: у зарегистрированной брони — из pets, у гостевой — из guest_pet_type
  select type into v_pet_type from public.pets where id = NEW.pet_id;
  v_zone := public.booking_zone(NEW.service_type, coalesce(v_pet_type, NEW.guest_pet_type));

  select capacity into v_cap from public.capacity_zones where zone = v_zone;
  v_cap := coalesce(v_cap, 0);

  perform pg_advisory_xact_lock(hashtext(v_zone));

  if NEW.service_type = 'daycare' then
    v_last := NEW.start_date;
  else
    v_last := coalesce(NEW.end_date, NEW.start_date + 1) - 1;
  end if;

  for v_day in select generate_series(NEW.start_date, v_last, interval '1 day')::date loop
    select count(*) into v_count
    from public.bookings b
    left join public.pets p on p.id = b.pet_id
    where b.status = 'confirmed'
      and b.id <> NEW.id
      and public.booking_zone(b.service_type, coalesce(p.type, b.guest_pet_type)) = v_zone
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

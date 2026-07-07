-- Фикс удаления аккаунта (баг прода 07.2026): «Не удалось обезличить записи о бронях».
--
-- Что было не так в 022:
--  1) set_config('session_replication_role', 'replica') — service_role/postgres
--     на управляемых образах не суперюзер: «permission denied to set parameter».
--  2) триггер bookings_enforce_capacity перепроверял вместимость при ЛЮБОМ
--     UPDATE с изменением pet_id — обезличивание (pet_id → NULL) его будило.
--
-- Решение начисто, без отключения триггеров:
--  * enforce_capacity пересчитывает вместимость только когда она реально могла
--    измениться: INSERT либо UPDATE со сменой статуса/дат/типа услуги.
--    Обезличивание (pet_id/guest_* при тех же датах и статусе) — не будит.
--  * anonymize_user_bookings перед обнулением pet_id копирует кличку/тип/породу/вес
--    из pets в guest_* — check-констрейнт bookings_client_check удовлетворён.

-- ─── 1. Триггер вместимости: пересчёт только при значимых изменениях ─────────
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

  -- UPDATE без смены статуса/дат/услуги не влияет на вместимость — не пересчитываем.
  -- (Обезличивание при удалении аккаунта меняет pet_id→NULL и guest_*-поля,
  -- но тип питомца сохраняется в guest_pet_type — зона та же.)
  if TG_OP = 'UPDATE'
     and OLD.status = NEW.status
     and OLD.start_date = NEW.start_date
     and OLD.end_date is not distinct from NEW.end_date
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

-- ─── 2. Обезличивание начисто (без session_replication_role) ────────────────
-- drop: у 022-версии параметр назывался p_user — переименование требует drop
drop function if exists public.anonymize_user_bookings(uuid);

create or replace function public.anonymize_user_bookings(target_uid uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer := 0;
begin
  -- Основной путь: копируем данные питомца в guest_*-поля ДО обнуления pet_id,
  -- иначе check bookings_client_check (guest_name+guest_pet_name+guest_pet_type
  -- обязательны при user_id IS NULL) отклонит UPDATE.
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

  -- Страховка: брони пользователя без строки питомца (по констрейнту их быть
  -- не должно, но повторный вызов/битые данные не должны ронять удаление)
  update public.bookings set
    guest_name     = 'Удалённый пользователь',
    guest_phone    = null,
    guest_pet_name = coalesce(guest_pet_name, 'не указано'),
    guest_pet_type = coalesce(guest_pet_type, 'dog'),
    user_id        = null,
    pet_id         = null
  where user_id = target_uid;

  return v_count;
end;
$$;

revoke all on function public.anonymize_user_bookings(uuid) from public;
revoke all on function public.anonymize_user_bookings(uuid) from anon;
revoke all on function public.anonymize_user_bookings(uuid) from authenticated;
grant execute on function public.anonymize_user_bookings(uuid) to service_role;

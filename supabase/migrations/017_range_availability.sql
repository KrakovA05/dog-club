-- Доступность зоны по КАЖДОМУ дню диапазона (для календаря в форме брони).
-- get_availability возвращает только дни самой брони (для детсада — один день),
-- а календарю нужно показать загрузку всех дней месяца.

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

grant execute on function public.get_range_availability(text, text, date, date) to anon, authenticated;

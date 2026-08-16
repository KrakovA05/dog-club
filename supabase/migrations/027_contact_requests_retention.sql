-- Ретеншн обращений из формы «Напишите нам».
--
-- /privacy заявляет срок хранения 1 год с даты обращения — до этой миграции
-- заявки лежали вечно. Тот же класс расхождения «политика обещает, кода нет»,
-- что уже закрывали для site_errors (023) и bookings (024).
--
-- Заявка отрабатывается звонком в тот же день; год — запас на разбор споров.
-- Клиенты, дошедшие до брони, остаются в bookings со своим сроком (3 года).

do $$
begin
  begin
    perform cron.unschedule('purge-old-contact-requests');
  exception when others then null;
  end;
  perform cron.schedule(
    'purge-old-contact-requests',
    '37 3 * * 2',
    $job$delete from public.contact_requests where created_at < now() - interval '1 year'$job$
  );
exception when others then
  raise notice 'pg_cron недоступен — ретеншн contact_requests не создан: %', sqlerrm;
end $$;

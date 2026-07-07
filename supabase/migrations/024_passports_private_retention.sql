-- 152-ФЗ: бакет passports был ПУБЛИЧНЫМ — фото ветпаспортов (с ФИО владельца)
-- открывались по прямой ссылке без авторизации. Закрываем: бакет приватный,
-- выдача только через /api/passport/[petId] (проверка владельца/админа,
-- скачивание service_role-клиентом — RLS storage его не ограничивает).
-- Весь код уже ходит через этот route (админка, превью в PetForm) — прямые
-- public-URL нигде не рендерятся, только хранятся для извлечения пути.

update storage.buckets set public = false where id = 'passports';

drop policy if exists "passports_public_read" on storage.objects;
drop policy if exists "passports_owner_upload" on storage.objects;
drop policy if exists "passports_owner_delete" on storage.objects;

-- Загрузка/удаление — только авторизованным (было: без ограничения роли, т.е. anon тоже)
create policy "passports_auth_upload" on storage.objects
  for insert to authenticated with check (bucket_id = 'passports');

create policy "passports_auth_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'passports');

-- ─────────────────────────────────────────────────────────────────────────
-- Ретеншн броней: по /privacy обезличенные записи хранятся 3 года с даты
-- оказания услуги — автоматическая чистка (раньше её не было).
do $$
begin
  begin
    perform cron.unschedule('purge-old-bookings');
  exception when others then null;
  end;
  perform cron.schedule(
    'purge-old-bookings',
    '17 3 * * 1',
    $job$delete from public.bookings where coalesce(end_date, start_date) < current_date - interval '3 years'$job$
  );
exception when others then
  raise notice 'pg_cron недоступен — ретеншн броней не создан: %', sqlerrm;
end $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- Read-only проверки консистентности после миграции (аудит 07.07.2026).
-- Прогонять на self-host И на облаке (где применимо), сравнивать глазами.
--   psql "$LOCAL_DB_URL" -f audit-checks.sql
-- ═══════════════════════════════════════════════════════════════════════════
\pset pager off

\echo '═══ А. Дубли контент-таблиц ═══'
select 'prices' as tbl, label || ' / ' || service_type as key, count(*)
  from public.prices group by 2 having count(*) > 1
union all
select 'faq', question, count(*) from public.faq group by 2 having count(*) > 1;

\echo '═══ Б. capacity_zones (сравнить значения с облаком) ═══'
select * from public.capacity_zones order by zone;

\echo '═══ В. Брони: помесячная сводка (прогнать на ОБЕИХ базах, сравнить) ═══'
select date_trunc('month', start_date)::date as month, status, count(*)
from public.bookings group by 1,2 order by 1,2;

\echo '═══ Г. Сироты / рассинхрон ═══'
select 'auth.users без profiles' as check, count(*) from auth.users u
  left join public.profiles p on p.id = u.id where p.id is null
union all
select 'profiles без auth.users', count(*) from public.profiles p
  left join auth.users u on u.id = p.id where u.id is null
union all
select 'pets с несуществующим owner', count(*) from public.pets
  where owner_id not in (select id from auth.users)
union all
select 'bookings: user_id вне profiles', count(*) from public.bookings
  where user_id is not null and user_id not in (select id from public.profiles);

\echo '═══ Д. Хосты Storage-URL в данных (CLOUD! = требует 06-фикса) ═══'
select 'pets' as tbl,
       case when passport_photo_url like '%zmvoaanwikhztpvdjpty%' then 'CLOUD!'
            when passport_photo_url like 'https://db.lapaclub.ru%' then 'selfhost'
            else 'other' end as host, count(*)
from public.pets where passport_photo_url is not null group by 1,2
union all
select 'gallery',
       case when url like '%zmvoaanwikhztpvdjpty%' then 'CLOUD!'
            when url like 'https://db.lapaclub.ru%' then 'selfhost' else 'other' end, count(*)
from public.gallery group by 1,2
union all
select 'blog',
       case when cover_url like '%zmvoaanwikhztpvdjpty%' then 'CLOUD!'
            when cover_url like 'https://db.lapaclub.ru%' then 'selfhost' else 'other' end, count(*)
from public.blog_posts where cover_url is not null group by 1,2;

\echo '═══ Е. Битые ссылки на паспорта (метаданные без файла в Storage) ═══'
select p.id, p.name, p.passport_photo_url
from public.pets p
where p.passport_photo_url is not null
  and not exists (
    select 1 from storage.objects o
    where o.bucket_id = 'passports'
      and p.passport_photo_url like '%' || o.name
  );

\echo '═══ Ж. Файлы в Storage по бакетам (сравнить с облаком) ═══'
select bucket_id, count(*) as files from storage.objects group by 1 order by 1;

\echo '═══ З. telegram_bot_users (сравнить с облаком: count и chat_id) ═══'
select username, chat_id is not null as has_chat_id, is_admin
from public.telegram_bot_users order by added_at;

\echo '═══ И. cron-задачи (morning-digest на облачный URL — удалить) ═══'
select jobid, jobname, schedule, left(command, 80) as command from cron.job;

\echo '═══ К. site_errors и приватность passports (после миграций 023/024) ═══'
select to_regclass('public.site_errors') as site_errors_table,
       (select public from storage.buckets where id = 'passports') as passports_is_public;

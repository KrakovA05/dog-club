-- ═══════════════════════════════════════════════════════════════════════════
-- Лечение данных self-host ПОСЛЕ миграции с Supabase Cloud (аудит 07.07.2026).
-- Запуск на сервере:  psql "$LOCAL_DB_URL" -f 06-post-migration-fixes.sql
-- Скрипт транзакционный: в конце ROLLBACK/COMMIT по результату (см. низ файла).
-- Перед запуском рекомендуется бэкап: pg_dump --format=custom.
-- ═══════════════════════════════════════════════════════════════════════════
\set ON_ERROR_STOP on
begin;

-- ─── 1. Дубли prices/faq (сиды миграций легли раньше облачного дампа) ───────
-- Сиды получили created_at = момент прогона миграций (позже облачных строк) →
-- удаляем более ПОЗДНЮЮ строку каждой пары, облачный оригинал остаётся.
\echo '=== prices: дубли до ==='
select label, service_type, count(*) from public.prices group by 1,2 having count(*) > 1;

delete from public.prices a using public.prices b
 where a.label = b.label
   and a.service_type = b.service_type
   and a.created_at > b.created_at;

\echo '=== faq: дубли до ==='
select question, count(*) from public.faq group by 1 having count(*) > 1;

delete from public.faq a using public.faq b
 where a.question = b.question
   and a.created_at > b.created_at;

-- Осиротевшие сиды (админ правил тексты в облаке → пары по label/question нет):
-- сверить руками с /admin и облаком, при необходимости удалить по id.
\echo '=== prices после (глазами сверить с облаком) ==='
select id, service_type, label, price, sort_order from public.prices order by service_type, sort_order;
\echo '=== faq после ==='
select id, question, sort_order from public.faq order by sort_order;

-- ─── 2. capacity_zones: облачные лимиты могли не приехать (PK-конфликт) ─────
-- Сверить с облаком: select * from capacity_zones; Если админ менял лимиты —
-- раскомментировать и подставить реальные значения:
-- update public.capacity_zones set capacity = 12 where zone = 'dog_daycare';
-- update public.capacity_zones set capacity = 12 where zone = 'dog_hotel';
-- update public.capacity_zones set capacity = 12 where zone = 'cats';
\echo '=== capacity_zones (сверить с облаком!) ==='
select * from public.capacity_zones order by zone;

-- ─── 3. Абсолютные Storage-URL: облако → self-host ──────────────────────────
-- Файлы уже перенесены (05-transfer-storage.sh); перешиваем ссылки в данных,
-- иначе картинки грузятся с облака и умрут вместе с ним.
\echo '=== URL-хосты до ==='
select 'pets' as t, count(*) from public.pets where passport_photo_url like '%zmvoaanwikhztpvdjpty%'
union all select 'gallery', count(*) from public.gallery where url like '%zmvoaanwikhztpvdjpty%'
union all select 'blog', count(*) from public.blog_posts where cover_url like '%zmvoaanwikhztpvdjpty%';

update public.pets
   set passport_photo_url = replace(passport_photo_url,
       'https://zmvoaanwikhztpvdjpty.supabase.co', 'https://db.lapaclub.ru')
 where passport_photo_url like '%zmvoaanwikhztpvdjpty%';

update public.gallery
   set url = replace(url,
       'https://zmvoaanwikhztpvdjpty.supabase.co', 'https://db.lapaclub.ru')
 where url like '%zmvoaanwikhztpvdjpty%';

update public.blog_posts
   set cover_url = replace(cover_url,
       'https://zmvoaanwikhztpvdjpty.supabase.co', 'https://db.lapaclub.ru')
 where cover_url like '%zmvoaanwikhztpvdjpty%';

-- ─── 4. cron-дайджест, целящийся в облачную edge function ────────────────────
-- Утренний дайджест бизнесу не нужен (нужны только вечерние отчёты) — задачу
-- просто удаляем, замены нет.
do $$
begin
  perform cron.unschedule('morning-digest');
  raise notice 'cron morning-digest удалён (утренний дайджест упразднён)';
exception when others then
  raise notice 'cron morning-digest не найден/pg_cron нет — ок';
end $$;

-- ─── 5. Контроль после ───────────────────────────────────────────────────────
\echo '=== Контроль: облачных URL быть не должно ==='
select 'pets' as t, count(*) from public.pets where passport_photo_url like '%zmvoaanwikhztpvdjpty%'
union all select 'gallery', count(*) from public.gallery where url like '%zmvoaanwikhztpvdjpty%'
union all select 'blog', count(*) from public.blog_posts where cover_url like '%zmvoaanwikhztpvdjpty%';

\echo '=== Дублей быть не должно ==='
select 'prices' as t, count(*) from (select 1 from public.prices group by label, service_type having count(*) > 1) d
union all
select 'faq', count(*) from (select 1 from public.faq group by question having count(*) > 1) d;

-- Если контроль чистый — фиксируем. Если что-то смутило — замените commit на rollback.
commit;
\echo 'ГОТОВО. Потерянные брони восстанавливаются отдельно: сверка по audit-checks.sql §В.'

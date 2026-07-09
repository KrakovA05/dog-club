-- ═══════════════════════════════════════════════════════════════════════════
-- Перешивка pets.passport_photo_url: полный public-URL → относительный путь.
-- Контекст: бакет passports приватный (миграция 024), public-URL мёртвы (400),
-- отдача только через /api/passport/[petId]. Код с 09.07 пишет путь; этот
-- скрипт приводит старые записи (в т.ч. залитые между 024 и фиксом) к пути.
-- Работает для любого хоста (облако/self-host): берём всё после '/passports/'.
--   psql "$LOCAL_DB_URL" -f 08-passport-paths.sql
-- ═══════════════════════════════════════════════════════════════════════════
\set ON_ERROR_STOP on
begin;

\echo '=== ДО ==='
select id, name, passport_photo_url from public.pets
where passport_photo_url is not null;

update public.pets
   set passport_photo_url = split_part(passport_photo_url, '/passports/', 2)
 where passport_photo_url like '%/passports/%';

\echo '=== ПОСЛЕ (должны остаться только пути вида uid/файл.jpg) ==='
select id, name, passport_photo_url from public.pets
where passport_photo_url is not null;

-- Контроль: URL-ов остаться не должно
\echo '=== Контроль: строк с http быть не должно ==='
select count(*) as urls_left from public.pets
where passport_photo_url like 'http%';

commit;

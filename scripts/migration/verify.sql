-- ──────────────────────────────────────────────────────────────────────────
-- Проверка целостности self-host БД после миграций/переноса.
-- Запускается из 04-verify.sh. Печатает PASS/FAIL по каждому пункту.
-- Ничего не меняет, только читает каталог Postgres.
-- ──────────────────────────────────────────────────────────────────────────
\pset pager off
\set ON_ERROR_STOP off

\echo '==== ФУНКЦИИ ===='
-- Ожидаем все ключевые функции из миграций.
WITH expected(fn) AS (VALUES
  ('is_admin'), ('is_staff_or_admin'), ('handle_new_user'),
  ('set_updated_at'), ('booking_zone'),
  ('get_availability'), ('get_range_availability'), ('enforce_capacity')
)
SELECT
  e.fn AS function,
  CASE WHEN p.proname IS NOT NULL THEN 'PASS' ELSE 'FAIL — НЕ НАЙДЕНА' END AS status
FROM expected e
LEFT JOIN pg_proc p
  ON p.proname = e.fn
 AND p.pronamespace = 'public'::regnamespace
GROUP BY e.fn, p.proname
ORDER BY e.fn;

\echo ''
\echo '==== security definer у SECURITY-функций ===='
-- is_admin / is_staff_or_admin / handle_new_user / get_* / enforce_capacity
-- должны быть SECURITY DEFINER (иначе RLS/права сломаются).
SELECT proname AS function,
       CASE WHEN prosecdef THEN 'PASS (definer)' ELSE 'FAIL — НЕ DEFINER' END AS status
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN ('is_admin','is_staff_or_admin','handle_new_user',
                  'get_availability','get_range_availability','enforce_capacity')
ORDER BY proname;

\echo ''
\echo '==== ТРИГГЕРЫ ===='
WITH expected(trg, tbl) AS (VALUES
  ('on_auth_user_created', 'auth.users'),
  ('bookings_updated_at',  'public.bookings'),
  ('bookings_enforce_capacity', 'public.bookings'),
  ('blog_posts_updated_at', 'public.blog_posts')
)
SELECT e.trg AS trigger, e.tbl AS table,
       CASE WHEN t.tgname IS NOT NULL THEN 'PASS' ELSE 'FAIL — НЕ НАЙДЕН' END AS status
FROM expected e
LEFT JOIN pg_trigger t
  ON t.tgname = e.trg
 AND t.tgrelid = e.tbl::regclass
 AND NOT t.tgisinternal
ORDER BY e.tbl, e.trg;

\echo ''
\echo '==== RLS включён на таблицах ===='
WITH expected(tbl) AS (VALUES
  ('profiles'), ('pets'), ('bookings'), ('contact_requests'),
  ('prices'), ('faq'), ('reviews'), ('gallery'),
  ('blog_posts'), ('capacity_zones'), ('telegram_bot_users')
)
SELECT e.tbl AS table,
       CASE WHEN c.relrowsecurity THEN 'PASS' ELSE 'FAIL — RLS ВЫКЛ' END AS status
FROM expected e
LEFT JOIN pg_class c ON c.oid = ('public.'||e.tbl)::regclass
ORDER BY e.tbl;

\echo ''
\echo '==== Кол-во RLS-политик по таблицам (ожидаем > 0) ===='
SELECT tablename AS table, count(*) AS policies,
       CASE WHEN count(*) > 0 THEN 'PASS' ELSE 'FAIL — НЕТ ПОЛИТИК' END AS status
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

\echo ''
\echo '==== STORAGE: бакеты ===='
WITH expected(b) AS (VALUES ('passports'), ('gallery'), ('blog'))
SELECT e.b AS bucket,
       CASE WHEN s.id IS NOT NULL THEN 'PASS' ELSE 'FAIL — НЕ СОЗДАН' END AS status,
       coalesce(s.public::text, '—') AS is_public
FROM expected e
LEFT JOIN storage.buckets s ON s.id = e.b
ORDER BY e.b;

\echo ''
\echo '==== Роли Supabase (должны существовать) ===='
WITH expected(r) AS (VALUES
  ('anon'), ('authenticated'), ('service_role'),
  ('authenticator'), ('supabase_auth_admin'), ('supabase_storage_admin')
)
SELECT e.r AS role,
       CASE WHEN g.rolname IS NOT NULL THEN 'PASS' ELSE 'FAIL — НЕТ РОЛИ' END AS status
FROM expected e
LEFT JOIN pg_roles g ON g.rolname = e.r
ORDER BY e.r;

\echo ''
\echo '==== Сводка по строкам в ключевых таблицах ===='
SELECT 'auth.users' AS t, count(*) FROM auth.users
UNION ALL SELECT 'profiles', count(*) FROM public.profiles
UNION ALL SELECT 'pets', count(*) FROM public.pets
UNION ALL SELECT 'bookings', count(*) FROM public.bookings
UNION ALL SELECT 'contact_requests', count(*) FROM public.contact_requests
UNION ALL SELECT 'capacity_zones', count(*) FROM public.capacity_zones
UNION ALL SELECT 'storage.objects', count(*) FROM storage.objects
ORDER BY t;

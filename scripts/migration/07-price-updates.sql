-- ═══════════════════════════════════════════════════════════════════════════
-- Обновление цен (07.07.2026). Запуск на сервере:
--   psql "$LOCAL_DB_URL" -f 07-price-updates.sql
-- Транзакция; каждый UPDATE защищён текущей ценой — если прайс в БД уже другой,
-- строка не изменится и это будет видно в контроле (updated=0 → разобраться).
-- Собаки и прочие позиции НЕ трогаются.
-- ═══════════════════════════════════════════════════════════════════════════
\set ON_ERROR_STOP on
begin;

\echo '=== ДО ==='
select id, service_type, label, price, unit, sort_order
from public.prices order by service_type, sort_order;

-- ─── 1. Детсад: «Час» 700 → 500 ──────────────────────────────────────────────
update public.prices set price = 500
 where service_type = 'daycare' and label = 'Час' and price = 700;

-- ─── 2. Гостиница, кошки: 1200→950, 1100→850, 1000→750 ──────────────────────
-- Матчим по вхождению «кошк» + текущей цене (точное написание label могло
-- отличаться пробелами: «Сутки (кошка)» / «Сутки(кошка)»).
update public.prices set price = 950
 where service_type = 'hotel' and label ilike '%кошк%'
   and label ilike '%сутки%' and label not ilike '%трёх%' and label not ilike '%трех%'
   and label not ilike '%пяти%' and price = 1200;

update public.prices set price = 850
 where service_type = 'hotel' and label ilike '%кошк%'
   and (label ilike '%трёх%' or label ilike '%трех%') and price = 1100;

update public.prices set price = 750
 where service_type = 'hotel' and label ilike '%кошк%'
   and label ilike '%пяти%' and price = 1000;

-- ─── 3. Абонементы детсада (полный день 1200 ₽; выгода 10% и 20%) ───────────
-- Идемпотентно: не вставляем повторно при перезапуске скрипта.
insert into public.prices (service_type, label, description, price, unit, is_featured, sort_order)
select 'daycare',
       'Абонемент 6 посещений (полный день)',
       'Выгода 10%: 1 080 ₽ за посещение вместо 1 200 ₽',
       6480, 'абонемент', false,
       (select coalesce(max(sort_order), 0) + 1 from public.prices where service_type = 'daycare')
where not exists (select 1 from public.prices
                  where service_type = 'daycare' and label ilike 'Абонемент 6%');

insert into public.prices (service_type, label, description, price, unit, is_featured, sort_order)
select 'daycare',
       'Абонемент 12 посещений (полный день)',
       'Выгода 20%: 960 ₽ за посещение вместо 1 200 ₽',
       11520, 'абонемент', true,
       (select coalesce(max(sort_order), 0) + 1 from public.prices where service_type = 'daycare')
where not exists (select 1 from public.prices
                  where service_type = 'daycare' and label ilike 'Абонемент 12%');

\echo '=== ПОСЛЕ (сверить: Час=500; кошки 950/850/750; +2 абонемента) ==='
select id, service_type, label, price, unit, is_featured, sort_order
from public.prices order by service_type, sort_order;

-- Если «ПОСЛЕ» не сходится с ожиданием — замените commit на rollback.
commit;

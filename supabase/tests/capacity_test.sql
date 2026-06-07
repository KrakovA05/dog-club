-- pgTAP-тесты системы вместимости (миграции 016/017).
-- Запуск: supabase test db
-- Всё в транзакции с rollback — данные не сохраняются.

begin;
create extension if not exists pgtap;
select plan(11);

-- ── Setup ───────────────────────────────────────────────────────────────────
insert into auth.users (id, email)
values ('11111111-1111-1111-1111-111111111111', 'u1@test.local');

insert into public.pets (id, owner_id, name, type) values
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Рекс',   'dog'),
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Барсик', 'cat');

-- Тестовые лимиты зон (в транзакции, откатятся)
update public.capacity_zones set capacity = 2 where zone = 'dog_daycare';
update public.capacity_zones set capacity = 1 where zone = 'dog_hotel';
update public.capacity_zones set capacity = 1 where zone = 'cats';

-- ── A. Переполнение детсада блокируется (лимит 2) ────────────────────────────
select lives_ok($$
  insert into public.bookings (user_id, pet_id, service_type, daycare_format, start_date, status)
  values ('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','daycare','full_day','2099-01-10','confirmed')
$$, 'детсад: 1-я подтверждённая бронь проходит');

select lives_ok($$
  insert into public.bookings (user_id, pet_id, service_type, daycare_format, start_date, status)
  values ('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','daycare','full_day','2099-01-10','confirmed')
$$, 'детсад: 2-я подтверждённая бронь проходит (лимит 2)');

select throws_ok($$
  insert into public.bookings (user_id, pet_id, service_type, daycare_format, start_date, status)
  values ('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','daycare','full_day','2099-01-10','confirmed')
$$, '23514', null, 'детсад: 3-я бронь сверх лимита 2 — отказ');

-- availability показывает 0 свободных мест в этот день
select is(
  (select remaining from public.get_range_availability('daycare','dog','2099-01-10','2099-01-10')),
  0, 'availability: 0 свободных мест при полном детсаде'
);

-- ── B. pending НЕ занимает место ─────────────────────────────────────────────
select lives_ok($$
  insert into public.bookings (user_id, pet_id, service_type, daycare_format, start_date, status)
  values ('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','daycare','full_day','2099-01-10','pending')
$$, 'pending: заявка проходит даже при полном дне (место не резервирует)');

-- ── C. Зоны независимы (собака-гостиница не ест место детсада) ────────────────
select lives_ok($$
  insert into public.bookings (user_id, pet_id, service_type, start_date, end_date, status)
  values ('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','hotel','2099-01-10','2099-01-11','confirmed')
$$, 'зоны: собака-гостиница проходит, хотя детсад в этот день полон');

-- ── D. Кошки: детсад и гостиница суммируются в одной зоне (лимит 1) ──────────
select lives_ok($$
  insert into public.bookings (user_id, pet_id, service_type, daycare_format, start_date, status)
  values ('11111111-1111-1111-1111-111111111111','33333333-3333-3333-3333-333333333333','daycare','full_day','2099-02-10','confirmed')
$$, 'кошки: кошко-детсад проходит (лимит 1)');

select throws_ok($$
  insert into public.bookings (user_id, pet_id, service_type, start_date, end_date, status)
  values ('11111111-1111-1111-1111-111111111111','33333333-3333-3333-3333-333333333333','hotel','2099-02-09','2099-02-11','confirmed')
$$, '23514', null, 'кошки: кошко-гостиница на ту же ночь — отказ (зона cats полна)');

-- ── E. Гостиница считает ночи [заезд, выезд): день выезда свободен ────────────
select lives_ok($$
  insert into public.bookings (user_id, pet_id, service_type, start_date, end_date, status)
  values ('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','hotel','2099-03-01','2099-03-03','confirmed')
$$, 'гостиница: бронь 01→03 (ночи 01,02) проходит (лимит 1)');

select lives_ok($$
  insert into public.bookings (user_id, pet_id, service_type, start_date, end_date, status)
  values ('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','hotel','2099-03-03','2099-03-04','confirmed')
$$, 'гостиница: заезд в день выезда предыдущей (ночь 03 свободна) — проходит');

select throws_ok($$
  insert into public.bookings (user_id, pet_id, service_type, start_date, end_date, status)
  values ('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','hotel','2099-03-02','2099-03-03','confirmed')
$$, '23514', null, 'гостиница: занятая ночь 02 — отказ');

select * from finish();
rollback;

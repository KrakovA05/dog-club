#!/usr/bin/env bash
# Проверка self-host БД: функции (is_admin, is_staff_or_admin, handle_new_user,
# set_updated_at, booking_zone, get_availability, get_range_availability,
# enforce_capacity), триггеры, RLS, бакеты, роли. Только чтение.
#
# Дополнительно — функциональный smoke-тест handle_new_user: вставляем
# тестового пользователя в auth.users и проверяем, что профиль создался
# автоматически, потом откатываем (ROLLBACK — БД не меняется).
set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/config.sh"
require_cmd psql

[ -n "${LOCAL_DB_URL}" ] || die "LOCAL_DB_URL не задан"

log "Каталоговые проверки (verify.sql)…"
psql "${LOCAL_DB_URL}" -f "${SCRIPT_DIR}/verify.sql"

echo
log "Функциональный smoke-тест handle_new_user (в транзакции с ROLLBACK)…"
psql "${LOCAL_DB_URL}" -v ON_ERROR_STOP=1 <<'SQL'
BEGIN;
DO $$
DECLARE
  uid uuid := gen_random_uuid();
  prof_count int;
BEGIN
  INSERT INTO auth.users (id, email, raw_user_meta_data)
  VALUES (uid, 'verify-' || uid || '@example.test',
          jsonb_build_object('full_name','Тест Тестов','phone','+70000000000'));

  SELECT count(*) INTO prof_count
  FROM public.profiles
  WHERE id = uid AND full_name = 'Тест Тестов' AND phone = '+70000000000';

  IF prof_count = 1 THEN
    RAISE NOTICE 'PASS — handle_new_user создал профиль из метаданных';
  ELSE
    RAISE EXCEPTION 'FAIL — профиль не создан или поля не совпали (got %)', prof_count;
  END IF;
END $$;
ROLLBACK;
SQL

echo
log "Готово. Разберите вывод: все строки должны быть PASS."

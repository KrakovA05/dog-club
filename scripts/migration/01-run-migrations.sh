#!/usr/bin/env bash
# Прогон всех миграций приложения на ЧИСТОЙ self-host БД.
#
# Запускать ПОСЛЕ `docker compose up -d` и готовности стека: контейнеры auth и
# storage при старте создают схемы `auth` и `storage`, на которые ссылаются
# миграции 002 (триггер на auth.users) и 004/005 (storage.buckets).
#
# Применяет supabase/migrations/0NN_*.sql строго по порядку имён.
# Идемпотентность: миграции написаны с if-not-exists/on-conflict, повторный
# прогон в основном безопасен, но рекомендуется чистая БД.
set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/config.sh"
require_cmd psql

[ -n "${LOCAL_DB_URL}" ] || die "LOCAL_DB_URL не задан (см. config.sh / .env)"

log "Жду готовности БД ${LOCAL_DB_URL%@*}@..."
for i in $(seq 1 30); do
  if psql "${LOCAL_DB_URL}" -c 'select 1' >/dev/null 2>&1; then break; fi
  sleep 2
  [ "$i" -eq 30 ] && die "БД не отвечает — стек поднят? (docker compose ps)"
done

# Проверяем, что схемы auth/storage уже созданы контейнерами
psql "${LOCAL_DB_URL}" -tAc \
  "select count(*) from information_schema.schemata where schema_name in ('auth','storage')" \
  | grep -q '^2$' || die "схемы auth/storage ещё не созданы — дайте контейнерам auth и storage прогреться и повторите"

shopt -s nullglob
files=( "${MIGRATIONS_DIR}"/*.sql )
[ ${#files[@]} -gt 0 ] || die "не найдены миграции в ${MIGRATIONS_DIR}"

log "Применяю ${#files[@]} миграций…"
for f in "${files[@]}"; do
  name="$(basename "$f")"
  log "  → ${name}"
  # ON_ERROR_STOP: падаем на первой ошибке (кроме явно ожидаемых ниже)
  if ! psql "${LOCAL_DB_URL}" -v ON_ERROR_STOP=1 -f "$f"; then
    case "$name" in
      014_*)
        # Миграция 014 заводит pg_cron-задачу с ХАРДКОДОМ облачного URL
        # (.../functions/v1/telegram-bot). На self-host это либо не нужно,
        # либо требует pg_cron в shared_preload_libraries (включён в compose).
        warn "Миграция 014 (cron-дайджест) не применилась — это допустимо."
        warn "Cron указывает на СТАРЫЙ облачный URL и для self-host не обязателен."
        warn "Поправьте/удалите задачу вручную позже (см. README-selfhost.md)."
        ;;
      *)
        die "миграция ${name} упала — разберитесь и перезапустите на чистой БД"
        ;;
    esac
  fi
done

log "Готово. Все миграции применены."
log "Дальше: 04-verify.sh (проверка функций/RLS) или 02-dump-cloud.sh (перенос данных)."

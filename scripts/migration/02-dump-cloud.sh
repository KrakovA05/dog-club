#!/usr/bin/env bash
# Выгрузка ДАННЫХ из Supabase Cloud (без схемы — схему создают миграции и
# контейнеры). Делаем три отдельных дампа, чтобы аккуратно восстановить:
#
#   auth_data.sql     — пользователи и identities (схема auth)
#   public_data.sql   — все прикладные таблицы (profiles, pets, bookings, …)
#   storage_meta.sql  — метаданные объектов Storage (storage.objects),
#                       БЕЗ storage.buckets (бакеты создаёт миграция 004/005)
#
# Сами файлы (картинки) переносит отдельно 05-transfer-storage.sh.
#
# Требует: pg_dump (версии >= серверной, лучше из supabase/postgres или PG16+).
set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/config.sh"
require_cmd pg_dump

[ -n "${CLOUD_DB_URL}" ] || die "CLOUD_DB_URL не задан (Dashboard → Database → Connection string)"

log "Дамп auth (пользователи)…"
pg_dump "${CLOUD_DB_URL}" \
  --data-only --no-owner --no-privileges \
  --schema=auth \
  --table='auth.users' \
  --table='auth.identities' \
  --column-inserts \
  -f "${DUMP_DIR}/auth_data.sql"

log "Дамп public (прикладные таблицы)…"
pg_dump "${CLOUD_DB_URL}" \
  --data-only --no-owner --no-privileges \
  --schema=public \
  --column-inserts \
  -f "${DUMP_DIR}/public_data.sql"

log "Дамп storage.objects (метаданные файлов, без bucket'ов)…"
pg_dump "${CLOUD_DB_URL}" \
  --data-only --no-owner --no-privileges \
  --table='storage.objects' \
  --column-inserts \
  -f "${DUMP_DIR}/storage_meta.sql"

log "Готово. Файлы в ${DUMP_DIR}:"
ls -lh "${DUMP_DIR}"/*.sql
warn "Дампы содержат ПЕРСОНАЛЬНЫЕ ДАННЫЕ — не коммитьте, удалите после переноса."

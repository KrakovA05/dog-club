#!/usr/bin/env bash
# Перенос ФАЙЛОВ Storage (passports, gallery, blog) из Supabase Cloud в self-host.
#
# Использует Supabase CLI (`supabase storage cp`), который умеет ходить в
# произвольный инстанс через --experimental + переменные окружения.
# Альтернатива (если CLI недоступен) — см. README-selfhost.md (rclone/S3).
#
# Логика: для каждого бакета рекурсивно скачиваем из облака в локальную папку,
# затем заливаем в self-host. Бакеты на self-host уже созданы миграциями.
set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/config.sh"
require_cmd supabase

[ -n "${CLOUD_SERVICE_ROLE_KEY}" ] || die "CLOUD_SERVICE_ROLE_KEY не задан (для чтения приватных файлов)"
[ -n "${LOCAL_SERVICE_ROLE_KEY}" ] || die "LOCAL_SERVICE_ROLE_KEY не задан (service_role self-host из selfhost/.env)"

STAGE="${DUMP_DIR}/storage_files"
mkdir -p "${STAGE}"

for bucket in "${STORAGE_BUCKETS[@]}"; do
  log "Бакет '${bucket}': скачиваю из облака…"
  SUPABASE_ACCESS_TOKEN="" \
  supabase storage cp --experimental --recursive \
    "ss:///${bucket}" "${STAGE}/${bucket}" \
    --linked=false \
    --url "${CLOUD_SUPABASE_URL}" \
    --service-role-key "${CLOUD_SERVICE_ROLE_KEY}" \
    || warn "не удалось скачать '${bucket}' через CLI — см. README (ручной путь rclone/S3)"

  log "Бакет '${bucket}': заливаю в self-host…"
  supabase storage cp --experimental --recursive \
    "${STAGE}/${bucket}" "ss:///${bucket}" \
    --linked=false \
    --url "${LOCAL_SUPABASE_URL}" \
    --service-role-key "${LOCAL_SERVICE_ROLE_KEY}" \
    || warn "не удалось залить '${bucket}' — проверьте, что бакет создан (миграции 004/005)"
done

log "Готово. Файлы перенесены в ${STAGE} и загружены в self-host."
warn "В ${STAGE} лежат фото ветпаспортов (ПДн) — удалите после проверки."

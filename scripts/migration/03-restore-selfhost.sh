#!/usr/bin/env bash
# Восстановление данных в self-host БД.
#
# Порядок ВАЖЕН:
#   1) сначала должны быть применены миграции (01-run-migrations.sh) —
#      созданы таблицы public.* и бакеты storage.buckets;
#   2) auth.users грузим ПЕРЕД public.* — иначе FK profiles/pets/bookings → auth.users
#      и триггер handle_new_user не пройдут;
#   3) при вставке в auth.users сработает триггер on_auth_user_created и сам
#      создаст строки в public.profiles. Поэтому public_data.sql может
#      конфликтовать по PK profiles → грузим с ON_CONFLICT DO NOTHING-обёрткой.
set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/config.sh"
require_cmd psql

[ -n "${LOCAL_DB_URL}" ] || die "LOCAL_DB_URL не задан"
[ -f "${DUMP_DIR}/auth_data.sql" ]   || die "нет ${DUMP_DIR}/auth_data.sql — сначала 02-dump-cloud.sh"
[ -f "${DUMP_DIR}/public_data.sql" ] || die "нет ${DUMP_DIR}/public_data.sql — сначала 02-dump-cloud.sh"

# Проверим, что миграции уже накатаны (есть таблица profiles)
psql "${LOCAL_DB_URL}" -tAc \
  "select to_regclass('public.profiles') is not null" | grep -q '^t$' \
  || die "таблицы public.* не найдены — сначала запустите 01-run-migrations.sh"

log "1/4 Отключаю триггер on_auth_user_created на время загрузки auth.users…"
# Иначе на каждый insert в auth.users триггер попытается вставить профиль до того,
# как мы загрузим реальные профили из дампа. Грузим users → потом профили из дампа.
psql "${LOCAL_DB_URL}" -v ON_ERROR_STOP=1 -c \
  "alter table auth.users disable trigger on_auth_user_created;"

log "2/4 Загружаю auth.users / auth.identities…"
psql "${LOCAL_DB_URL}" -v ON_ERROR_STOP=1 -f "${DUMP_DIR}/auth_data.sql"

log "3/4 Загружаю прикладные данные (public.*)…"
# Дамп с --column-inserts. Конфликты по PK (например profiles, если триггер всё же
# что-то создал) подавляем мягко: оборачиваем в savepoint через ON_ERROR_STOP=0.
psql "${LOCAL_DB_URL}" -f "${DUMP_DIR}/public_data.sql" || \
  warn "часть строк public не загрузилась (вероятно дубликаты PK) — проверьте вывод выше"

if [ -f "${DUMP_DIR}/storage_meta.sql" ]; then
  log "   + метаданные storage.objects…"
  psql "${LOCAL_DB_URL}" -f "${DUMP_DIR}/storage_meta.sql" || \
    warn "часть storage.objects не загрузилась — это норм, если файлы ещё не перенесены"
fi

log "4/4 Включаю триггер on_auth_user_created обратно…"
psql "${LOCAL_DB_URL}" -v ON_ERROR_STOP=1 -c \
  "alter table auth.users enable trigger on_auth_user_created;"

log "Готово. Данные восстановлены."
log "Дальше: 05-transfer-storage.sh (файлы), затем 04-verify.sh."

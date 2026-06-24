#!/usr/bin/env bash
# Общая конфигурация для скриптов переноса Supabase Cloud → self-host.
# Подключается через `source` остальными скриптами. Сам ничего не делает.
#
# Заполните переменные ниже или экспортируйте их в окружении перед запуском.
set -euo pipefail

# ── Источник: Supabase Cloud (откуда выгружаем) ─────────────────────────────
# Connection string из Supabase Dashboard → Project Settings → Database →
# "Connection string" (URI). Используйте прямое подключение (порт 5432) или
# session pooler. Пароль — пароль БД проекта.
#   Пример: postgres://postgres:PASS@db.zmvoaanwikhztpvdjpty.supabase.co:5432/postgres
: "${CLOUD_DB_URL:=}"

# Для переноса файлов Storage из облака:
CLOUD_PROJECT_REF="${CLOUD_PROJECT_REF:-zmvoaanwikhztpvdjpty}"
CLOUD_SUPABASE_URL="${CLOUD_SUPABASE_URL:-https://zmvoaanwikhztpvdjpty.supabase.co}"
# service_role ключ ОБЛАКА (для чтения приватных файлов и листинга).
: "${CLOUD_SERVICE_ROLE_KEY:=}"

# ── Назначение: self-host на Amvera ─────────────────────────────────────────
# Локально (после `docker compose up`) БД доступна на хосте:
LOCAL_DB_URL="${LOCAL_DB_URL:-postgres://postgres:${POSTGRES_PASSWORD:-}@localhost:5432/postgres}"
LOCAL_SUPABASE_URL="${LOCAL_SUPABASE_URL:-http://localhost:8000}"
: "${LOCAL_SERVICE_ROLE_KEY:=}"

# ── Пути ────────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
MIGRATIONS_DIR="${REPO_ROOT}/supabase/migrations"
DUMP_DIR="${DUMP_DIR:-${SCRIPT_DIR}/_dump}"           # игнорируется git'ом
STORAGE_BUCKETS=("passports" "gallery" "blog")

mkdir -p "${DUMP_DIR}"

log()  { printf '\033[1;34m[migrate]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[migrate]\033[0m %s\n' "$*" >&2; }
die()  { printf '\033[1;31m[migrate] ОШИБКА:\033[0m %s\n' "$*" >&2; exit 1; }

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "не найдена утилита '$1' — установите её"
}

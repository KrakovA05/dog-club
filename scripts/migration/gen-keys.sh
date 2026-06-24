#!/usr/bin/env bash
# Генерация ANON_KEY и SERVICE_ROLE_KEY для self-host Supabase из одного
# JWT_SECRET. Это JWT (HS256), подписанные тем же секретом, что и весь стек.
#
# Использование:
#   ./gen-keys.sh                      # возьмёт JWT_SECRET из selfhost/.env
#   ./gen-keys.sh <JWT_SECRET>         # явный секрет аргументом
#   JWT_SECRET=... ./gen-keys.sh       # из окружения
#   ./gen-keys.sh --years 5            # срок жизни ключей (по умолчанию 10 лет)
#
# Вывод — готовые строки для вставки в selfhost/.env:
#   ANON_KEY=eyJ...
#   SERVICE_ROLE_KEY=eyJ...
#
# Зависимости: openssl, date. Работает на macOS и Linux.
set -euo pipefail

YEARS=10
SECRET=""
while [ $# -gt 0 ]; do
  case "$1" in
    --years) YEARS="$2"; shift 2 ;;
    --years=*) YEARS="${1#*=}"; shift ;;
    -h|--help) grep '^#' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) SECRET="$1"; shift ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Источник секрета: аргумент → env → selfhost/.env
if [ -z "${SECRET}" ]; then
  SECRET="${JWT_SECRET:-}"
fi
if [ -z "${SECRET}" ]; then
  ENV_FILE="${SCRIPT_DIR}/../../selfhost/.env"
  if [ -f "${ENV_FILE}" ]; then
    SECRET="$(grep -E '^JWT_SECRET=' "${ENV_FILE}" | head -n1 | cut -d= -f2- || true)"
  fi
fi

[ -n "${SECRET}" ] || { echo "ОШИБКА: JWT_SECRET не задан (аргумент, env или selfhost/.env)" >&2; exit 1; }
[ "${#SECRET}" -ge 32 ] || echo "ВНИМАНИЕ: JWT_SECRET короче 32 символов — небезопасно." >&2

# base64url без паддинга
b64url() { openssl base64 -A | tr '+/' '-_' | tr -d '='; }

# HMAC-SHA256(signing_input, secret) → base64url
sign() {
  printf '%s' "$1" \
    | openssl dgst -sha256 -hmac "${SECRET}" -binary \
    | b64url
}

make_jwt() {
  local role="$1"
  local iat exp header payload signing_input sig
  iat="$(date +%s)"
  exp="$(( iat + YEARS * 31536000 ))"
  header="$(printf '{"alg":"HS256","typ":"JWT"}' | b64url)"
  payload="$(printf '{"role":"%s","iss":"supabase","iat":%s,"exp":%s}' "${role}" "${iat}" "${exp}" | b64url)"
  signing_input="${header}.${payload}"
  sig="$(sign "${signing_input}")"
  printf '%s.%s' "${signing_input}" "${sig}"
}

ANON="$(make_jwt anon)"
SERVICE="$(make_jwt service_role)"

cat <<EOF
# ── Сгенерировано gen-keys.sh (срок: ${YEARS} лет) ──
# Вставьте эти строки в selfhost/.env (заменив PLACEHOLDER-значения):

ANON_KEY=${ANON}
SERVICE_ROLE_KEY=${SERVICE}
EOF

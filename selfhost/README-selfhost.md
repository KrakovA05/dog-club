# Self-hosted Supabase для Лапа Клуб (Amvera / РФ)

Развёртывание собственного стека Supabase на российском хостинге для соответствия
152-ФЗ (локализация первичной записи персональных данных). Код приложения этими
файлами **не меняется** — приложение переключается на новый инстанс отдельным
шагом (правка `src/lib/supabase/client.ts` + секреты Amvera), здесь не выполняется.

## Что внутри

```
selfhost/
  docker-compose.yml        # стек: db, auth, rest, storage, realtime, meta, studio, kong, imgproxy
  .env.example              # переменные окружения (скопировать в .env)
  volumes/api/kong.yml      # конфиг API-gateway (роуты + ключи anon/service_role)
  README-selfhost.md        # этот файл

scripts/migration/
  config.sh                 # общие переменные (источник=облако, назначение=self-host)
  01-run-migrations.sh      # прогон всех 20 миграций на чистой БД
  02-dump-cloud.sh          # дамп ДАННЫХ из Supabase Cloud (auth + public + storage-мета)
  03-restore-selfhost.sh    # восстановление данных в self-host
  04-verify.sh + verify.sql # проверка функций, триггеров, RLS, бакетов, ролей
  05-transfer-storage.sh    # перенос файлов Storage (passports/gallery/blog)
```

## Архитектура, под которую это сделано

Приложение (Next.js на Amvera) ходит в Supabase тремя способами — все они
работают через **Kong gateway** (порт `8000` → `API_EXTERNAL_URL`):

- браузер с `anon`-ключом (регистрация, вход, контакт-форма) — `/auth/v1`, `/rest/v1`;
- Server Actions с `anon`-ключом через cookies;
- Server Actions с `service_role` (admin-операции, Storage, Telegram).

Поэтому критично, чтобы `ANON_KEY` и `SERVICE_ROLE_KEY` были подписаны тем же
`JWT_SECRET`, что и весь стек.

---

## Порядок развёртывания

### 0. Предусловия
- Docker + Docker Compose на сервере Amvera (или локально для теста).
- Утилиты для переноса данных: `psql`, `pg_dump` (PostgreSQL 15+), `supabase` CLI.

### 1. Секреты и `.env`
```bash
cd selfhost
cp .env.example .env
# сгенерировать:
openssl rand -hex 32   # → JWT_SECRET
openssl rand -hex 24   # → POSTGRES_PASSWORD
openssl rand -hex 16   # → REALTIME_DB_ENC_KEY (ровно 32 hex)
openssl rand -base64 48 # → REALTIME_SECRET_KEY_BASE
```
`ANON_KEY` и `SERVICE_ROLE_KEY` — это JWT (HS256), подписанные вашим
`JWT_SECRET`. Сгенерируйте их хелпером (он сам возьмёт `JWT_SECRET` из `.env`):
```bash
../scripts/migration/gen-keys.sh
# или с явным секретом / другим сроком жизни:
../scripts/migration/gen-keys.sh "$JWT_SECRET" --years 10
```
Скрипт печатает готовые строки — скопируйте их в `selfhost/.env`:
```
ANON_KEY=eyJhbGciOiJIUzI1NiI...
SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiI...
```
> Важно: запускайте `gen-keys.sh` **после** того, как вписали `JWT_SECRET` в
> `.env` (или передайте секрет аргументом). Ключи должны быть подписаны тем же
> секретом, что и весь стек, — иначе Kong/PostgREST/GoTrue не примут запросы.
> payload: `{"role":"anon"|"service_role","iss":"supabase","iat":…,"exp":…}`.

Альтернатива без скрипта — страница официальной документации Supabase
(self-hosting → «Generate API keys»), указав туда свой `JWT_SECRET`.

В проде задайте реальные внешние адреса:
```
API_EXTERNAL_URL=https://db.lapaclub.ru
SUPABASE_PUBLIC_URL=https://db.lapaclub.ru
SITE_URL=https://lapaclub.ru
ADDITIONAL_REDIRECT_URLS=https://lapaclub.ru/auth/confirm,https://lapaclub.ru/reset-password
```

### 2. Поднять стек
```bash
docker compose up -d
docker compose ps           # дождаться healthy у db и auth
docker compose logs -f auth # убедиться, что GoTrue прогнал свои миграции (схема auth)
```
Контейнеры `auth` и `storage` при первом старте сами создают схемы `auth` и
`storage` и роли (`anon`, `authenticated`, `service_role`, `authenticator`,
`supabase_auth_admin`, `supabase_storage_admin`). Это нужно **до** шага 3.

### 3. Накатить миграции приложения
```bash
cd ../scripts/migration
cp ../../selfhost/.env ./.env 2>/dev/null || true   # или экспортируйте POSTGRES_PASSWORD
export POSTGRES_PASSWORD=...      # из selfhost/.env
export LOCAL_DB_URL="postgres://postgres:${POSTGRES_PASSWORD}@localhost:5432/postgres"

bash 01-run-migrations.sh
```
Применит все `supabase/migrations/0NN_*.sql` по порядку. Миграция **014**
(cron-дайджест) может не примениться — это ожидаемо (см. «Известные нюансы»).

### 4. (Опционально) Перенести данные из облака
Только если переезжаете с существующими пользователями/бронями.
```bash
export CLOUD_DB_URL="postgres://postgres:PASS@db.zmvoaanwikhztpvdjpty.supabase.co:5432/postgres"
export CLOUD_SERVICE_ROLE_KEY="..."   # service_role ОБЛАКА
export LOCAL_SERVICE_ROLE_KEY="..."   # service_role self-host (из selfhost/.env)

bash 02-dump-cloud.sh        # → scripts/migration/_dump/*.sql
bash 03-restore-selfhost.sh  # грузит auth.users → public.* → storage-мета
bash 05-transfer-storage.sh  # переносит сами файлы (фото паспортов и т.д.)
```
> Дампы и выгруженные файлы содержат ПДн. Папка `_dump/` в `.gitignore`.
> Удалите её после успешной проверки.

### 5. Проверка
```bash
bash 04-verify.sh
```
Проверяет наличие функций (`is_admin`, `is_staff_or_admin`, `handle_new_user`,
`set_updated_at`, `booking_zone`, `get_availability`, `get_range_availability`,
`enforce_capacity`), их `SECURITY DEFINER`, триггеры, включённый RLS и политики,
бакеты `passports/gallery/blog`, роли Supabase, плюс живой smoke-тест
`handle_new_user` (вставка тест-юзера в транзакции с `ROLLBACK`). Все строки
должны быть **PASS**.

### 6. Переключение приложения (выполняется ОТДЕЛЬНО, не входит в эти файлы)
- `src/lib/supabase/client.ts`: `SUPABASE_URL` → `https://db.lapaclub.ru`, новый `SUPABASE_ANON_KEY`.
- Секреты Amvera: `SUPABASE_SERVICE_ROLE_KEY` → новый service_role.
- `src/middleware.ts`: переменные `NEXT_PUBLIC_SUPABASE_URL/ANON_KEY`.
- Обновить `/privacy` (убрать «ЕС/США» → «Россия, Amvera»).

---

## Авто-подтверждение email (без SMTP)

По требованию проекта SMTP **не настраивается**. В `.env`:
```
GOTRUE_MAILER_AUTOCONFIRM=true
```
GoTrue подтверждает email сразу при регистрации и не пытается отправить письмо.
Это согласуется с поведением приложения: `RegisterForm.tsx` при наличии сессии
сразу пускает в кабинет; ветка «Проверьте почту» просто не сработает.

> Транзакционные письма о бронях (`src/lib/email.ts`, Resend) — это отдельный
> канал, GoTrue/SMTP его не касаются. На него авто-подтверждение не влияет.

---

## Известные нюансы

- **Миграция 014 (cron-дайджест).** Использует `pg_cron`/`pg_net` и **хардкод
  старого облачного URL** `https://zmvoaanwikhztpvdjpty.supabase.co/functions/v1/telegram-bot`.
  `pg_cron`/`pg_net` включены в `shared_preload_libraries` в compose, так что
  расширения поднимутся. Но задача будет звать чужой (облачный) URL. Утренний
  дайджест в текущем приложении и так шлётся через `/api/admin/daily-report`
  (Next.js), поэтому cron в БSD можно удалить:
  ```sql
  SELECT cron.unschedule('morning-digest');
  ```
  `01-run-migrations.sh` не падает на этой миграции, а печатает предупреждение.

- **Edge Functions не входят в стек.** Приложение в рантайме их не вызывает
  (Telegram-webhook реализован как Next.js route `/api/telegram/webhook`).
  Файлы `supabase/functions/*` оставлены как есть. Если позже понадобятся —
  добавьте сервис `supabase/edge-runtime` по образцу официального compose.

- **Теги образов.** Это облегчённая адаптация официального стека. Перед
  продакшеном сверьте версии образов с upstream
  `https://github.com/supabase/supabase/blob/master/docker/docker-compose.yml`
  (Supabase обновляет компоненты согласованно).

- **Внешний порт БД 5432** проброшен на хост для `pg_dump/restore`. В проде
  закройте его фаерволом или уберите `ports:` у сервиса `db` после переноса.

- **Перенос Storage без CLI.** Если `supabase storage cp` не подходит, файлы
  можно перенести через S3-совместимый протокол (storage-api поднимает его) с
  помощью `rclone`, либо вручную скопировать каталог `storage-data` volume и
  сверить с метаданными `storage.objects`.

## Откат

Стек полностью изолирован (отдельные docker volumes `db-data`, `storage-data`).
Снести и начать заново:
```bash
docker compose down -v      # ВНИМАНИЕ: -v удаляет данные БД и файлы
```
Облачный проект Supabase при этом не затрагивается — отключайте его только после
≥2 недель стабильной работы self-host (см. отчёт `lapaclub-152fz-audit.md`).

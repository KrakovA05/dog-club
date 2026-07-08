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

> Email-канал удалён полностью (07.2026, 152-ФЗ — Resend был трансграничной
> передачей). Подтверждение брони клиент видит в кабинете, админ — в Telegram.
> В `src/lib/email.ts` осталась НЕподключённая заготовка под российский SMTP.
> Сброс пароля по email отключён — на `/forgot-password` заглушка с телефоном
> (восстановление вручную через админа).

---

## Lite-вариант (урезанный стек для ~4 ГБ RAM)

Если бюджет на сервер ограничен — есть облегчённый стек из **5 сервисов**:
`db`, `auth`, `rest`, `storage`, `kong`. Файлы: `docker-compose.lite.yml` +
`volumes/api/kong.lite.yml`. Всё остальное (см. `.env`, миграции, скрипты,
бэкапы) — общее с полным вариантом.

```bash
cd selfhost
docker compose -f docker-compose.lite.yml --env-file .env up -d
docker compose -f docker-compose.lite.yml ps
```
Дальше — те же шаги 3–5 (миграции → данные → `04-verify.sh`). Скрипты
`scripts/migration/*` от варианта стека не зависят.

### Что выкинуто и почему это безопасно

Проверено по коду приложения — ни один из убранных сервисов в рантайме не
используется:

| Сервис | Зачем нужен | Используется в коде? |
|---|---|---|
| **realtime** | Живые подписки `.channel()` / `postgres_changes` | ❌ Нет ни одного вызова. Приложение читает данные обычными REST-запросами. |
| **imgproxy** | Трансформация картинок Storage (`?width=…`) | ❌ Галерея отдаёт сырой `<img src>`, блог — через `next/image` (ресайзит сам Next на Amvera, не Supabase), паспорта — `.download()`. Запросов трансформаций нет. В storage выставлено `ENABLE_IMAGE_TRANSFORMATION=false`. |
| **studio** | Веб-GUI администрирования БД | ❌ Только ручной инструмент. В проде управляйте через `psql` / `docker exec supabase-db psql`. |
| **meta** | Бэкенд для studio (`/pg/`) | ❌ Нужен только studio. |
| **edge-runtime** | Supabase Edge Functions | ❌ Telegram-webhook реализован как Next.js route `/api/telegram/webhook`. |

> Storage **остаётся** — он реально используется (загрузка/удаление фото
> паспортов и галереи: `upload`, `download`, `remove`, `getPublicUrl`).

### Бюджет памяти (mem_limit)

Лимиты заданы прямо в `docker-compose.lite.yml`, суммарно ~3 ГБ (запас для ОС):

| Сервис | mem_limit | Заметка |
|---|---|---|
| db | 1536 МБ | `shared_buffers=256MB`, `effective_cache_size=768MB`, `work_mem=8MB`, `max_connections=50`, `shm_size=256m` |
| storage | 512 МБ | Node-сервис |
| kong | 512 МБ | OpenResty gateway |
| rest | 256 МБ | PostgREST, `PGRST_DB_POOL=10` |
| auth | 256 МБ | GoTrue (Go, лёгкий) |

`shared_buffers` намеренно скромный (256 МБ): на маленьком сервере раздувать
его вредно — память нужнее под page cache ОС и остальные контейнеры. Если на
сервере **меньше** 4 ГБ — снизьте лимит `db` и `shared_buffers` пропорционально
(напр. для 2 ГБ: `db` 768 МБ, `shared_buffers=128MB`).

### Можно ли потом добавить studio?

Да, это GUI и его можно поднимать разово, когда нужно залезть в БД руками:
возьмите сервисы `studio` + `meta` из полного `docker-compose.yml` и запустите
их отдельным compose-файлом, направив на тот же `db`. На постоянку в проде их
держать не обязательно.

---

## Хардкоды старых адресов (аудит проекта)

Полный список вхождений старого облачного адреса
`https://zmvoaanwikhztpvdjpty.supabase.co` и связанных URL. Колонка «Действие»
говорит, что сделано/что сделать при переключении приложения на self-host.

| Файл : строка | Что там | Действие |
|---|---|---|
| `src/lib/supabase/client.ts:6` | `SUPABASE_URL` + `SUPABASE_ANON_KEY` зашиты константами | **Оставлено намеренно.** Хардкод — это фикс кэша сборки Amvera (старые `NEXT_PUBLIC_*` впекались в билд). НЕ переводить в env. При cutover поменять **значение** константы на `https://db.lapaclub.ru` + новый anon-ключ. |
| `src/instrumentation.ts:19` | `fetch(".../rest/v1/site_errors")` — телеметрия ошибок | ✅ **Исправлено:** теперь `process.env.SUPABASE_URL ?? <старый>`. Server-only файл, build-cache не касается. При cutover задать env `SUPABASE_URL`. ⚠️ Таблицы `site_errors` нет в миграциях — на self-host логирование тихо ничего не пишет (ошибки глотаются), это ок. |
| `next.config.ts:8` | `images.remotePatterns` host `*.supabase.co` | ✅ **Дополнено:** добавлен опциональный host из `SUPABASE_IMAGE_HOSTNAME`. При cutover задать env = `db.lapaclub.ru`, тогда `next/image` пустит картинки с self-host. Старый паттерн оставлен как fallback. |
| `supabase/migrations/014_morning_digest_cron.sql:11` | `cron.schedule` → POST на облачный `/functions/v1/telegram-bot` | Выполнить `SELECT cron.unschedule('morning-digest');` (входит в `06-post-migration-fixes.sql`). Утренний дайджест **упразднён** — бизнесу нужны только вечерние отчёты (business-report + tech-evening-report, оба через GitHub Actions). |
| `supabase/functions/notify-booking/index.ts:53` | Ссылка на Supabase Dashboard облака в письме | **НЕ менял** (Edge Function не задеплоена и в рантайме не вызывается). Если будете деплоить — заменить на ссылку Studio self-host или убрать. |
| `src/middleware.ts:8-9` | `process.env.NEXT_PUBLIC_SUPABASE_URL/ANON_KEY` | Уже env (не хардкод). При cutover задать эти переменные на новый инстанс. ⚠️ Рассинхрон с `client.ts` (там константы) — историческая особенность, оставлена как есть. |
| `.env.local` | `NEXT_PUBLIC_SITE_URL=https://dogclub-kaluga.ru` | Локальный dev-файл (в git не входит). Старый домен, на прод не влияет. Обновите при желании на `https://lapaclub.ru`. |

**Что НЕ является хардкодом и трогать не нужно:** `next.config.ts` комментарии,
`privacy/page.tsx` (ссылка на `supabase.com/privacy` — юр. документ оператора),
`supabase/config.toml` (локальный CLI-конфиг), URL `api.resend.com` /
`api.telegram.org` (внешние сервисы, не Supabase).

> Все правки выше **не меняют текущее поведение**: env-переменные имеют fallback
> на старые значения, так что до cutover приложение работает как раньше.

---

## Известные нюансы

- **Миграция 014 (cron-дайджест).** Использует `pg_cron`/`pg_net` и **хардкод
  старого облачного URL** `https://zmvoaanwikhztpvdjpty.supabase.co/functions/v1/telegram-bot`.
  Утренний дайджест **упразднён** (бизнесу нужны только вечерние отчёты) —
  cron-задачу нужно удалить (входит в `06-post-migration-fixes.sql`):
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

## Бэкапы self-hosted инстанса

⚠️ **Важно:** на Supabase Cloud бэкапы делались автоматически (Point-in-Time
Recovery / ежедневные снапшоты). После переезда на self-host этого **больше
нет** — резервное копирование становится вашей задачей. Без него потеря диска
Amvera = потеря всех данных и файлов. Настройте бэкапы **сразу** после миграции.

Бэкапить нужно **две** вещи:
1. **База данных** (пользователи, брони, профили, питомцы — все ПДн).
2. **Файлы Storage** (бакеты `passports`, `gallery`, `blog` — фото ветпаспортов,
   галерея, обложки блога). В БД лежат только метаданные/ссылки, сами файлы — в
   volume `storage-data`.

### Разовый бэкап БД
```bash
# Полный дамп (схема + данные), сжатый. Запускать с сервера Amvera.
docker exec supabase-db \
  pg_dump -U postgres -d postgres --format=custom \
  > "backup-db-$(date +%F).dump"

# Восстановление при необходимости:
#   cat backup-db-YYYY-MM-DD.dump | docker exec -i supabase-db \
#     pg_restore -U postgres -d postgres --clean --if-exists
```

### Разовый бэкап файлов Storage
```bash
# Содержимое volume storage-data в один архив.
docker run --rm \
  -v lapaclub-supabase_storage-data:/data:ro \
  -v "$PWD":/backup alpine \
  tar czf "/backup/backup-storage-$(date +%F).tar.gz" -C /data .
```
> Имя volume — `<project>_storage-data`, где `<project>` = `name:` из
> docker-compose (`lapaclub-supabase`). Проверить: `docker volume ls`.

### Регулярный бэкап (cron)
Раньше это делал Supabase Cloud; теперь — простой cron на сервере. Готовый
скрипт лежит рядом: **`selfhost/backup.sh`** (установка описана в его шапке).

> ⚠️ Старый GitHub Actions `backup.yml` УДАЛЁН (07.2026): он дампил облачную
> базу (не боевую) и хранил дамп с ПДн артефактом на серверах GitHub (США) —
> нарушение локализации 152-ФЗ. Бэкапы теперь только на сервере/в РФ-хранилище.

Содержимое скрипта для справки:
```bash
#!/usr/bin/env bash
set -euo pipefail
DEST=/opt/lapaclub/backups
KEEP_DAYS=14                       # сколько дней хранить копии
mkdir -p "$DEST"
TS=$(date +%F)

# 1) База данных
docker exec supabase-db pg_dump -U postgres -d postgres --format=custom \
  > "$DEST/db-$TS.dump"

# 2) Файлы Storage
docker run --rm -v lapaclub-supabase_storage-data:/data:ro -v "$DEST":/backup \
  alpine tar czf "/backup/storage-$TS.tar.gz" -C /data .

# 3) Ротация: удаляем копии старше KEEP_DAYS
find "$DEST" -name 'db-*.dump'        -mtime +$KEEP_DAYS -delete
find "$DEST" -name 'storage-*.tar.gz' -mtime +$KEEP_DAYS -delete
```
Crontab (ежедневно в 04:00 по серверному времени):
```cron
0 4 * * * /opt/lapaclub/backup.sh >> /var/log/lapaclub-backup.log 2>&1
```

### Хранение копий
- Держите бэкапы **не только** на том же сервере Amvera (диск может умереть
  вместе с инстансом). Скопируйте на отдельное хранилище: второй
  S3-совместимый бакет, Я.Облако Object Storage, или `rsync`/`rclone` на другой
  сервер. Простой вариант — добавить в `backup.sh` шаг `rclone copy "$DEST"
  remote:lapaclub-backups`.
- Для 152-ФЗ резервные копии тоже должны лежать в РФ — выбирайте российское
  хранилище.
- Раз в квартал делайте **тестовое восстановление** на чистый контейнер, чтобы
  убедиться, что дамп рабочий.

---

## Откат

Стек полностью изолирован (отдельные docker volumes `db-data`, `storage-data`).
Снести и начать заново:
```bash
docker compose down -v      # ВНИМАНИЕ: -v удаляет данные БД и файлы
```
Облачный проект Supabase при этом не затрагивается — отключайте его только после
≥2 недель стабильной работы self-host (см. отчёт `lapaclub-152fz-audit.md`).

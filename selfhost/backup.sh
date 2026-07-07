#!/usr/bin/env bash
# Ежедневный бэкап self-hosted Supabase (БД + файлы Storage) НА СЕРВЕРЕ.
#
# Заменяет старый GitHub Actions backup.yml, который: (а) дампил уже
# отключаемую ОБЛАЧНУЮ базу, (б) хранил дамп с ПДн артефактом на серверах
# GitHub (США) — нарушение локализации 152-ФЗ. Бэкапы должны жить в РФ.
#
# Установка (на сервере, где крутится docker compose стек):
#   sudo cp backup.sh /opt/lapaclub/backup.sh && sudo chmod +x /opt/lapaclub/backup.sh
#   crontab -e  →  0 4 * * * /opt/lapaclub/backup.sh >> /var/log/lapaclub-backup.log 2>&1
#
# Копию ВНЕ сервера (обязательно, тоже в РФ — S3 Timeweb/ЯО): раскомментируйте
# блок rclone внизу, настроив remote заранее (rclone config).
set -euo pipefail

DEST="${DEST:-/opt/lapaclub/backups}"
KEEP_DAYS="${KEEP_DAYS:-14}"
VOLUME="${VOLUME:-lapaclub-supabase_storage-data}"   # docker volume ls — проверить имя
TS="$(date +%F)"

mkdir -p "$DEST"

echo "[$(date '+%F %T')] Бэкап БД…"
docker exec supabase-db pg_dump -U postgres -d postgres --format=custom \
  > "$DEST/db-$TS.dump"

echo "[$(date '+%F %T')] Бэкап Storage…"
docker run --rm -v "$VOLUME":/data:ro -v "$DEST":/backup alpine \
  tar czf "/backup/storage-$TS.tar.gz" -C /data .

echo "[$(date '+%F %T')] Ротация (старше $KEEP_DAYS дн.)…"
find "$DEST" -name 'db-*.dump'        -mtime +"$KEEP_DAYS" -delete
find "$DEST" -name 'storage-*.tar.gz' -mtime +"$KEEP_DAYS" -delete

# Копия вне сервера (хранилище в РФ!):
# rclone copy "$DEST" remote:lapaclub-backups --max-age 48h

echo "[$(date '+%F %T')] Готово:"
ls -lh "$DEST" | tail -5

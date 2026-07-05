-- chat_id для рассылки уведомлений: telegram.ts читает
-- telegram_bot_users.chat_id (заполняется вебхуком при первом обращении к боту).
-- В облачной БД колонка была добавлена вручную и в миграции не попала —
-- фиксируем, чтобы self-host собирался из миграций один в один.
alter table public.telegram_bot_users
  add column if not exists chat_id bigint;

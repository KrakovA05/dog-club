-- Включаем расширения
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Утренний дайджест в 9:00 по Москве (06:00 UTC) каждый день
select cron.schedule(
  'morning-digest',
  '0 6 * * *',
  $$
  select net.http_post(
    url     := 'https://zmvoaanwikhztpvdjpty.supabase.co/functions/v1/telegram-bot',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body    := '{"digest": true}'::jsonb
  );
  $$
);

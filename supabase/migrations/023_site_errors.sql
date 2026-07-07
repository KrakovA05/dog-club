-- Таблица телеметрии ошибок. В облаке была создана вручную мимо миграций,
-- из-за чего на self-host отсутствовала: instrumentation.ts молча терял ошибки,
-- а техотчёт/healthcheck всегда показывали «ошибок нет».
create table if not exists public.site_errors (
  id uuid primary key default gen_random_uuid(),
  path text not null,
  method text not null default 'GET',
  error_message text not null,
  error_name text not null default 'Error',
  route_type text,
  created_at timestamptz default now()
);

alter table public.site_errors enable row level security;

-- Только service_role (instrumentation пишет, отчёты читают — оба через service key)
drop policy if exists "site_errors_service_only" on public.site_errors;
create policy "site_errors_service_only" on public.site_errors using (false);

create index if not exists site_errors_created_at_idx on public.site_errors (created_at);

-- Ретеншн 90 дней — как заявлено в политике конфиденциальности (/privacy).
-- pg_cron есть на self-host (shared_preload_libraries); guard — для локальной
-- разработки, где расширения может не быть.
do $$
begin
  begin
    perform cron.unschedule('purge-old-site-errors');
  exception when others then null;
  end;
  perform cron.schedule(
    'purge-old-site-errors',
    '27 3 * * *',
    $job$delete from public.site_errors where created_at < now() - interval '90 days'$job$
  );
exception when others then
  raise notice 'pg_cron недоступен — ретеншн site_errors не создан: %', sqlerrm;
end $$;

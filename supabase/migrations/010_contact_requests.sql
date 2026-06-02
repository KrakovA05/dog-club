create table if not exists contact_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  message text,
  created_at timestamptz default now()
);

alter table contact_requests enable row level security;

-- Любой может отправить заявку (anon insert)
create policy "Anyone can insert contact request"
  on contact_requests for insert
  to anon, authenticated
  with check (true);

-- Только admin видит заявки
create policy "Admins can view contact requests"
  on contact_requests for select
  to authenticated
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  );
